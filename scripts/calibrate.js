#!/usr/bin/env node
// calibrate.js — 폰트·크기 기준 한 페이지당 글자 수 측정 → 목표 분량 계산
//
// 사용 (프로젝트 루트에서):
//   node ~/.claude/skills/book-summary-haebom/scripts/calibrate.js "<폰트>" <반포인트_크기> <목표_쪽수> [앞뒤_구조_쪽=6] [줄간격=320]
//
// 예:
//   node ~/.../calibrate.js "Apple SD Gothic Neo" 22 30 6 320
//   node ~/.../calibrate.js "NanumMyeongjo" 24 20 5 360
//
// ⚠️ 줄간격은 build.js의 LINE_SPACING과 반드시 같은 값을 넘길 것.
//    (저학년 360 / 고학년 320 / 청소년·성인 300 — document-structure.md 연령별 변형)
//    360으로 측정하고 320으로 빌드하면 자/쪽이 ~10% 낮게 잡혀 본문이 체계적으로
//    부족해진다 — 실측에서 첫 빌드가 15쪽 부족해 튜닝 8회를 돈 원인.

const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');
const { execSync } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');

const [,, FONT, SIZE_STR, TARGET_STR, FRONT_BACK_STR = '6', SPACING_STR = '320'] = process.argv;

if (!FONT || !SIZE_STR || !TARGET_STR) {
  console.error('사용: node calibrate.js "<폰트>" <반포인트_크기> <목표_쪽수> [앞뒤_구조_쪽=6] [줄간격=320]');
  console.error('예:   node calibrate.js "Apple SD Gothic Neo" 22 30 6 320');
  console.error('⚠️  줄간격은 build.js의 LINE_SPACING과 같은 값으로.');
  process.exit(1);
}

const SIZE       = parseInt(SIZE_STR, 10);
const TARGET     = parseInt(TARGET_STR, 10);
const FRONT_BACK = parseInt(FRONT_BACK_STR, 10);

// 대표 한국어 산문 2,000자 (공백·구두점 포함, 실제 산문 밀도 반영)
const BASE = '아이는 강가 마을로 내려갔어요. 바구니를 들고 다리를 건너니 낡은 물레방앗간이 나왔어요. ' +
             '마당에는 들꽃이 무릎까지 자랐고 울타리는 한쪽이 기울어져 있었어요. ' +
             '가슴이 콩닥콩닥 뛰었지만 손을 들어 문을 똑똑 두드렸어요. ';
// 12,000자 측정 — pdfinfo는 정수 쪽수만 주므로 샘플이 짧으면(2-3쪽) 자/쪽이
// ±30%까지 튄다. 9-10쪽 규모로 키워 양자화 오차를 ~5%로. (6,000자에서는
// 줄간격 320/360 차이가 같은 5쪽으로 뭉개져 구분 불가였음 — 실측 확인.)
const SAMPLE = BASE.repeat(120).slice(0, 12000);

// 실제 본문은 한 덩어리가 아니라 ~200자 단락의 연속 — 단락 사이 after 여백과
// 마지막 줄 잔여 공간까지 측정에 반영하기 위해 단락으로 쪼개서 빌드한다.
const PARA_LEN = 200;
const PARAS = [];
for (let i = 0; i < SAMPLE.length; i += PARA_LEN) {
  PARAS.push(SAMPLE.slice(i, i + PARA_LEN));
}

// 줄간격은 build.js와 동일 값을 인자로 받는다. after는 helpers.P()와 동일 고정값.
const LINE_SPACING = parseInt(SPACING_STR, 10);
const AFTER        = 120;

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size:   { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: PARAS.map((text) => new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing:   { line: LINE_SPACING, after: AFTER },
      indent:    { firstLine: 240 },
      children:  [new TextRun({ text, font: FONT, size: SIZE })],
    })),
  }],
});

const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-'));
const docxPath = path.join(tmpDir, 'calib.docx');
const pdfPath  = path.join(tmpDir, 'calib.pdf');

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(docxPath, buf);

  try {
    execSync(
      `soffice --headless --convert-to pdf "${docxPath}" --outdir "${tmpDir}"`,
      { stdio: 'pipe' }
    );
  } catch {
    console.error('⚠️  soffice 변환 실패. LibreOffice가 설치됐는지 확인하세요.');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(1);
  }

  let pages;
  try {
    const raw = execSync(`pdfinfo "${pdfPath}"`).toString();
    pages = parseInt(raw.match(/^Pages:\s+(\d+)/m)?.[1] ?? '0', 10);
  } catch {
    console.error('⚠️  pdfinfo 실패. poppler-utils가 설치됐는지 확인하세요.');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(1);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  if (!pages) {
    console.error('⚠️  페이지 수를 읽을 수 없었어요.');
    process.exit(1);
  }

  const cpp        = Math.round(SAMPLE.length / pages);  // chars per page
  const bodyPages  = TARGET - FRONT_BACK;
  const totalChars = bodyPages * cpp;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`폰트  : ${FONT}`);
  console.log(`크기  : ${SIZE / 2}pt  |  줄간격: ${LINE_SPACING} (build.js LINE_SPACING과 일치해야 함)`);
  console.log(`측정  : ${SAMPLE.length.toLocaleString()}자 (${PARAS.length}단락) → ${pages}쪽  (${cpp} 자/쪽)`);
  console.log('───────────────────────────────────────');
  console.log(`목표  : ${TARGET}쪽 전체  (앞뒤 구조 ${FRONT_BACK}쪽)`);
  console.log(`본문  : ${bodyPages}쪽 필요`);
  console.log(`\n✅  본문 총 ~${totalChars} 자 작성하세요.`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}).catch(e => {
  console.error('build 실패:', e.message);
  process.exit(1);
});

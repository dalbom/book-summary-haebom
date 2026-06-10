// build.js — 모듈식 docx 조립 entry
// ────────────────────────────────────────────────────────────────────────────
// 사용:
//   1) 이 디렉터리 골격을 통째로 작업 폴더로 복사:
//      cp -r ~/.claude/skills/book-summary-haebom/assets/modular/* books/{작품명}/
//   2) front/cover.js · front/intro.js · front/characters.js 채움
//   3) chapters/01_*.js, 02_*.js, ... 만듦 (파일명 앞 숫자 = 챕터 순서)
//   4) back/ending.js · glossary.js · questions.js 채움
//   5) build.js 상단의 SETTINGS·OUTPUT_FILENAME 편집
//   6) node build.js
//
// ── 작성 원칙 (재발 방지) ────────────────────────────────────────────────
// 1. 챕터 파일은 파일명 앞 숫자로 정렬. "01_storm.js" "02_potatoes.js" 등.
// 2. 각 챕터 파일 안에서는 시간 순서를 엄격히 지킬 것 (시간 표지가 있는 작품).
//    파일을 닫기 전에 통독해서 검증.
// 3. PB/Sep는 build.js가 알아서 끼움. 챕터 파일 안에서 PB() 직접 호출 금지.
// ────────────────────────────────────────────────────────────────────────────

const { Document, Packer } = require('docx');
const fs = require('fs');
const path = require('path');

// ── 1. 설정 (먼저 setSettings 호출. require들보다 앞에 와야 함) ────────────
const helpers = require('./helpers');

const OUTPUT_FILENAME = '요약본.docx';

helpers.setSettings({
  // 폰트 — 실제 설치된 것 (scripts/list_korean_fonts.sh 로 확인)
  FONT_BODY: 'Pretendard',
  FONT_HEAD: 'Pretendard',

  // 본문 크기 (반포인트):
  //   초등 저학년 24 (12pt) / 고학년 22 (11pt) / 청소년·성인 21 (10.5pt)
  BODY_SIZE: 22,

  // 줄 간격: 초등 저학년 360, 고학년 320, 청소년·성인 300
  // ⚠️  페이지 수 조정용으로 절대 변경 금지. 가독성 기준만으로 결정.
  LINE_SPACING: 320,

  // 이미지 디렉터리 — 챕터에서 Img('xxx.png') 호출 시 기준
  IMAGE_DIR: __dirname,
});

const { PB, Sep, buildFooter } = helpers;

// ── 2. 섹션 모듈 로드 ──────────────────────────────────────────────────────
const cover      = require('./front/cover');
const intro      = require('./front/intro');
const characters = require('./front/characters');

const ending    = require('./back/ending');
const glossary  = require('./back/glossary');
const questions = require('./back/questions');
const endPage   = require('./back/end');

// ── 3. 챕터 자동 발견 (chapters/*.js, 파일명 정렬) ─────────────────────────
// "_template.js" 처럼 _ 로 시작하는 파일은 무시.
const chaptersDir = path.join(__dirname, 'chapters');
const chapterFiles = fs.readdirSync(chaptersDir)
  .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
  .sort();

if (chapterFiles.length === 0) {
  console.error('❌ chapters/ 안에 챕터 파일이 없습니다.');
  process.exit(1);
}

console.log(`📚 ${chapterFiles.length}개 챕터 발견:`);
chapterFiles.forEach((f) => console.log(`   - ${f}`));

// ── 2.5. facts.md 정합성 검사 (Step 5 단일 진실 저장소) ────────────────────
// facts.md의 `### N장.` 헤더 개수가 chapters/*.js 개수와 일치하는지 확인.
// 작업 흐름은 차단하지 않음 — 사용자에게 알리고 진행.
const factsPath = path.join(__dirname, 'facts.md');
if (!fs.existsSync(factsPath)) {
  console.warn('⚠️  facts.md가 없습니다. Step 5(단일 진실 저장소) 누락 — '
    + '본문 작성 전 facts.md를 먼저 만드세요. (references/single-source-of-truth.md)');
} else {
  const factsBody = fs.readFileSync(factsPath, 'utf8');
  const chapterHeaders = (factsBody.match(/^###\s+\d+\s*장/gm) || []).length;
  if (chapterHeaders !== chapterFiles.length) {
    console.warn(`⚠️  facts.md 챕터 개수(${chapterHeaders}) ≠ chapters/*.js 개수(${chapterFiles.length}). `
      + 'facts.md를 먼저 갱신한 뒤 챕터를 재작성하세요.');
  }
}

// ── 4. children 배열 조립 ──────────────────────────────────────────────────
const children = [
  ...cover, PB(),
  ...intro, PB(),
  ...characters, PB(),
];

// 본편 챕터 — 사이에 Sep() 자동 삽입
chapterFiles.forEach((file, i) => {
  const chapter = require(path.join(chaptersDir, file));
  children.push(...chapter);
  if (i < chapterFiles.length - 1) children.push(Sep());
});

// 끝맺는 말 → 부록 1 → 부록 2 → 끝
children.push(
  ...ending,    PB(),
  ...glossary,  PB(),
  ...questions,
  ...endPage,
);

// ── 5. 문서 빌드 ──────────────────────────────────────────────────────────
const S = helpers.getSettings();

const doc = new Document({
  creator: 'book-summary-haebom',
  styles: {
    default: {
      document: {
        run: { font: S.FONT_BODY, size: S.BODY_SIZE },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        size:   { width: 11906, height: 16838 },     // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: { default: buildFooter() },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUTPUT_FILENAME, buf);
  console.log(`\n✅ wrote ${OUTPUT_FILENAME} (${(buf.length / 1024).toFixed(1)} KB)`);
});

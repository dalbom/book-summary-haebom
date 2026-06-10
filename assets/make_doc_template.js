// make_doc_template.js
// ────────────────────────────────────────────────────────────────────────────
// docx-js 기반 한국어 요약본 템플릿 (단일 파일 모드, <20쪽 권장).
// 헬퍼 함수는 스킬 설치 경로의 modular/helpers.js를 그대로 재사용한다.
//
// 사용:
//   cp ~/.claude/skills/book-summary-haebom/assets/make_doc_template.js \
//      books/{작품명}/build.js
//   (cp 권한이 막히면 Read + Write로 대체)
//   cd books/{작품명}/ && node build.js
//
// ── 페이지 분량별 PB 사용 주의 ──────────────────────────────────────────────
// 이 템플릿의 기본 children 구조는 30쪽 이상 기준으로 내부 PB()를 5개 배치한다
// (표지→들어가는말→등장인물→부록1→부록2 사이). 짧은 요청에서는 이 기본값이
// "빈 페이지 채우기"처럼 작용해서 본편을 밀어낸다.
//
//   목표 쪽수  │ 권장 내부 PB 개수
//   ───────────┼──────────────────
//   ≤5쪽       │  1개 (표지 직후만) — 나머지는 Sep() 또는 빈 단락
//   6-10쪽     │  1-2개
//   11-20쪽    │  2-3개
//   21쪽+      │  기본 (4-5개)
//
// 짧은 분량 작업 시 children 배열에서 PB()를 줄이고, 대신 섹션 사이에 Sep()
// 또는 new Paragraph({ spacing: { before: 360 } }) 같은 여백 단락을 넣어라.
// 상세 가이드: references/document-structure.md §"초단편 가이드(≤10쪽)"
//
// 헬퍼 시그니처는 assets/modular/helpers.js 한 곳에서만 관리된다.
// 새 헬퍼·옵션이 필요하면 거기서 추가하고 여기서는 import만.
// ────────────────────────────────────────────────────────────────────────────

const path = require('path');
const os = require('os');
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

// ── 헬퍼 로드 (스킬 설치 경로) ──────────────────────────────────────────────
// 다른 경로에 설치했다면 SKILL_DIR만 바꾸면 된다.
const SKILL_DIR = path.join(os.homedir(), '.claude/skills/book-summary-haebom');
const helpers = require(path.join(SKILL_DIR, 'assets/modular/helpers'));

// ── 설정 ───────────────────────────────────────────────────────────────────
const OUTPUT_FILENAME = '요약본.docx';   // ← 여기만 바꿔서 쓰면 됨
const TITLE           = '제목';
const AUTHOR          = '원저자';
const ORIGINAL_TITLE  = '원제';
const SUBTITLE        = '부제';

helpers.setSettings({
  // 폰트 — 실제 설치된 것 (scripts/list_korean_fonts.sh 또는 check-env.js로 확인)
  //   - 'Pretendard'                (현대 고딕, 기본 권장)
  //   - 'Apple SD Gothic Neo'       (macOS 기본)
  //   - 'KoPubWorld Batang'         (전통 책느낌)
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

const {
  P, Dialog, Note, Quote, H1, H2, Sep, PB, Img,
  Cover, Appendix, buildFooter, getSettings,
} = helpers;

// ── 원고 ───────────────────────────────────────────────────────────────────
// 아래 children 배열을 편집해서 실제 요약본 내용으로 채운다.
// 순서는 references/document-structure.md §"기본 골격" 따른다:
//   1. 표지 → 2. 목차(선택) → 3. 들어가는 말 → 4. 등장인물 → 5. 본편
//   6. 이야기 속의 이야기(선택) → 7. 끝맺는 말 → 8. 부록1 → 9. 부록2 → 10. 끝
const children = [
  // 1. 표지
  ...Cover({
    title: TITLE,
    author: AUTHOR,
    originalTitle: ORIGINAL_TITLE,
    subtitle: SUBTITLE,
  }),
  PB(),

  // 3. 들어가는 말 — 책 소개 + 도입부 후크 (메타 정보 금지)
  //    필수: 원작 제목(한국어/원어), 원저자, 출간 연도, 1-2장 도입부 추리기
  //    금지: 줄인 비율, 시점, 순화 내용, 부록·단어 사전·이야기 나눌 거리 안내
  //    상세: references/document-structure.md §3
  H1('들어가는 말'),
  P('원저자가 OOOO년에 펴낸 『원제』를 [대상 독자]를 위해 다시 옮겼어요. 한 줄로 작품 결을 짚어 주세요.', { firstLine: true }),
  P('주인공이 누구이고 1-2장에서 어떤 상황에 놓이는지 한 단락. 결말이나 핵심 반전은 흘리지 말 것.', { firstLine: true }),
  PB(),

  // 4. 등장인물 소개
  H1('등장인물'),
  P('주인공 이름', { bold: true }),
  P('주인공 소개 한두 줄.', { firstLine: true }),
  P(''),
  P('두 번째 인물', { bold: true }),
  P('역할과 성격 한두 줄.', { firstLine: true }),
  PB(),

  // 5. 본편 ── 챕터들 ──
  H1('1. 첫 번째 장 제목'),
  P('본문 첫 문단.', { firstLine: true }),
  P('본문 두 번째 문단.', { firstLine: true }),
  Dialog('어린 왕자', '안녕, 아저씨!'),
  Sep(),  // ← 페이지 나누기 아님. 챕터 사이의 자연스러운 숨.

  H1('2. 두 번째 장 제목'),
  P('두 번째 장 시작.', { firstLine: true }),
  Sep(),

  // 예: 핵심 문장을 강조하고 싶을 때
  Quote('가장 중요한 것은 눈에 보이지 않아.'),

  // 7. 끝맺는 말
  H1('끝맺는 말'),
  P('이야기의 여운.', { firstLine: true }),
  PB(),

  // 8. 부록 1 ── 용어 사전
  ...Appendix('부록 1. 어려운 단어 사전', [
    { term: '소행성', meaning: '태양 주위를 도는 아주 작은 별.' },
    { term: '길들이다', meaning: '마음을 주고받아 서로에게 특별해지는 것.' },
  ]),
  PB(),

  // 9. 부록 2 ── 토론 질문
  ...Appendix('부록 2. 같이 이야기해 볼 거리', [
    '내가 길들이고 싶은 친구나 물건이 있나요?',
    '어린 왕자가 만난 어른 중 누가 가장 기억에 남나요?',
    '눈에 보이지 않지만 나에게 가장 소중한 것은 무엇인가요?',
  ]),

  // 10. 끝 페이지 — PB 넣지 않음 (부록 마지막에 이어서 배치)
  new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 3600 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '— 끝 —', font: getSettings().FONT_BODY, size: 36, italics: true })],
  }),
];

// ── 문서 빌드 ──────────────────────────────────────────────────────────────
const S = getSettings();

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
        size:   { width: 11906, height: 16838 },              // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    footers: { default: buildFooter() },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUTPUT_FILENAME, buf);
  console.log(`✅ wrote ${OUTPUT_FILENAME} (${(buf.length / 1024).toFixed(1)} KB)`);
});

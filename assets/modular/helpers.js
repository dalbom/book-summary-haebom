// helpers.js
// ────────────────────────────────────────────────────────────────────────────
// 모든 챕터/섹션 모듈이 require()로 가져다 쓰는 공용 헬퍼.
// 폰트·크기·줄간격은 여기서 한 번만 정의하고, build.js에서 SETTINGS 객체로
// 주입(setSettings)한다. 챕터 모듈은 SETTINGS를 직접 건드리지 않는다.
// ────────────────────────────────────────────────────────────────────────────

const {
  Paragraph, TextRun, AlignmentType, HeadingLevel,
  PageBreak, Footer, PageNumber, ShadingType, ImageRun,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── 기본 설정 (build.js에서 setSettings로 덮어씀) ─────────────────────────
let SETTINGS = {
  FONT_BODY: 'Pretendard',
  FONT_HEAD: 'Pretendard',
  BODY_SIZE: 22,            // 반포인트 단위 (22 = 11pt)
  HEADING_SIZE: 32,
  COVER_TITLE_SIZE: 72,
  LINE_SPACING: 320,        // 1.6× — 가독성 기준 고정. 페이지 수 조정에 쓰지 말 것.
  IMAGE_DIR: '.',           // 챕터에서 Img('xxx.png') 호출 시 기준 디렉터리
};

function setSettings(overrides = {}) {
  SETTINGS = { ...SETTINGS, ...overrides };
}

function getSettings() {
  return SETTINGS;
}

// ── 본문 헬퍼 ────────────────────────────────────────────────────────────
function P(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    spacing: { line: SETTINGS.LINE_SPACING, after: 120 },
    indent: opts.firstLine ? { firstLine: 240 } : undefined,
    children: [
      new TextRun({
        text: String(text),
        font: SETTINGS.FONT_BODY,
        size: SETTINGS.BODY_SIZE,
        bold: !!opts.bold,
        italics: !!opts.italic,
      }),
    ],
  });
}

// Dialog는 시나리오/희곡 형식으로 렌더된다: **화자:** "대사"
// (이전 형식 "..." 화자 는 같은 인물명이 두 번 인접 등장할 때 어색해서 폐기.)
// 화자 이름은 굵게 표시해 한눈에 들어오게 한다.
function Dialog(speaker, line) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: SETTINGS.LINE_SPACING, after: 120 },
    indent: { firstLine: 240 },
    children: [
      new TextRun({
        text: speaker ? `${speaker}: ` : '',
        font: SETTINGS.FONT_BODY,
        size: SETTINGS.BODY_SIZE,
        bold: true,
      }),
      new TextRun({
        text: `"${line}"`,
        font: SETTINGS.FONT_BODY,
        size: SETTINGS.BODY_SIZE,
      }),
    ],
  });
}

function Note(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: SETTINGS.LINE_SPACING, before: 240, after: 240 },
    shading: { type: ShadingType.CLEAR, fill: 'F5F2E8' },
    border: {
      left:   { style: 'single', size: 12, color: 'C8B88A', space: 8 },
      right:  { style: 'single', size: 4,  color: 'EEE3C0', space: 8 },
      top:    { style: 'single', size: 4,  color: 'EEE3C0', space: 8 },
      bottom: { style: 'single', size: 4,  color: 'EEE3C0', space: 8 },
    },
    children: [new TextRun({
      text, font: SETTINGS.FONT_BODY, size: SETTINGS.BODY_SIZE, italics: true,
    })],
  });
}

function Quote(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: SETTINGS.LINE_SPACING, before: 240, after: 240 },
    indent: { left: 720, right: 720 },
    children: [
      new TextRun({
        text: `"${text}"`,
        font: SETTINGS.FONT_BODY,
        size: SETTINGS.BODY_SIZE,
        italics: true,
      }),
    ],
  });
}

function H1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.LEFT,
    spacing: { before: 480, after: 240, line: SETTINGS.LINE_SPACING },
    children: [
      new TextRun({
        text, font: SETTINGS.FONT_HEAD, size: SETTINGS.HEADING_SIZE, bold: true,
      }),
    ],
  });
}

function H2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 360, after: 180, line: SETTINGS.LINE_SPACING },
    children: [
      new TextRun({
        text, font: SETTINGS.FONT_HEAD, size: 26, bold: true,
      }),
    ],
  });
}

function Sep() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 360, line: SETTINGS.LINE_SPACING },
    children: [
      new TextRun({
        text: '✦ ✦ ✦', font: SETTINGS.FONT_BODY, size: SETTINGS.BODY_SIZE,
      }),
    ],
  });
}

function PB() {
  // PageBreak는 반드시 TextRun으로 감싸야 한다.
  // 직접 Paragraph.children에 PageBreak만 넣으면 직후 paragraph가 inline drawing(이미지)인 경우
  // 빈 paragraph로 변환되어 페이지 break가 누락된다 — 등장인물 → 챕터1(Img) 사이 빈 페이지 발생 사례.
  return new Paragraph({
    children: [new TextRun({ children: [new PageBreak()] })],
  });
}

// ── 이미지 ────────────────────────────────────────────────────────────────
// filename 은 SETTINGS.IMAGE_DIR 기준 상대경로 또는 절대경로.
// width/height 는 픽셀(96 DPI). 16:9 기본 크기는 A4 본문 폭에 맞춤.
function Img(filename, opts = {}) {
  const fullPath = path.isAbsolute(filename)
    ? filename
    : path.join(SETTINGS.IMAGE_DIR, filename);

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 240 },
    children: [
      new ImageRun({
        data: fs.readFileSync(fullPath),
        transformation: {
          width: opts.width ?? 595,
          height: opts.height ?? 335,
        },
        type: 'png',
      }),
    ],
  });
}

// ── 표지 / 부록 빌더 ──────────────────────────────────────────────────────
function Cover({ title, author, originalTitle, subtitle }) {
  return [
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { before: 2400 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({
        text: title,
        font: SETTINGS.FONT_HEAD,
        size: SETTINGS.COVER_TITLE_SIZE,
        bold: true,
      })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({
        text: `${author}의 이야기`,
        font: SETTINGS.FONT_BODY,
        size: 28,
      })],
    }),
    subtitle ? new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 720, after: 240 },
      children: [new TextRun({
        text: subtitle,
        font: SETTINGS.FONT_BODY,
        size: 24,
        italics: true,
      })],
    }) : null,
    originalTitle ? new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200 },
      children: [new TextRun({
        text: `— ${originalTitle} —`,
        font: SETTINGS.FONT_BODY,
        size: 20,
        italics: true,
      })],
    }) : null,
  ].filter(Boolean);
}

function Appendix(title, entries) {
  // entries: [{ term, meaning }] or ['질문1', '질문2', ...]
  const items = [H1(title)];
  for (const e of entries) {
    if (typeof e === 'string') {
      items.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: SETTINGS.LINE_SPACING, after: 120 },
        bullet: { level: 0 },
        children: [new TextRun({
          text: e, font: SETTINGS.FONT_BODY, size: SETTINGS.BODY_SIZE,
        })],
      }));
    } else {
      items.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: SETTINGS.LINE_SPACING, after: 60 },
        children: [new TextRun({
          text: e.term,
          font: SETTINGS.FONT_BODY,
          size: SETTINGS.BODY_SIZE,
          bold: true,
        })],
      }));
      items.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: SETTINGS.LINE_SPACING, after: 180 },
        indent: { left: 360 },
        children: [new TextRun({
          text: e.meaning,
          font: SETTINGS.FONT_BODY,
          size: SETTINGS.BODY_SIZE,
        })],
      }));
    }
  }
  return items;
}

// ── 푸터 (가운데 페이지 번호) ─────────────────────────────────────────────
function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            children: [PageNumber.CURRENT],
            font: SETTINGS.FONT_BODY,
            size: 18,
          }),
        ],
      }),
    ],
  });
}

module.exports = {
  setSettings, getSettings,
  P, Dialog, Note, Quote, H1, H2, Sep, PB, Img,
  Cover, Appendix, buildFooter,
};

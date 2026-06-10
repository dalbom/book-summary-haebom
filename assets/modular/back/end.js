// back/end.js — "— 끝 —" 페이지
// ────────────────────────────────────────────────────────────────────────────
// 한 페이지 가운데 정렬, "— 끝 —"만 크게.
// ⚠️  build.js 가 require('./back/end') 하기 전에 setSettings를 먼저 호출해야 함.
// ────────────────────────────────────────────────────────────────────────────

const { Paragraph, TextRun, AlignmentType } = require('docx');
const { getSettings } = require('../helpers');

const S = getSettings();

module.exports = [
  new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { before: 3600 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({
      text: '— 끝 —',
      font: S.FONT_BODY,
      size: 36,
      italics: true,
    })],
  }),
];

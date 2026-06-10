#!/usr/bin/env bash
# build_and_check.sh — Build docx, convert to PDF, measure actual page count.
#
# Usage:
#   bash build_and_check.sh <output_docx> <target_pages>
#
# Examples:
#   bash build_and_check.sh 어린왕자_요약.docx 40
#   bash build_and_check.sh 날으는마법의침대_요약.docx 40
#
# Expected files in CWD:
#   build.js   — the docx-js script that writes <output_docx>
#
# Expected tools:
#   node, npm, soffice (LibreOffice), pdfinfo (poppler)
#
# Behavior:
#   1. node build.js           → writes .docx
#   2. soffice --headless      → converts to .pdf (same basename)
#   3. pdfinfo                 → counts pages
#   4. compares to target      → prints delta and suggests action
#
# Exit codes:
#   0 — actual pages within ±1 of target (ship)
#   1 — setup error (missing tool, missing build.js, build failure)
#   2 — short of target by 2+ pages (expand content)
#   3 — over target by 2+ pages (compress content)
#
# Calling from `set -e` parent: wrap with `|| true` and inspect $? yourself.
# Example: `bash build_and_check.sh foo.docx 40 || true; code=$?`

set -e

DOCX="${1:?usage: build_and_check.sh <output_docx> <target_pages>}"
TARGET="${2:?usage: build_and_check.sh <output_docx> <target_pages>}"
BASENAME="${DOCX%.docx}"
PDF="${BASENAME}.pdf"

# --- 1. Preflight checks ---
command -v node    >/dev/null 2>&1 || { echo "❌ node not found. Install Node.js."; exit 1; }
command -v soffice >/dev/null 2>&1 || { echo "❌ soffice not found. brew install --cask libreoffice"; exit 1; }
command -v pdfinfo >/dev/null 2>&1 || { echo "❌ pdfinfo not found. brew install poppler"; exit 1; }

[ -f build.js ] || { echo "❌ build.js missing in CWD. Copy assets/make_doc_template.js first."; exit 1; }

# --- 2. Install docx if needed ---
if ! [ -d node_modules/docx ]; then
    echo "📦 installing docx package..."
    [ -f package.json ] || npm init -y > /dev/null 2>&1
    npm install docx --silent > /dev/null 2>&1
fi

# --- 3. Build docx ---
echo "🔨 building $DOCX..."
node build.js

[ -f "$DOCX" ] || { echo "❌ build.js did not produce $DOCX"; exit 1; }

# --- 4. Convert to PDF ---
echo "📄 converting to PDF..."
rm -f "$PDF"
soffice --headless --convert-to pdf "$DOCX" > /dev/null 2>&1
[ -f "$PDF" ] || { echo "❌ PDF conversion failed"; exit 1; }

# --- 5. Measure pages ---
PAGES=$(pdfinfo "$PDF" | awk '/^Pages:/ {print $2}')
DELTA=$((PAGES - TARGET))

echo ""
echo "──────────────────────────────────────────"
echo "  DOCX:    $DOCX"
echo "  PDF:     $PDF"
echo "  Pages:   $PAGES"
echo "  Target:  $TARGET"
echo "  Delta:   $DELTA"
echo "──────────────────────────────────────────"

# --- 6. Report ---
ABS_DELTA=$DELTA
[ $ABS_DELTA -lt 0 ] && ABS_DELTA=$((-ABS_DELTA))

if [ $ABS_DELTA -le 1 ]; then
    echo "✅ Within ±1 page tolerance. Ship it."
    exit 0
elif [ $DELTA -lt 0 ]; then
    SHORT=$((-DELTA))
    echo "⚠️  $SHORT page(s) short. See references/page-tuning.md §'부족할 때'."
    echo "    Try: (1) expand dialogue scenes, (2) add emotion paragraphs,"
    echo "         (3) extend appendix entries, (4) add detail to key scenes."
    exit 2
else
    echo "⚠️  $DELTA page(s) over. See references/page-tuning.md §'초과할 때'."
    echo "    Try: (1) tighten descriptions, (2) compress dialogue,"
    echo "         (3) merge short chapters, (4) cut duplicate imagery."
    exit 3
fi

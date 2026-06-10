#!/usr/bin/env bash
# list_korean_fonts.sh — 시스템에 설치된 한국어 폰트 목록 출력
#
# 사용: bash ~/.claude/skills/book-summary-haebom/scripts/list_korean_fonts.sh
#
# 출력 예:
#   Apple SD Gothic Neo
#   KoPubWorld Batang
#   NanumGothic
#   NanumMyeongjo

fc-list :lang=ko --format="%{family}\n" 2>/dev/null | tr ',' '\n' | sed 's/^ *//' | sort -u

# fc-list 없으면 (macOS 시스템 폰트 대안)
if ! command -v fc-list &>/dev/null; then
  echo "(fc-list 없음 — fontconfig 설치 필요: brew install fontconfig)" >&2
  echo "macOS 기본 한국어 폰트 후보:"
  for f in \
    "/System/Library/Fonts/AppleSDGothicNeo.ttc" \
    "/Library/Fonts/NanumGothic.ttf" \
    "/Library/Fonts/NanumMyeongjo.ttf" \
    "/Library/Fonts/NanumBarunpen.ttf" \
    "$HOME/Library/Fonts/KoPubWorldBatang_Pro_Light.otf" \
    "$HOME/Library/Fonts/Pretendard-Regular.otf"; do
    [[ -f "$f" ]] && basename "$f" | sed 's/\.[a-zA-Z]*$//'
  done
fi

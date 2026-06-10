# 책 요약해봄

한국어로 기존 문학 작품(소설·동화·아동문학)을 정해진 페이지 수의 `.docx` 요약본으로 만들어 주는 [Claude Code](https://claude.com/claude-code) 스킬.

- **페이지 수 정밀 맞추기** — 강제 page break가 아니라 콘텐츠 밀도로 ±1쪽 안쪽 수렴
- **모듈식 빌드 (≥20쪽)** — 챕터별 파일로 분리해서 시간선 도치·예산 초과를 구조적으로 차단
- **번역투 + AI 느낌 두 축 검수** — 영어 직역 흔적 제거 + LLM 생성 패턴 제거
- **민감 콘텐츠 처리를 사용자와 합의** — 죽음·폭력·구시대 묘사는 원작대로/순화/삭제 중 선택
- **일관된 삽화** — 7가지 프리셋(1960년대 영국 수채화, 지브리, 1990년대 한국 아동서 등) 공통 프리픽스로 화풍 통일. [codex-image](#삽화-자동-생성-선택-사항) 설치 시 docx에 자동 임베드까지.
- **어린이·청소년·성인 연령별 템플릿**

## ⚠️ 면책 조항

- 이 저장소는 어떠한 기존 도서의 **요약본·각색본도 배포하지 않습니다.** 스킬은 사용자의 요청을 받아 **사용자 본인의 환경에서** docx 파일을 생성하는 도구일 뿐입니다.
- 요약·각색 대상은 반드시 **사용자가 적법하게 구입했거나 권리를 보유한 책**에 한정해서 사용해 주세요. 저작권자 허락 없는 배포·재가공·상업적 이용은 저작권법 위반입니다.
- 이 도구를 사용해 생성된 파일의 저작권 침해, 명예훼손, 기타 법적·윤리적 문제에 대해 **저장소 작성자는 어떠한 책임도 지지 않습니다.** 사용 여부와 결과물 활용에 대한 책임은 전적으로 사용자에게 있습니다.

## 설치

```bash
# Claude Code 사용자용 (macOS/Linux)
git clone https://github.com/dalbom/book-summary-haebom.git ~/.claude/skills/book-summary-haebom
```

다음 대화에서 자동으로 인식됩니다. 직접 트리거하려면 "OO 책 요약해서 .docx로 만들어줘" 식으로 요청하면 됩니다.

## 워크플로우 (요약)

| 단계 | 내용 |
|---|---|
| **Step 0** | **원작 확인** — 알면: 한 줄 요약 제시 후 사용자 확인 / 모르면: pre-flight에 Q0(줄거리 요청) 추가 |
| **Step 1** | **환경 점검** — 설치된 한국어 폰트 / codex-image / soffice·pdfinfo 가용성을 `state/settings.json`에 캐시. 폰트 목록은 Step 2 Q10 후보로 사용 |
| **Step 2** | Pre-flight 인터뷰 (Q1~Q11: 원작·페이지·연령·챕터·대화·민감·톤·삽화·개인화·폰트·통독 점검 — 각 항목 기본값 표시) |
| **Step 3** | `calibrate.js`로 페이지당 글자 수 측정 + ≥20쪽이면 `budget.js`로 챕터별 자수 분배 |
| **Step 4** | 문서 골격 결정 (10섹션 기본 / 초단편 ≤10쪽 축약 가이드) |
| **Step 5** | `docx-js` 빌드 — <20쪽 단일 파일 / ≥20쪽 모듈식(`assets/modular/`). Q8=C이면 placeholder PNG 5장 복사 + 챕터에 `Img()` 호출 박음 |
| **Step 6** | 빌드 → PDF 변환 → `pdfinfo` 측정 루프 (±1쪽까지). 단락 추가 직후 3-단락 윈도 재독으로 도입 중복 즉시 점검 |
| **Step 7** | 번역투 패스 (`그녀/그` 남용, 직역투 어미, 시대극체 등) |
| **Step 8** | **AI 느낌 패스** (`여운/울림/깊은` 고빈도 어휘, `-며` tag-on, 삼원구조, 일반론 마무리 등) → Step 6 재진입 |
| **Step 9** | **통독 점검** (Q11=Y일 때만) — 챕터별 처음부터 끝까지 다시 읽기. 중복 도입·시간 표지·인물 일관성 → 수정 시 Step 6 재진입 |
| **Step 10** | 삽화 — Q8 (B) 프롬프트만 / (C) codex-image이 placeholder 자리에 진짜 이미지 덮어쓰기. **placeholder 트릭으로 Step 6 재진입 불필요** |

전체 상세는 [`SKILL.md`](SKILL.md) 참조.

## 구조

```
.
├── SKILL.md                       # 메인 스킬 정의 + 워크플로우 + Red Flags + Rationalizations
├── references/
│   ├── style-guide-ko.md          # Step 7: 한국어 번역투 15패턴
│   ├── ai-ness-ko.md              # Step 8: AI 느낌 13패턴 (humanizer 스킬의 한국어 버전)
│   ├── document-structure.md      # 문서 골격 + 연령별 변형 + 초단편 가이드 + 모듈식 빌드
│   ├── page-tuning.md             # 확장/압축 전술과 예상 페이지 변화 테이블
│   ├── illustration-prompts.md    # 7개 화풍 프리셋 + 감정 정점 선정 가이드
│   └── sensitive-content.md       # 죽음·폭력·구시대 묘사 처리 방침
├── scripts/
│   ├── build_and_check.sh         # node → soffice → pdfinfo 원커맨드
│   ├── calibrate.js               # 폰트·크기 기준 페이지당 글자 수 측정
│   ├── budget.js                  # 챕터별 자수 분배 (균등/가중치)
│   ├── check-env.js               # 폰트 / codex-image / 도구 가용성 감지 → state/settings.json
│   └── list_korean_fonts.sh       # fc-list 한국어 폰트 나열
└── assets/
    ├── illustration_placeholder.png # 16:9 회색 placeholder. Step 5에서 복사해 Step 10 전까지 자리 잡음
    ├── make_doc_template.js       # 단일 파일 템플릿 (<20쪽)
    └── modular/                   # 모듈식 템플릿 (≥20쪽)
        ├── build.js               # 메인 entry — setSettings + chapters/*.js 자동 조립
        ├── helpers.js             # P/Dialog/H1/Sep/PB/Img/Cover/Appendix
        ├── front/                 # cover, intro, characters
        ├── chapters/              # 01_xxx.js, 02_xxx.js, ... (TARGET 자수 명시)
        └── back/                  # ending, glossary, questions, end
```

`state/` 디렉터리는 환경 감지·진행 추적용 로컬 캐시. git에는 포함되지 않습니다.

## 사용 예시

```
사용자: 『나의 라임오렌지나무』를 초등 고학년용으로 35쪽 요약해줘. 삽화 프롬프트 4장도.

Claude: [스킬 트리거 → Step 0: "브라질 소년 제제가 라임오렌지나무에 친구를 투영하는 성장 이야기 — 맞나요?" + pre-flight 질문]

사용자: [원작 확인 + 각 문항에 답변]

Claude: [문서 골격 → build.js 생성 → build_and_check.sh 루프로 35±1쪽 수렴 →
         번역투 패스 → AI 느낌 패스 → 페이지 재확인 → 삽화 프롬프트 파일 생성]
```

출력물 (`books/나의라임오렌지나무/`):
- `나의라임오렌지나무_요약.docx`
- `나의라임오렌지나무_삽화_프롬프트.md`

Claude: "완료됐어요. 파일은 `books/나의라임오렌지나무/` 폴더에 있어요."

## 삽화 자동 생성 (선택 사항)

기본은 **삽화 프롬프트 파일**만 만들어 둡니다. 그림은 사용자가 원하는 도구로 직접 만들면 됩니다. 다음 세 가지가 모두 갖춰지면 docx에 그림까지 자동 임베드됩니다:

1. **OpenAI Codex CLI 설치**: `npm install -g @openai/codex`
2. **OpenAI 계정 로그인**: `codex login`
3. **codex-image-in-cc 플러그인 설치** (Claude Code 마켓플레이스)

세 가지 중 하나라도 빠지면 스킬은 조용히 프롬프트 파일만 만들고 한 줄 안내합니다 (*"codex-image이 없어서 이미지 자동 생성은 건너뛰고 프롬프트 파일만 만들어 두었어요"*). 필수 의존성이 아닙니다.

## 크레딧

- Step 6 AI 느낌 패스는 Wikipedia: *Signs of AI writing* (WikiProject AI Cleanup)에 정리된 24개 패턴 중 한국어·아동문학 맥락에 유효한 13개를 재번역·적응한 것입니다. 영문 원형은 Claude Code 생태계의 `humanizer` 스킬에서 찾을 수 있습니다.

## 라이선스

MIT

---
name: book-summary-haebom
description: Use when the user asks to summarize or adapt an existing novel, fairy tale, film, or literary work into a Korean .docx file — especially if a target page count, reader age (child/teen/adult), or illustration prompts are mentioned. Triggers on "OO 책을 요약해서 .docx로 만들어줘", "아이가 읽을 수 있게 OO 정리본", "N페이지 분량의 요약본", "OO 어린이용 요약", "OO 영화를 책으로 만들어줘", or any Korean literary-work/film abridgement/adaptation export. Over-trigger rather than under-trigger.
---

# book-summary-haebom

## Overview

Turn an existing literary work into a Korean summary/adaptation shipped as a polished `.docx` in the current working directory. The writing itself is not the hard part. The hard parts are:

1. Hitting a **precise page count** (not by forcing page breaks — by content density)
2. Producing **natural Korean**, not translation-ese
3. Making **judgment calls** (softening, tone, chapter structure, illustration style) **with the user**, never silently
4. Consistent **illustration prompts** across scenes when requested

## Iron Law: Never Skip Pre-flight

Baseline testing shows the #1 failure mode is **silent assumptions**. A naive agent decides reader age, tone, chapter structure, how to handle sensitive scenes, and illustration style on its own — then produces a product the user has to re-do. Do not do this. Ask first. Build second.

**No writing until the user has answered pre-flight.** Not even a draft. Not even a sample chapter.

## Workflow

전체 흐름: **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 7 재진입 → 10 → 7 재진입 → 11 → 배송**

`7` 페이지 튜닝 루프는 본문이 압축·확장될 때마다 재진입한다. `11` 삽화 단계는 placeholder 덮어쓰기로 페이지 수 변동이 없어 재진입 불필요.

---

### Step 0 — 원작 확인 (REQUIRED)

사전 인터뷰 메시지를 보내기 전에 한 가지를 답한다: **이 작품의 플롯과 캐릭터를 신뢰할 만하게 알고 있는가?**

**YES — 알고 있는 책:**
- Step 2 사전 인터뷰 메시지 첫 줄에 한 줄 줄거리 요약을 쓰고 사용자에게 맞는지 확인 요청.
- 예: "『어린 왕자』: 사막에 불시착한 조종사가 소행성 B-612에서 온 어린 왕자를 만나는 이야기 — 맞나요?"
- 사용자가 확인하면 → 진행. 사용자가 수정하면 → 수정된 정보로 진행.

**NO — 모르거나 확신이 없는 책:**
- Step 2 인터뷰에 Q0을 추가한다: **"0. 원작 내용** — 줄거리 요점 또는 본문을 공유해 주세요. 짧은 줄거리도 충분해요."
- Q0을 다른 질문들과 같은 메시지에 포함해서 한 번에 묻는다.

**절대 하지 말 것:** 아는 것 같다는 느낌으로 플롯·캐릭터를 창작하거나 채워 넣기. 한국 아동도서·지역 출판물은 AI 학습 데이터에 없을 수 있다.

**표준 번역어·명대사 (영화·번역 소설 원작일 때):** 한국어 정식 자막·번역본이 있는 작품이면 그 표준 용어와 주요 명대사의 한국어 형태를 facts.md §표준 용어·명대사 섹션에 미리 옮긴다. 작업 중 임의 의역 금지 — 표준 의미와 어긋나지 않게 인용한다 (예: Event Horizon을 표준 "사건의 지평선" 대신 "사상의 지평선"으로 옮긴 혼선, 명대사 의미가 반대로 뒤집힌 의역이 실측에서 발생). 한국어 창작이거나 정식 번역본 없으면 생략.

---

### Step 1 — 환경 점검 (REQUIRED, Step 2 직전)

**목적:** 사용 가능한 한국어 폰트와 codex-image 가용 여부를 미리 확인해 사전 인터뷰를 정확하게 구성하기 위함. 매 세션 한 번만.

1. `~/.claude/skills/book-summary-haebom/state/settings.json` 을 읽는다.
2. 파일이 없거나 `checked_at`이 7일 이상 묵었으면 재생성:
   ```bash
   node ~/.claude/skills/book-summary-haebom/scripts/check-env.js
   ```
3. 결과는 `state/settings.json`에 캐시.

**check-env.js가 자동으로 처리하는 것:**
- macOS의 다운로드 가능 한글 폰트(나눔고딕/명조/손글씨/붓글씨, 배달의민족 도현/주아/한나 시리즈, Cafe24 숑숑, GungSeo, HeadLineA, PCMyungjo, PilGi 등)는 Apple이 `/System/Library/AssetsV2/com_apple_MobileAsset_Font8/` 에 두는데 fontconfig가 그 경로를 스캔하지 않아 LibreOffice 빌드 파이프라인에서 누락된다.
- check-env.js가 `system_profiler`로 CoreText가 보는 한글 폰트를 전수 수집해, fontconfig가 못 보는 것만 골라 `~/.book-summary-skill/fonts/` 에 심링크하고 `~/.config/fontconfig/conf.d/99-book-summary-haebom.conf` 를 만들어 fontconfig에 노출한다. **이 디렉터리는 fontconfig 전용이라 Word·Font Book·Pages·Adobe 등 CoreText 기반 앱은 영향을 받지 않는다 (중복 표시 없음).**
- macOS 업데이트로 asset hash가 바뀌어 깨진 심링크가 생기면 다음 실행 때 자동으로 정리된다.

**settings.json 스키마 (v2):**
```json
{
  "schema_version": 2,
  "checked_at": "ISO8601",
  "fonts": ["나눔고딕", "Pretendard", ...],
  "asset_activation": {
    "links_dir": "/Users/.../.book-summary-skill/fonts",
    "conf_file": "/Users/.../.config/fontconfig/conf.d/99-book-summary-haebom.conf",
    "added": 14, "kept": 0, "removed_dangling": 0,
    "conf_written": true, "cache_refreshed": true
  },
  "codex_image": { "available": true, "path": "..." },
  "codex_cli_plugin": { "available": true },
  "tools": { "node": true, "soffice": true, "pdfinfo": true, "fc-list": true, "fc-cache": true, "system_profiler": true }
}
```

이 결과를 바탕으로 **Step 2 사전 인터뷰**를 다음과 같이 구성한다:
- **Q8 (삽화 처리)** — `codex_image.available === false` 이면 (C) 옵션 제거.
- **Q10 (폰트)** — `fonts` 배열을 그대로 보기로 제시한다. **본문 적합도(장식체 여부 등) 판단은 사용자에게 위임** — 임의로 거르지 않는다. 다만 다음 룰만 적용:
  - 시스템 내부 폰트(이름이 `.`으로 시작) 제외
  - 모노스페이스(D2Coding 등) 제외 — 본문엔 부적합
  - 순 Latin 폰트(Arial Unicode MS 등) 제외
  - **그 외(나눔손글씨·붓글씨, 카페24 숑숑, BM 시리즈 등)는 모두 후보로 제시**. 본문 크기로도 쓸 수 있는지는 사용자가 안다.

---

### Step 2 — 사전 인터뷰 (REQUIRED)

한 메시지에 아래 질문을 모두 담는다. **각 항목에 기본값을 표시할 것.** 메시지 끝에 "답 안 하신 항목은 기본값으로 진행합니다"를 붙인다. 사용자 응답을 받기 전에는 콘텐츠를 한 줄도 쓰지 않는다.

1. **원작 식별** — 원저자 / 원제 / 한국어 번역본 기준인지 (번역본이면 제목·역자)
2. **목표 페이지 수** — A4 전체 기준(표지·부록 포함). 짐작 불가 시 30-40쪽 제안. **10쪽 이하면 "초단편 모드"** — `references/document-structure.md` §"초단편 가이드(≤10쪽)" 적용 — 기본: 30쪽
3. **독자 연령대** — (A) 초등 저학년 / (B) 초등 고학년 / (C) 청소년 / (D) 성인 — **기본: (B)**
4. **챕터 구조** — (A) 원작 장 수 유지 / (B) 통합 (원하는 장 수: ___) / (C) 알아서 — **기본: (C)**
5. **대화 비중** — (A) 대화 많이 / (B) 서술 위주 / (C) 밸런스 — **기본: (C)**
6. **민감 콘텐츠 처리** — (A) 원작대로 / (B) 순화 / (C) 완전 삭제. **절대 묵시적으로 순화하지 말 것.** — **기본: (A)**
7. **서술자 톤** — (A) 해체(`~야/~지`) / (B) 친근 경어(`~해요/~었어요`) / (C) 합쇼체(`~습니다`) / (D) 중립 — **기본: (B)**
8. **삽화 처리** — (A) 안 함 / (B) 프롬프트만 생성 / (C) codex-image로 자동 생성·docx 임베드. (B)/(C) 선택 시 `references/illustration-prompts.md` 프리셋 중 선택 — **기본: (A)**.
   - **Step 1에서 codex-image 미설치로 확인된 경우 (C) 옵션은 표시하지 않는다.** 사용자가 (C)를 원하지만 설치 안 됐으면 (B)로 다운그레이드하고 한 줄 안내: *"codex-image이 없어서 이미지 자동 생성은 건너뛰고 프롬프트 파일만 만들어 두었어요."* (사용자가 codex-image이 뭔지 물어보면 §"codex-image 안내" 참조)
9. **개인화 요소** — (A) 없음 / (B) 아빠/엄마의 편지 / (C) 기타 — **기본: (A)**
10. **폰트 선호** — Step 1에서 추출한 설치된 폰트 목록을 그대로 보기로 제시. 첫 번째를 기본값으로.
11. **통독 점검** — (Y) Step 10에서 챕터를 한 번씩 처음부터 끝까지 다시 읽고 중복 도입·시간 표지·인물 일관성을 점검 / (N) 페이지 튜닝과 텍스트 패스만 마치고 바로 배송. 토큰을 좀 더 쓰지만 배송 후에야 발견되는 결함을 미리 막아 줍니다. — **기본: (Y)**

"알아서 해" 대답이 나오면 기본값으로 진행한다. **이 메타 정보를 `들어가는 말` 본문에 적지 않는다** — 결정한 사용자 본인은 이미 알고, 처음 책을 펴는 독자에겐 잡음이다. 사용자가 나중에 돌이키고 싶을 수 있으면 build.js 상단 주석에 한 줄로 남겨도 된다.

---

### Step 3 — 캘리브레이션 (REQUIRED)

**콘텐츠를 한 글자도 쓰기 전에** 아래 두 단계를 완료한다. 폰트는 Q10에서 사용자가 이미 설치된 목록 중 골랐으므로 별도 확인 불필요.

#### 3-1. 페이지당 글자 수 캘리브레이션

프로젝트 루트에서:
```bash
node ~/.claude/skills/book-summary-haebom/scripts/calibrate.js "<폰트>" <반포인트_크기> <목표_쪽수> [앞뒤_구조_쪽=6] [줄간격=320]
```
예: `node ~/.../calibrate.js "Apple SD Gothic Neo" 22 30 6 320`

**⚠️ 줄간격 인자는 build.js에 넣을 `LINE_SPACING`과 같은 값으로** (저학년 360 / 고학년 320 / 청소년·성인 300). 다른 값으로 측정하면 자/쪽이 ~10% 어긋나 본문이 체계적으로 부족·초과해진다 (실측에서 첫 빌드가 목표 대비 15쪽 부족해 튜닝 8회를 돈 사례).

출력된 **"본문 총 ~N 자 작성하세요"** 수치를 메모.

#### 3-2. 챕터별 예산 분배 (≥20쪽 작업이면 필수)

```bash
node ~/.claude/skills/book-summary-haebom/scripts/budget.js <본문_총_자수> <챕터_수> [가중치]
```

예:
- 균등 분배: `node budget.js 30000 8`
- 클라이맥스 강조: `node budget.js 30000 8 1,1,1,2,2,3,2,1`

출력된 챕터별 TARGET 자수를 각 챕터 파일 상단 주석에 박아둔다. **챕터를 쓸 때는 그 TARGET ±10% 안에서 마무리**하고, 다른 챕터에서 빌리지 않는다.

**LINE_SPACING · BODY_SIZE 는 가독성 기준으로 정하고 절대 페이지 수 조정에 사용하지 않는다.** 페이지 수의 유일한 조정 레버는 **콘텐츠 분량(글자 수)** 뿐이다.

---

### Step 4 — 문서 골격

표준 구조 (전체 템플릿 및 연령별 변형은 `references/document-structure.md` 참조):

1. **표지** — 제목, 원작자, 원제, 부제
2. **목차** (선택)
3. **들어가는 말** — 원작 제목(한국어/원어), 원저자, 출간 연도, 도입부 후크. 메타 정보(축소 비율·시점·순화 노트·부록 안내 등) 금지. 자세한 형식·금지 항목은 `references/document-structure.md` §3.
4. **등장인물 소개** — 2~6명
5. **본편 챕터** — `Sep()` 구분자로 흐름 (페이지 나누기 아님)
6. **이야기 속의 이야기** — 원작에 액자식 구조가 있을 때만 포함. **페이지 채우기 용도로 넣지 말 것.**
7. **끝맺는 말**
8. **부록 1: 어려운 단어 사전** — 어린이·청소년 대상이면 필수
9. **부록 2: 같이 이야기해 볼 거리** — 3-7개 질문
10. **— 끝 —** (PB 없이 부록 뒤에 이어서 배치)

---

### Step 5 — facts.md 작성 + 사용자 confirm (REQUIRED, 본문 작성 전)

**왜:** 패스를 거듭할 때 캐릭터 설정·핵심 플롯 비트·세계관 룰·서술자 시점이 단일 진실 저장소 없이 여러 패스에 분산되면, 디테일이 미세하게 표류한다. 핵심 비트 누락, 캐릭터 자기모순, 1인칭 화자의 메타 누설이 모두 이 부재 때문에 실측에서 발생했다.

**무엇을:** `books/{작품명}/facts.md` 한 파일. 형식·갱신 룰은 `references/single-source-of-truth.md`. 골격:

1. **작품 정보** — 원작자·원제·출간 연도. **서술자 시점** (1인칭/3인칭/액자/혼합. 1인칭이면 화자 이름). **세계관 룰** (비현실 작품에 한해 디폴트 상식과 다른 물리·생물·사회 룰을 한두 줄. 일반 작품이면 비워둠). **작중 비유 룰**(인물 대사는 원작 사실에 한정)·**외부 호명 금지**(관객·시청자·독자 직접 호명 X) 한 줄.
2. **표준 용어·명대사** (옵션) — 영화·번역 소설 원작이면 한국어 정식 번역의 표준 용어 카탈로그(예: `Event Horizon → 사건의 지평선`) + 주요 명대사 5~10개의 원문 + 한국어 표준 형태. 한국어 창작/정식 번역 없는 작품이면 생략.
3. **등장인물** — 이름·역할·핵심 특성·소품. **시점별 나이**까지 명시. 자작·각색이면 한 번 더 확정.
   - 시간 도약 ≥1세대 발생 작품이면 **세대별 나이 표** (주인공·자식·손자 시점별 나이) 필수
   - 한국어 작품이면 **인물 간 톤 표** (반말/존댓말·호칭) 필수
4. **챕터별 핵심 비트** — `### N장. {제목}` 헤더 + 한 단락(~100-200자). 시간 표지·핵심 사건·결말. **이 단락이 곧 그 챕터에 반드시 들어가야 할 plot beat**.

**과정:**
1. assistant가 facts.md 초안을 작성해 책 디렉터리에 저장하고 사용자에게 보여준다 (`assets/modular/facts_template.md` 베이스).
2. 사용자가 confirm 또는 수정. 빠진 핵심 비트가 있으면 이때 노출됨.
3. confirm 후에만 Step 6 진입.

**작성 시 의무 참조:** 모든 챕터 본문 작성 전에 facts.md를 먼저 읽는다. 챕터 한 개 = 그 챕터 facts 단락 한 개를 반드시 충족시키도록 쓴다. **세계관 룰을 어기는 비유·서술자 stance를 누설하는 메타 표현은 facts.md 위반**.

**카운트 정합성:** facts.md의 `### N장.` 헤더 개수 = `chapters/*.js` 파일 개수. 어긋나면 모듈식 build.js가 시작 시 경고를 출력한다 (block까지는 X — 작업 흐름은 유지).

**갱신 룰:** 작업 중 사용자가 facts(예: 캐릭터 설정)를 바꾸면 facts.md 먼저 수정 → 영향 받는 챕터 재작성. 챕터 본문에서 fact를 바꾸지 않는다. 단일 진실 저장소가 본문보다 항상 앞선다.

---

### Step 6 — 빌드 셋업 & 챕터 작성

#### 6-1. 모드 선택

| 목표 페이지 | 모드 | 이유 |
|---|---|---|
| < 20쪽 | **단일 파일** (`assets/make_doc_template.js`) | 한 화면에 다 보여서 검토 쉬움. 모듈 분할 비용이 더 크다. |
| ≥ 20쪽 | **모듈식** (`assets/modular/`) | 챕터별 자수 예산을 강제하고, 다중 패스 작성 시 시간선 도치 같은 버그를 구조적으로 차단. |

#### 6-2. 단일 파일 모드 (<20쪽)

1. 책 전용 디렉터리 생성: `mkdir -p books/{작품명}`
2. 템플릿 복사:
   ```bash
   cp ~/.claude/skills/book-summary-haebom/assets/make_doc_template.js books/{작품명}/build.js
   ```
   (cp 권한이 막히면 Read + Write로 대체.)
3. `build.js` 안의 상수 편집 — `OUTPUT_FILENAME`은 경로 없이 파일명만 (`{작품명}_요약.docx`).
4. `children` 배열에 실제 콘텐츠 채우기.
5. 책 디렉터리에서 빌드: `(cd books/{작품명} && node build.js)`

#### 6-3. 모듈식 모드 (≥20쪽) — 권장

1. 골격 복사:
   ```bash
   mkdir -p books/{작품명}
   cp -r ~/.claude/skills/book-summary-haebom/assets/modular/* books/{작품명}/
   ```
2. **디렉터리 구조·챕터 파일 형식·조립 패턴은 `references/document-structure.md` §"모듈식 빌드" 참조.**
3. `build.js` 상단의 `setSettings({...})` 에서 폰트(Q10)·크기·줄간격·`OUTPUT_FILENAME` 편집.
4. **각 섹션·챕터 파일을 한 번에 끝까지 채운다.** 다음 챕터로 넘어가기 전 그 챕터 파일을 통독해서 확인:
   - TARGET 자수 ±10% 안에 들어왔는가
   - 시간 표지(Sol N, 며칠 후 등)가 단조 증가하는가
   - 다른 챕터 내용을 끌어오지 않았는가
5. 빌드: `(cd books/{작품명} && node build.js)`. build.js가 `chapters/*.js`를 파일명 정렬 순으로 자동 발견 → 챕터 사이 `Sep()` 자동 삽입. **챕터 파일 안에서 PB()/Sep() 직접 호출 금지.**

`node_modules`는 프로젝트 루트에 있어도 Node.js가 상위 디렉터리를 자동으로 탐색하므로 별도 설치 불필요.

#### 6-4. 헬퍼 함수 — 사용 규칙

Template provides helpers: `P`, `Dialog(speaker, line)`, `Note`, `H1`, `H2`, `Quote`, `Sep` (✦ ✦ ✦), `PB` (page break), `Img` (이미지). A4 / 1440 DXA margin / centered page-number footer.

**챕터 사이는 `Sep()`, 절대 `PB()` 아님.** 한국 문학 관행.

**`Dialog()` vs 서술 속 대사 — 화자가 두 번 등장하지 않게.** `Dialog(speaker, line)`은 시나리오/희곡 형식으로 렌더된다 (`**화자:** "대사"`). 따라서 짧고 빠르게 주고받는 대화, 또는 서술자 개입 없이 화자가 분명한 장면에만 쓴다. 서술이 이미 화자를 품고 있는 문장 — 예: `"오늘 어디 가세요?" 앤드류가 호기심 어린 얼굴로 물었어요.` — 은 그대로 `P()` 한 단락으로 둔다. 이 경우에도 `Dialog()`로 감싸면 `**앤드류:** "..."` 라벨과 뒤따르는 서술이 같은 화자를 두 번 부르게 되어 어색하다. 한 장면 안에서 두 형식을 자연스럽게 섞어 써도 된다.

**초단편(≤10쪽) 주의**: 단일 파일 모드의 기본 `PB()` 배치(표지→들어가는말→등장인물→부록)는 30쪽 이상 기준. 짧은 요청에서는 **내부 `PB()` 대부분을 `Sep()` 또는 여백 단락으로 대체**해서 본편이 밀리지 않게 한다.

#### 6-5. 삽화 자리 미리 확보 (Q8=C일 때만)

이미지의 docx 내 차지 공간은 `Img()` 헬퍼의 `transformation: { width: 595, height: 335 }` 로 고정되어 있어 소스 PNG의 픽셀 크기와 무관. 따라서 Step 7 페이지 튜닝 시점에 **placeholder PNG**를 자리 차지용으로 끼워두면, Step 11에서 같은 경로에 진짜 이미지를 덮어써도 페이지 수가 변하지 않는다.

1. **장면 선정** — 감정 클라이맥스 기준 N개 (30-40쪽 기준 5개, 약 8쪽당 1장). 첫 챕터/마지막 챕터 default 회피.
2. **placeholder 배치** — 선정한 장면 수만큼 placeholder를 책 디렉터리에 복사:
   ```bash
   for n in 1 2 3 4 5; do
     cp ~/.claude/skills/book-summary-haebom/assets/illustration_placeholder.png \
        books/{작품명}/{작품명}_삽화_${n}.png
   done
   ```
3. **챕터 파일에 `Img()` 호출 박기** — 선정한 챕터의 `H1()` 직전(첫 줄)에 `Img('{작품명}_삽화_N.png')`. 모듈식이면 해당 챕터 파일에, 단일 파일이면 children 배열의 해당 위치에. helpers에서 `Img`도 import.

이 시점에 이미지가 진짜 모양은 아니어도 자리는 정확히 차지한다. Step 11에서 placeholder를 진짜 이미지로 덮어쓸 때 경로가 동일하므로 별도 페이지 재튜닝 불필요.

---

### Step 7 — 페이지 튜닝 루프 (MANDATORY)

**콘텐츠 밀도가 유일한 레버.** `PB()`, `LINE_SPACING`, `BODY_SIZE`로 페이지 수를 맞추려는 시도는 모두 Red Flags. 자연스러운 흐름은 그대로 두고 본문 글자 수만 조절한다.

```bash
(cd books/{작품명} && bash ~/.claude/skills/book-summary-haebom/scripts/build_and_check.sh {작품명}_요약.docx <target>)
```

스크립트 build → `soffice --headless` PDF 변환 → `pdfinfo`로 페이지 측정 → delta 보고. 콘텐츠를 조정하고 ±1 안에 들 때까지 재실행. 확장·압축 전술은 `references/page-tuning.md` 참조.

**Exit codes**: `0` ±1 도달, `2` 부족, `3` 초과. `set -e` 부모 스크립트에서 호출할 땐 `|| true`로 감싸고 `$?`를 직접 검사.

#### 7-1. 단락 추가 직후 윈도우 재독 (REQUIRED)

페이지 튜닝 중 새 `P()` 블록을 추가했으면 그 즉시:
- **새 단락 + 직전 단락 + 직후 단락**을 한 호흡으로 다시 읽는다
- **도입 문장이 같은 주제를 두 번 부르지 않는지** 확인
- 부르고 있으면 둘 중 한쪽의 도입을 들어내고 동기·행동만 합쳐 둔다

페이지 튜닝 중 새 단락을 끼워 넣을 때 인접 단락의 도입 문장과 토픽이 겹치는 패턴이 서로 다른 작업 두 건에서 똑같이 사후 점검에야 잡혔음. 즉시 잡으면 Step 10 통독 점검 부담이 줄어든다.

---

### Step 8 — 번역투 패스 (references/style-guide-ko.md)

영어 원작 직역 흔적 제거. 드래프트를 처음부터 끝까지 소리 내 읽으며 아래 패턴 확인.

- `그녀/그` overuse → 이름 또는 생략
- 직역투 어미 (`~해 준 거지`, `~거였어`, `~라는 거지`)
- 시대극체 (`-오/-소/-소이다`) 부적절한 곳
- 화자 ≠ 대사 (캐릭터가 자기 이름을 부름)
- 문화적으로 낯선 비유 (`설탕 같은 하얀 모래`)
- 어색한 서술자 태그 (`아이들 셋` → `세 남매`)

---

### Step 9 — AI 느낌 패스 (references/ai-ness-ko.md)

LLM 자동 생성 패턴 제거 — **번역투와는 다른 축**. Wikipedia *Signs of AI writing* 중 한국어 아동 요약본에 유효한 13개 패턴 (고빈도 어휘, 의미 부풀리기, puffery, `-며` tag-on, 삼원구조, copula 회피, filler, 일반론 마무리, 부사 인플레이션 등). 본거지 `references/ai-ness-ko.md` — 빠른 검토 체크리스트 5항목으로 끝낸다.

**⚠️ Step 7 페이지 튜닝 재진입 필수.** AI 느낌 제거는 본문을 5-15% 압축한다.

---

### Step 10 — 통독 점검 (Q11=Y일 때만)

페이지 튜닝과 텍스트 패스가 모두 끝난 다음, 수정된 챕터를 **처음부터 끝까지 한 번씩** 다시 읽고 무결성을 점검한다.

점검 항목:
- **중복 도입 문장** — 인접 두 단락이 같은 주제로 두 번 시작하지 않는가 (예: "X는 받아들이지 않았어요" + 다음 단락 "X는 마음에 들어 하지 않았어요")
- **시간 표지 단조 증가** — Sol N, 며칠 후, 다음 해 등이 거꾸로 가지 않는가
- **인물 중복 소개** — 같은 인물을 두 번째 등장에서 다시 처음인 듯 소개하지 않는가
- **사건 중복 묘사** — 같은 사건이 두 챕터/단락에서 자세히 두 번 묘사되지 않는가 (디테일 확장 패스에서 가장 흔히 발생 — 실측에서 한 작품에 4건이 한꺼번에 잡힌 사례)
- **세대별 나이 산수** — 임종·장기 시간선 작품에서 자식·손자 세대 나이가 자연스러운가 (facts.md 세대 나이 표 기준; "주인공 124세인데 자식 60대?" 같은 모순 사후 발견 막기)
- **사실 일관성** — 인물 나이·관계·소품 위치가 챕터 간 일관된가
- **반말/존댓말 일관성** — 같은 두 인물의 대사 톤이 챕터 간 일관된가 (facts.md 인물 간 톤 표 기준)
- **원작 인용 정확성** — 원작 명대사·인용이 facts.md §표준 용어·명대사와 일치하는가. 임의 의역되어 표준 의미와 어긋나지 않는가
- **시점·환상-현실 분리** — 단락 추가로 생긴 모호한 시점(환상인지 실제인지 불분명한 단락)이 없는가
- **대명사 명료성** — 대사·서술 안의 "그쪽/거기/그것" 같은 대명사가 본문에서 누구·어디인지 분명한가
- **외부 호명 부재** — 본편 챕터에 시청자·관객·독자를 직접 호명하는 메타 표현이 들어가지 않았는가
- **작중 임의 비유 부재** — 원작에 없는 비유가 인물 대사에 박혀 있지 않은가 (서술자 톤이면 OK)
- **단락 내 동일 구절 폭주** — 한 단락 안에서 같은 어휘/구절이 3회 이상 반복되지 않는가 (`references/ai-ness-ko.md` §11c)

수정이 들어가면 본문 분량이 변하므로 **Step 7 페이지 튜닝 재진입**.

Q11=N으로 사용자가 거른 경우 이 단계를 건너뛰지만, 추후 사용자가 결함을 발견하면 사후 보정으로 다시 들어올 수 있다.

---

### Step 11 — 삽화 (Q8=B 또는 C일 때만)

`references/illustration-prompts.md`의 프리셋 카탈로그 9개 중 하나(또는 §커스텀 프리셋 절차로 사용자와 정의한 커스텀 프리픽스)를 골라 모든 장면에 같은 공통 프리픽스를 붙인다. 영화 원작이면 H(시네마틱 영화 스틸), 동물·자연 서사면 I(자연 다큐)가 실적 있는 기본값. 장면은 Step 6-5에서 잡아 둔 자리 그대로. 프롬프트 파일은 `books/{작품명}/{작품명}_삽화_프롬프트.md`. 형식·codex-image 자동 생성 절차·설치 안내문은 `references/illustration-prompts.md` 참조.

- **Q8=(B)**: 프롬프트 파일만 작성하고 종료.
- **Q8=(C)**: `state/settings.json`의 `codex_image.available === true`일 때만 진입. placeholder 자리에 진짜 이미지를 같은 경로로 덮어쓰므로 Step 7 재진입 불필요. 부재 시 (B)로 다운그레이드.

---

## Outputs

모두 `books/{작품명}/` 안에:

- `{작품명}_요약.docx` (always)
- `{작품명}_삽화_프롬프트.md` (Q8 (B) 또는 (C))
- `{작품명}_삽화_{1..N}.png` (Q8 (C) — Step 6-5에서 placeholder, Step 11에서 진짜 이미지로 덮어씀)

**완료 후 사용자에게 경로를 알려준다.** 예:
> "완료됐어요. 파일은 `books/어린왕자/` 폴더에 있어요."

---

## 책별 진행 추적 (records.json)

`~/.claude/skills/book-summary-haebom/state/records.json` 에 각 책의 진행 상황을 기록.

**시점:**
- **Step 2 완료 직후** — 신규 등록 (title, author, target_pages, current_step="preflight_done", started_at)
- **각 Step 완료 시** — `current_step` 갱신: `"calibrated"` (3) / `"facts_confirmed"` (5) / `"drafted"` (6) / `"page_tuned"` (7) / `"translation_pass_done"` (8) / `"ai_pass_done"` (9) / `"integrity_pass_done"` (10) / `"illustrated"` (11) / `"completed"`
- **Step 7 통과 시** — `actual_pages` 기록
- **최종 delivery** — `current_step="completed"`, `completed_at` 기록

**스키마:**
```json
{
  "schema_version": 1,
  "books": {
    "어린왕자": {
      "title": "어린왕자",
      "author": "Antoine de Saint-Exupéry",
      "directory": "/Users/.../books/어린왕자",
      "target_pages": 40,
      "actual_pages": 43,
      "current_step": "completed",
      "illustrations": 5,
      "integrity_pass": true,
      "started_at": "2026-04-25T10:00:00Z",
      "completed_at": "2026-04-30T18:00:00Z"
    }
  }
}
```

**처음 호출 시 파일이 없으면 빈 `{ "schema_version": 1, "books": {} }` 로 생성**한 뒤 진행. Read/Write 도구로 직접 다룬다.

같은 책을 다시 호출하면 records를 먼저 읽어서 사용자에게 *"어린왕자는 이전에 작업하다 calibrated 단계에서 멈춘 기록이 있어요. 이어서 진행할까요, 새로 시작할까요?"* 같은 식으로 확인.

**`completed`여도 건너뛴 패스를 확인한다.** `integrity_pass: false`거나 notes에 미실행 패스가 적혀 있으면 (예: rate limit으로 Step 8/9/10을 건너뛰고 배송한 경우) 재호출 시 그 사실을 알리고 사후 보정 재진입을 제안: *"이 책은 완성됐지만 번역투·AI 느낌·통독 패스를 건너뛴 기록이 있어요. 이번에 마저 돌릴까요?"*

---

## Red Flags — STOP and restart the step

행동 신호와 자기변호 둘 다 잡는다. "유혹" 칸은 같은 위반에 대한 자기변호 핑계 — 떠올랐다는 것 자체가 stop 신호다.

| 신호 / 유혹 | 위반 | 즉시 조치 |
|---|---|---|
| 첫 단락 쓰려는데 사전 인터뷰가 없다 / *"이 정도 가정은 상식"* | Iron Law (Step 2) | 사전 인터뷰 발송. baseline 에이전트도 "상식"이라며 죽음 장면을 임의 순화했다. |
| 원작 플롯·캐릭터를 내가 창작하고 있다 / *"이 정도 알려진 책이면 안다"* | Step 0 | 한국 아동도서·지역 출판물은 AI 학습 데이터에 없을 수 있다. 줄거리 요청. |
| `PB()`로 페이지를 채우려 한다 / *"5페이지라 짧으니 PB가 빠르다"* | Step 7 | PB 제거 후 튜닝 루프. 5쪽이라도 밀도가 우선. |
| 죽음·폭력·인종 장면을 임의 순화 직전 | Step 2 Q6 | 사용자에게 장면별 확인. |
| 삽화 스타일을 분위기로 고름 / *"수채화면 됐지"* | Step 11 | 프리셋 하나만. "수채화"는 Beatrix Potter부터 현대 한국 그림책까지 다 담는다. |
| Step 1에 안 띄운 폰트를 build.js에 지정 | Step 1 / 6 | 설치된 폰트만 사용. |
| 어린이·청소년인데 어휘 사전 부록 생략 | Step 4 #8 | 포함시킬 것 — opt-out only. |
| "이야기 속의 이야기"를 페이지 채우려 추가 / *"있는지 모르니 일단 넣자"* | Step 4 #6 | 원작에 있을 때만. 없으면 페이지 튜닝 루프로. |
| 파일명이 영어/제네릭 | Output contract | `{작품명}_요약.docx`, `summary.docx` 아님. |
| 파일을 프로젝트 루트에 생성 | Step 6 | `books/{작품명}/` 아래. |
| 들어가는 말에 어른 대상 키워드(로맨스 등)를 단어로 명시 | document-structure §3 | 구체 이미지로만 안내. |
| 들어가는 말에 메타 정보 / *"부모·교사가 알아야 한다"* | document-structure §3 | 결정한 사용자 본인이 이미 안다. 실제 배송본에서 사용자가 잘라낸 패턴. |
| 들어가는 말에 원작 출간 연도·원저자 누락 | document-structure §3 | 사실 정보는 첫 단락에 박는다. |
| 끝맺는 말에 "깊은 여운을 남깁니다" 류 마무리 | ai-ness-ko §8 | 구체 이미지 또는 독자 직접 말 걸기. |
| Step 9 건너뜀 ("자연스러우니까") | Step 8-9 | 번역투와 AI 느낌은 축이 다르다. 두 패스 모두 필수. |
| Step 9 이후 페이지 재측정 생략 | Step 9 ⚠️ | humanizer는 본문 5-15% 압축. 재측정 필수. |
| `LINE_SPACING`/`BODY_SIZE`를 페이지에 맞추려 조정 / *"조금만 올리면 빠르게 맞춘다"* | page-tuning §"절대 하지 말 것" | 가독성이 망가지고 폰트 교체 시 수치도 달라진다. 콘텐츠 밀도가 유일한 레버. |
| 캘리브레이션 없이 작성 시작 / *"쓰면서 맞추는 게 빠르다"* | Step 3 | 3-4번 rewrite = calibrate 한 번의 토큰 10배. 캘리브레이션이 항상 저렴. |
| 20쪽+를 단일 파일 build.js로 시작 / *"단일이 더 빠르다"* | Step 6 모드 선택 | 다중 패스가 강제되는 순간 시간 도치·예산 초과 발생. 모듈식이 항상 더 안전. |
| 챕터 비순차 작성 / *"클라이맥스 먼저 박고 사이 채우자"* | Step 6-3 작성 원칙 | 시간 표지 도치를 만든 바로 그 패턴. 한 챕터 = 한 번에 완결. |
| 챕터 파일 안에 `PB()`/`Sep()` 직접 호출 | Step 6-3 #5 | build.js가 챕터 사이 `Sep()` 자동 삽입. |
| budget.js 출력 무시하고 챕터별 자수 자유롭게 | Step 3-2 | 챕터별 TARGET ±10% 안에서 마무리. |
| Q8=C인데 placeholder 안 깔고 Step 7 진입 / *"Step 11에서 한꺼번에 처리"* | Step 6-5 | placeholder 없으면 Step 11 후 이미지 차지 공간만큼 페이지가 늘어 ±1 깨짐. 미리 깔아 두는 게 본질. |
| Step 7에서 `P()` 추가 후 인접 단락 재독 안 함 / *"통독에서 잡자"* | Step 7-1 | 그렇게 미룬 결함 6건이 한 작업에서 사후로 잡혔다. 통독은 안전망이지 1차 방어선이 아니다. |
| Q11=Y인데 Step 10 통독 건너뜀 | Step 10 | 동의받은 안전망. 지키는 게 약속. |
| facts.md 없이 챕터 작성 시작 / *"내가 책 내용은 알고 있으니까 충분"* | Step 5 | 단일 진실 저장소 없이 패스를 거듭하면 캐릭터·플롯이 표류. 실측 결함들의 공통 근본 원인. |
| 챕터 본문에서 facts.md와 다른 사실(나이·관계·세계관 룰) 등장 | Step 5 갱신 룰 | facts.md를 먼저 고치고 챕터를 재작성. 본문이 진실 저장소를 앞서지 않는다. |
| 1인칭 화자가 "X장에서 내가" 같은 메타 표현 | Step 5 서술자 시점 | facts.md 서술자 시점 절을 참조. 1인칭은 책 자체를 호명하지 않는다. |
| 본편 챕터에 시청자·관객·독자 호명 / *"여운을 살리려 한 표현"* | Step 5 외부 호명 금지 | 작품 안과 밖이 섞인다. 끝맺는 말처럼 명시적으로 독자에게 말 거는 자리에서만. "영화의 마지막까지 자리에 앉아 본 사람은…"이 본편에 박힌 실측 패턴. |
| 원작에 없는 비유를 작중 인물 대사로 / *"책의 시적 톤을 살리려고"* | Step 5 작중 비유 룰 | 인물 대사는 원작 사실에 한정. 비유는 서술자 톤으로만. 어시스턴트가 만든 비유("풍선을 떠나는 마음으로" 류)가 인물 입에 박힌 실측 사례. |
| 한국어 정식 번역본 있는 원작인데 facts.md §표준 용어 누락 / 작업 중 임의 의역 | Step 0 / Step 5 | 표준 용어·명대사 미리 옮긴 뒤 그대로 인용. "사건의 지평선"이 "사상의 지평선"으로 / 명대사 의미가 반대로 의역된 실측 사례. |
| 임종·세대 도약 작품에 facts.md 세대 나이 표 누락 / 자식·손자 나이 산수 안 맞음 | Step 5 | "주인공 124세인데 자식 60대?" 같은 모순이 사후 발견된다. facts에 시점별 나이 표 박아 두기. |
| 같은 두 인물 사이 톤(반말/존댓말)이 챕터 간 다름 | Step 5 인물 간 톤 표 | 사용자가 "왜 제대로 안 고침?"으로 지적. facts.md에 인물 간 톤 명시 후 작성 중 일관 유지. |
| 분량 부족하다고 같은 표현 반복으로 부풀리기 / *"한 자리/한 줄로/한 박자/한 평생"이 단락에 3회 이상* | ai-ness-ko §11c | 자수는 사실·풍경·대사 디테일로만. 단락 내 같은 어휘 3회+면 즉시 humanize. 한 작품 첫 빌드에서 540건 발견된 사례. |
| 디테일 확장 패스에서 이미 묘사된 사건을 다시 풀어냄 | Step 7-1 / Step 10 | 새 단락이 묘사하는 사건이 facts.md 다른 챕터 비트에 있는지 확인. 한 작품에서 4건이 한꺼번에 중복된 실측 사례. |
| 새 단락의 시점·환상-현실이 모호 / *"독자가 알아서 해석할 거야"* | Step 7-1 | 새 단락 추가 직후 시점·시간이 인접 단락에서 자연스럽게 이어지는지 재독. 추가 단락이 환상인지 실제인지 모호하다는 지적이 실측에서 발생. |
| 대사 안의 대명사가 가리키는 대상이 본문에서 분명하지 않음 / *"그쪽으로 가야 해요"가 어디인지 안 보임* | Step 10 | 대명사("그쪽/거기/그것")의 지시 대상이 본문 직전·직후에 명시되어 있는가. |
| 본편 마지막이 강한 closing인데 끝맺는 말 섹션 별도 추가 | document-structure §7 | 끝맺는 말은 옵션. 본편 마지막이 마무리 역할이면 생략. 사용자가 중복으로 보고 삭제를 요청한 실측 사례. |
| PB() 정의가 직접 `Paragraph(children: [PageBreak()])` 형태 | helpers.js | docx-js 일부 환경에서 빈 paragraph로 변환되어 페이지 break 누락. `Paragraph(children: [TextRun(children: [PageBreak()])])` 표준 형태 사용. 빈 페이지가 4쪽 생긴 실측 사례. |

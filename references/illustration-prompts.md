# 삽화 프롬프트 프리셋

## 원칙

1. **프리셋을 골라서 쓰고, 그 프리셋의 공통 프리픽스를 모든 장면에 붙인다.** 화풍 통일의 핵심.
2. **이미지당 2-3문장.** 너무 길면 AI가 중요한 요소를 놓친다.
3. **Aspect ratio는 책 분량에 맞춰라.**
   - 30쪽+ 요약본: `16:9` landscape 기본 (가로 배치가 시원함)
   - 11-29쪽: `3:2` 또는 `4:3` (약간 정사각 쪽, 여백 낭비 줄임)
   - ≤10쪽 초단편 책자: `3:4` portrait 권장 (A4 세로 페이지 폭에 맞게, 한 쪽에 꽉 차게 배치 가능)
   
   사용자가 책자를 인쇄해서 철할 계획이면 세로가 배치 안정성이 좋다. 디지털 열람·프로젝터용이면 가로.
4. **영어로 작성.** Midjourney, DALL·E, GPT Image, Stable Diffusion 모두 영어 최적화됨.
5. **항상 `No text, no letters.`** 끝에 붙인다. 한글·영문 표시가 잘못 생성되는 것 방지.
6. **감정의 정점을 골라라.** 첫 챕터·마지막 챕터를 기계적으로 고르지 말 것.

## 프리셋 카탈로그

### A. 1960-70년대 영국 수채화 그림책 (Pauline Baynes 톤)

**느낌:** 『나니아 연대기』, 『호빗』 일러스트. 고전·서정적·섬세한 펜 선 + 얇은 수채.

**공통 프리픽스:**
> Delicate watercolor storybook illustration in the style of 1960s British children's books, fine ink linework with soft watercolor washes, muted earthy palette (sage green, ochre, dusty rose, soft brown), visible paper grain, gentle composition with generous white space.

**적합 작품:** 서양 고전 (『어린 왕자』, 『나니아』, 『비밀의 화원』, 『호빗』)

### B. 스튜디오 지브리 스타일

**느낌:** 『이웃집 토토로』, 『하울의 움직이는 성』. 따뜻하고 풍부한 자연 묘사. 구름·바람·잔디의 질감.

**공통 프리픽스:**
> Warm Studio Ghibli-inspired illustration, soft painterly style with lush natural backgrounds, rich greens and golden light, detailed skies with cumulus clouds, gentle character expressions, cinematic composition.

**적합 작품:** 자연·마법·여행 주제 (『바람이 불 때』, 『하늘을 나는 교실』, 모험 동화)

### C. 1990년대 한국 아동서 일러스트

**느낌:** 한국 동화 전집의 전형적 톤. 따뜻한 유채 + 두툼한 선 + 채도 높은 원색 강조.

**공통 프리픽스:**
> 1990s Korean children's book illustration style, warm gouache-like colors with bold outlines, expressive characters with large round eyes, saturated primary colors balanced with warm brown and cream backgrounds, slightly nostalgic atmosphere.

**적합 작품:** 한국 창작동화, 한국 전래동화, 가족 이야기

### D. 현대 북유럽 그림책

**느낌:** Jon Klassen, Isabelle Arsenault 스타일. 미니멀·감각적·제한 팔레트.

**공통 프리픽스:**
> Contemporary Nordic picture book illustration, minimalist composition with limited muted palette (cream, charcoal, dusty teal, muted coral), simple geometric shapes, subtle texture, strong silhouettes, sophisticated restraint.

**적합 작품:** 현대 문학, 감성적·철학적 동화, 청소년

### E. 펜 앤 잉크 + 워시 (Quentin Blake 톤)

**느낌:** 『찰리와 초콜릿 공장』 삽화. 느슨한 스케치 선 + 가벼운 수채. 유머와 생동감.

**공통 프리픽스:**
> Loose pen-and-ink sketch with light watercolor wash in the tradition of British storybook illustrators, energetic scribbled linework with spontaneous feel, bright but limited color accents, humorous character expressions, airy composition.

**적합 작품:** 유머러스한 동화, 장난꾸러기 주인공, Roald Dahl 류

### F. 빈티지 동판화 분위기 (Arthur Rackham 톤)

**느낌:** 19세기 말 영국 fairytale 삽화. 섬세한 라인, 어두운 음영, 고요한 경이로움.

**공통 프리픽스:**
> Vintage fairytale illustration in the style of Arthur Rackham, intricate pen linework with subtle watercolor tints, muted sepia and blue-green palette, mysterious atmospheric lighting, detailed natural elements (twisted trees, flowing fabric, mist), sense of wonder and quiet enchantment.

**적합 작품:** 고전 동화 (『헨젤과 그레텔』, 『백설공주』, 『오즈의 마법사』), 판타지

### G. 만화풍 라이트노블 (청소년용)

**느낌:** 현대 일러스트, 부드러운 셀 셰이딩, 맑은 색감, 청소년 감성.

**공통 프리픽스:**
> Modern light-novel illustration style, soft cel shading with clean lineart, bright airy palette, expressive but restrained character emotions, cinematic lighting with lens flare accents, contemporary Korean YA atmosphere.

**적합 작품:** 청소년 소설, 현대 배경 이야기

### H. 시네마틱 영화 스틸

**느낌:** 실사 영화의 한 프레임. 영화 원작 요약본에서 원작의 화면 기억을 그대로 소환한다.

**공통 프리픽스:**
> Cinematic film still, photorealistic movie frame, anamorphic widescreen composition with shallow depth of field, dramatic naturalistic lighting, muted filmic color grade, subtle atmospheric haze, the look of a modern blockbuster production still.

**적합 작품:** 영화 원작 (『인터스텔라』, 『바이센테니얼 맨』), 실사 톤이 어울리는 SF·드라마

### I. 자연 다큐 사실주의

**느낌:** BBC Earth 류 자연 다큐멘터리의 한 장면. 동물·곤충이 주인공인 서사에서 의인화 없이 생태적 사실감을 유지한다.

**공통 프리픽스:**
> Naturalistic wildlife documentary illustration, photorealistic macro detail, BBC Earth-style cinematography, rich organic textures (soil, chitin, leaf venation, bark), shallow depth of field, golden-hour or forest-floor ambient light, no anthropomorphism.

**적합 작품:** 동물·곤충·자연 중심 서사 (『개미』, 생태 동화)

### 커스텀 프리셋 (카탈로그 밖)

사용자가 원하는 화풍이 카탈로그에 없으면 즉석에서 같이 정의한다:

1. Q8 시점에 사용자와 **공통 프리픽스 한 문단**(영어, 화풍·팔레트·조명·구도)을 합의.
2. 프롬프트 파일 상단에 "커스텀 프리셋: {이름}"으로 프리픽스 전문을 적고, **모든 장면에 동일하게** 붙인다 — 카탈로그 프리셋과 같은 규칙.
3. records.json의 `illustration_preset`에 커스텀 이름을 기록해 다음 작업에서 재사용 가능하게.

같은 커스텀이 두 번 이상 반복되면 이 카탈로그에 정식 등록을 고려한다.

## 장면 선정: 감정의 정점

**기계적 선택 금지:** "챕터 1, 챕터 3, 챕터 5, 챕터 7, 챕터 9" 같이 고르지 말 것.

**고를 곳:**
- **첫 마법 / 첫 발견** 장면 (주인공이 세계의 마법을 처음 보는 순간)
- **결정의 순간** (주인공이 큰 선택을 하는 장면)
- **만남 / 이별** (관계의 시작과 끝)
- **클라이맥스** (갈등의 정점)
- **조용한 성찰 장면** (변화 후 한숨 돌리는 순간)

예시 — 『어린 왕자』 5장 기준:
1. 사막에서 어린 왕자와 조종사의 첫 만남 (첫 마법)
2. 장미와의 대화와 떠남 (관계의 시작과 이별)
3. 가등 켜는 사람의 별 (어른 세계의 축도)
4. 여우와의 길들임 (핵심 주제 현현)
5. 별빛이 된 어린 왕자 (엘레지, 정점)

## 프롬프트 예시 (프리셋 A + 『어린 왕자』)

### Scene 1 — 사막에서의 첫 만남

> Delicate watercolor storybook illustration in the style of 1960s British children's books, fine ink linework with soft watercolor washes, muted earthy palette (sage green, ochre, dusty rose, soft brown), visible paper grain, gentle composition with generous white space. A small blonde-haired boy in a long emerald coat and flowing golden scarf stands in a pale sunrise desert, facing a kneeling aviator in a beige flight jacket who holds a sketchbook with a small drawn box. A half-broken biplane rests behind them. Soft rose and gold dawn sky with a single lingering star. 16:9 landscape. No text, no letters.

### Scene 2 — 여우와의 약속

> Delicate watercolor storybook illustration in the style of 1960s British children's books, fine ink linework with soft watercolor washes, muted earthy palette (sage green, ochre, dusty rose, soft brown), visible paper grain, gentle composition with generous white space. The small blonde-haired boy in emerald coat sits cross-legged on a grassy hill at golden hour, extending his hand toward a small orange fox with a white-tipped tail. Tall grass sways; a distant field of pink roses glows softly in the background. A single evening star. 16:9 landscape. No text, no letters.

## 파일 형식

`./{작품명}_삽화_프롬프트.md` 에 다음 섹션 순서로:

1. 제목 + 사용 프리셋 이름
2. 공통 스타일 프리픽스 (프리셋 전문)
3. Scene 1..N — 각 Scene마다 배치 위치(요약본 X장), 감정 정점 한 줄, 프롬프트 본문(공통 프리픽스 + 장면 묘사 + aspect ratio + `No text, no letters.`), 필요 시 negative prompt
4. 공통 생성 팁 — Midjourney `--ar 16:9 --style raw --v 6`, 모든 scene에 동일 `--seed`, 얼굴 뭉개짐 회피용 `--no distorted face, extra fingers`

## codex-image 자동 생성 (Q8=C)

`state/settings.json`에서 `codex_image.available === true`일 때만 진입.

1. 위 프롬프트 파일 먼저 작성.
2. 각 Scene 프롬프트로 `Skill(codex-image:generate)` 호출. 저장 경로는 Step 6-5에서 깔아 둔 placeholder와 동일하게 `books/{작품명}/{작품명}_삽화_{N}.png` (N=1, 2, ...). **순차로 생성한다 — 병렬 호출 시 race condition으로 서로 다른 Scene에 같은 이미지가 저장되는 결함이 실측에서 발생.**
3. **생성 후 중복 검사 (필수):**
   ```bash
   md5 -q books/{작품명}/{작품명}_삽화_*.png | sort | uniq -d
   ```
   출력이 있으면 같은 이미지가 두 자리에 들어간 것 — 해당 Scene만 재생성. placeholder 해시가 남아 있으면 그 Scene은 생성 자체가 누락된 것.
4. 같은 경로에 덮어쓰면 `Img()` 헬퍼의 `transformation` 크기는 그대로이므로 docx 차지 공간 동일 → **페이지 수 변동 없음 → Step 7 재진입 불필요**.
5. 빌드 한 번만 다시 돌려 최종 docx 생성.

### codex-image이 없을 때 사용자 안내

> "codex-image은 Claude Code 플러그인이에요. 설치하면 OpenAI Codex CLI 내장 이미지 생성 기능으로 그림을 자동 생성하고 docx에 바로 넣어 드릴 수 있어요.
>
> 설치 순서:
> 1. **Codex CLI 설치**: `npm install -g @openai/codex`
> 2. **OpenAI 로그인**: `codex login`
> 3. **codex-image-in-cc 플러그인 설치** (Claude Code 마켓플레이스)
>
> 이번 작업은 일단 프롬프트만 만들어 드렸어요."

## Negative prompt (프리셋별 참고)

| 프리셋 | 금지 요소 |
|---|---|
| A. 1960년대 수채 | photo-realistic, 3D render, harsh outlines, neon colors, anime |
| B. 지브리 | realistic photo, dark horror palette, 3D, anime-style big eyes |
| C. 1990 한국 | muted minimalism, photo-realistic, black-and-white, 3D render |
| D. 북유럽 | saturated primary colors, busy backgrounds, photo-realistic, detailed faces |
| E. Quentin Blake | photo-realistic, polished CGI, detailed realism, dark mood |
| F. Rackham | bright saturated colors, anime, modern digital look, cartoon |
| G. 만화풍 | photo-realistic, vintage sepia, rough sketchy lines |
| H. 시네마틱 | illustration, cartoon, anime, watercolor, flat colors, oversaturated |
| I. 자연 다큐 | cartoon, anthropomorphic faces, big cute eyes, flat illustration, neon colors |

공통 금지: `text, letters, watermark, logo, signature, extra fingers, distorted anatomy`

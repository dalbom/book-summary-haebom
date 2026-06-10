#!/usr/bin/env node
// check-env.js — environment detection + macOS asset-font activation
// ────────────────────────────────────────────────────────────────────────────
// What it does:
//   1) Enumerate Korean fonts CoreText (system_profiler) sees, including
//      Apple downloadable asset fonts at /System/Library/AssetsV2/...
//      (NanumGothic, NanumMyeongjo, BMHanna*, Cafe24Syongsyong, GungSeo,
//      HeadlineA, Pilgi, PCMyungjo, etc.)
//   2) Symlink the ones fontconfig can't see into a private dir
//      (~/.book-summary-skill/fonts/), then point fontconfig at that dir
//      via ~/.config/fontconfig/conf.d/99-book-summary-haebom.conf.
//      This makes them visible to the LibreOffice build pipeline without
//      affecting Word, Font Book, Pages, Adobe apps, etc. (they keep
//      seeing the original asset path through CoreText.)
//   3) fc-cache -f
//   4) Clean dangling symlinks (asset gone after Font Book uninstall, hash
//      changed after macOS update, etc.)
//   5) Detect node / soffice / pdfinfo / fc-list / fc-cache / system_profiler
//   6) Detect codex-image plugin and codex-cli plugin
//   7) Write everything to state/settings.json
//
// Usage:
//   node ~/.claude/skills/book-summary-haebom/scripts/check-env.js [--json]
// ────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HOME = os.homedir();
const SKILL_DIR = path.join(HOME, '.claude/skills/book-summary-haebom');
const STATE_DIR = path.join(SKILL_DIR, 'state');
const SETTINGS = path.join(STATE_DIR, 'settings.json');

const ASSET_LINKS_DIR = path.join(HOME, '.book-summary-skill/fonts');
const FC_CONF_DIR = path.join(HOME, '.config/fontconfig/conf.d');
const FC_CONF_FILE = path.join(FC_CONF_DIR, '99-book-summary-haebom.conf');
const FC_CONF_BODY = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <description>book-summary-haebom skill: macOS asset-font activation</description>
  <dir>${ASSET_LINKS_DIR}</dir>
</fontconfig>
`;

const PLUGIN_PATHS = {
  codex_image: path.join(HOME, '.claude/plugins/cache/codex-image-in-cc'),
  codex_cli:   path.join(HOME, '.claude/plugins/cache/openai-codex'),
};

// Heuristic for "is this a Korean font?" — keyword in family/filename, or
// Hangul codepoint in family name. Covers Apple's bundled Korean asset fonts
// plus common third-party Korean fonts (Pretendard, etc.).
const KOREAN_KEYWORDS = [
  'nanum', 'hangul', 'hancom', 'hanna', 'dohyeon', 'jua', 'kirang',
  'cafe24', 'syongsyong', 'pilgi', 'pcmyungjo', 'gungseo', 'gungsuh',
  'gungseouche', 'headline', 'headlinea', 'yeonsung', 'pretendard',
  'gulim', 'batang', 'dotum', 'malgun', 'myungjo', 'myeongjo',
  'pyeongchang', '온글잎', '박다현',
];
const HANGUL_RE = /[ᄀ-ᇿ㄰-㆏가-힯]/;

function isLikelyKorean(family, filename) {
  const text = `${family || ''} ${filename || ''}`.toLowerCase();
  if (KOREAN_KEYWORDS.some((k) => text.includes(k.toLowerCase()))) return true;
  if (HANGUL_RE.test(family || '')) return true;
  return false;
}

function which(cmd) {
  const PATH = (process.env.PATH || '').split(path.delimiter);
  for (const dir of PATH) {
    if (!dir) continue;
    const full = path.join(dir, cmd);
    try {
      fs.accessSync(full, fs.constants.X_OK);
      return full;
    } catch { /* not here */ }
  }
  return null;
}

function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

// Parse `system_profiler SPFontsDataType`. Each entry block:
//
//     FontFile.ttc:
//       Type: TrueType
//       Family: Family Name
//       Style: Regular
//       Location: /path/to/font
//
// Returns array of { filename, family, location }.
function detectCoreTextFonts() {
  if (process.platform !== 'darwin') return [];
  if (!which('system_profiler')) return [];
  let raw;
  try {
    raw = execFileSync('system_profiler', ['SPFontsDataType'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    }).toString();
  } catch {
    return [];
  }
  const fonts = [];
  let cur = null;
  for (const line of raw.split('\n')) {
    const m = line.match(/^    ([^\s][^:]*\.(?:ttf|ttc|otf|dfont)):\s*$/i);
    if (m) {
      if (cur) fonts.push(cur);
      cur = { filename: m[1], family: '', location: '' };
      continue;
    }
    if (!cur) continue;
    const fm = line.match(/^\s+Family:\s+(.+)$/);
    if (fm) cur.family = fm[1].trim();
    const lm = line.match(/^\s+Location:\s+(.+)$/);
    if (lm) cur.location = lm[1].trim();
  }
  if (cur) fonts.push(cur);
  return fonts;
}

function detectFontconfigFiles() {
  if (!which('fc-list')) return new Set();
  try {
    const raw = execFileSync('fc-list', ['--format=%{file}\n'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    return new Set(raw.split('\n').map((s) => s.trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function ensureFontconfigConf() {
  fs.mkdirSync(ASSET_LINKS_DIR, { recursive: true });
  fs.mkdirSync(FC_CONF_DIR, { recursive: true });
  let wrote = false;
  let existing = '';
  try { existing = fs.readFileSync(FC_CONF_FILE, 'utf8'); } catch {}
  if (existing.trim() !== FC_CONF_BODY.trim()) {
    fs.writeFileSync(FC_CONF_FILE, FC_CONF_BODY);
    wrote = true;
  }
  return wrote;
}

function activateAssetFonts(coreTextFonts, fontconfigFiles) {
  const existing = new Map();  // filename -> abs path of symlink
  if (dirExists(ASSET_LINKS_DIR)) {
    for (const name of fs.readdirSync(ASSET_LINKS_DIR)) {
      existing.set(name, path.join(ASSET_LINKS_DIR, name));
    }
  }

  let added = 0, kept = 0, removed = 0;
  const wantedNames = new Set();

  for (const f of coreTextFonts) {
    if (!f.location || !f.location.startsWith('/System/Library/AssetsV2/')) continue;
    if (!isLikelyKorean(f.family, f.filename)) continue;
    if (fontconfigFiles.has(f.location)) { kept++; continue; }  // already visible

    const dest = path.join(ASSET_LINKS_DIR, f.filename);
    wantedNames.add(f.filename);

    let needCreate = true;
    try {
      const cur = fs.readlinkSync(dest);
      if (cur === f.location) { kept++; needCreate = false; }
      else { fs.unlinkSync(dest); }
    } catch { /* doesn't exist yet */ }

    if (!needCreate) continue;
    try {
      fs.symlinkSync(f.location, dest);
      added++;
    } catch { /* race or permission, skip silently */ }
  }

  // Cleanup pass: anything in our dir not in wantedNames, or whose target is missing.
  for (const [name, full] of existing) {
    if (!wantedNames.has(name)) {
      try { fs.unlinkSync(full); removed++; } catch {}
      continue;
    }
    try {
      fs.statSync(full);  // resolves through symlink — throws if dangling
    } catch {
      try { fs.unlinkSync(full); removed++; } catch {}
    }
  }

  return { added, kept, removed };
}

function runFcCache() {
  if (!which('fc-cache')) return false;
  try {
    execFileSync('fc-cache', ['-f'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// After activation: list Korean fonts visible to fontconfig.
// One canonical name per font FILE (so 나눔스퀘어OTF / NanumSquareOTF
// don't appear twice for the same .otf), Korean-aware sort.
function detectKoreanFontsViaFontconfig() {
  if (!which('fc-list')) return [];
  let raw;
  try {
    raw = execFileSync('fc-list', ['--format=%{family}|%{file}\n'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
  } catch {
    return [];
  }
  const byFile = new Map();  // canonical name -> first alias seen
  for (const line of raw.split('\n')) {
    const idx = line.indexOf('|');
    if (idx < 0) continue;
    const familyPart = line.slice(0, idx);
    const file = line.slice(idx + 1).trim();
    if (!file) continue;
    const aliases = familyPart.split(',').map((s) => s.trim()).filter(Boolean);
    if (aliases.length === 0) continue;
    const isKor = aliases.some((a) => isLikelyKorean(a, '')) ||
                  isLikelyKorean('', path.basename(file));
    if (!isKor) continue;
    if (!byFile.has(file)) byFile.set(file, aliases[0]);
  }
  return [...new Set(byFile.values())].sort((a, b) => a.localeCompare(b, 'ko'));
}

function main() {
  const ctFonts = detectCoreTextFonts();
  const fcFiles = detectFontconfigFiles();

  const confWrote = ensureFontconfigConf();
  const act = activateAssetFonts(ctFonts, fcFiles);
  const cacheNeeded = act.added > 0 || act.removed > 0 || confWrote;
  const cacheRefreshed = cacheNeeded ? runFcCache() : true;

  const fonts = detectKoreanFontsViaFontconfig();

  const settings = {
    schema_version: 2,
    checked_at: new Date().toISOString(),
    fonts,
    asset_activation: {
      links_dir: ASSET_LINKS_DIR,
      conf_file: FC_CONF_FILE,
      added: act.added,
      kept: act.kept,
      removed_dangling: act.removed,
      conf_written: confWrote,
      cache_refreshed: cacheRefreshed,
    },
    codex_image: {
      available: dirExists(PLUGIN_PATHS.codex_image),
      path: dirExists(PLUGIN_PATHS.codex_image) ? PLUGIN_PATHS.codex_image : null,
    },
    codex_cli_plugin: {
      available: dirExists(PLUGIN_PATHS.codex_cli),
    },
    tools: {
      node:             !!which('node'),
      soffice:          !!which('soffice'),
      pdfinfo:          !!which('pdfinfo'),
      'fc-list':        !!which('fc-list'),
      'fc-cache':       !!which('fc-cache'),
      system_profiler:  !!which('system_profiler'),
    },
  };

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2) + '\n');

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(settings, null, 2));
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`체크 시각  : ${settings.checked_at}`);
  console.log(`설정 저장  : ${SETTINGS}`);
  console.log('───────────────────────────────────────');
  console.log('Asset 폰트 활성화 (fontconfig 전용 — 다른 앱 영향 없음):');
  console.log(`  심링크 dir   : ${settings.asset_activation.links_dir}`);
  console.log(`  fontconfig conf: ${settings.asset_activation.conf_file}`);
  console.log(`  새 활성화      : ${settings.asset_activation.added}`);
  console.log(`  이미 활성      : ${settings.asset_activation.kept}`);
  console.log(`  깨진 링크 정리 : ${settings.asset_activation.removed_dangling}`);
  console.log(`  fc-cache 갱신  : ${settings.asset_activation.cache_refreshed ? '✅' : '❌ (fc-cache 미설치?)'}`);
  console.log('───────────────────────────────────────');
  console.log('한국어 폰트 (활성화 후 fontconfig 기준):');
  if (settings.fonts.length === 0) {
    console.log('  (감지 실패 — fc-list 미설치 가능)');
  } else {
    settings.fonts.forEach((f) => console.log(`  - ${f}`));
  }
  console.log('───────────────────────────────────────');
  console.log(`codex-image     : ${settings.codex_image.available ? '✅ 설치됨' : '❌ 없음'}`);
  console.log(`codex-cli plugin: ${settings.codex_cli_plugin.available ? '✅ 설치됨' : '❌ 없음'}`);
  console.log('───────────────────────────────────────');
  console.log('필수 도구:');
  for (const [tool, ok] of Object.entries(settings.tools)) {
    console.log(`  ${ok ? '✅' : '❌'} ${tool}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();

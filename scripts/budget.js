#!/usr/bin/env node
// budget.js — 본문 총 자수를 챕터별로 분배
// ────────────────────────────────────────────────────────────────────────────
// 사용:
//   node ~/.claude/skills/book-summary-haebom/scripts/budget.js \
//        <본문_총_자수> <챕터_수> [가중치=균등]
//
// 가중치 형식:
//   "균등"            — 모든 챕터 같은 분량
//   "1,1,2,1,3,2,1"   — 챕터별 가중치 직접 지정 (쉼표 구분, 챕터 수와 일치)
//
// 예:
//   node budget.js 30000 8                    # 균등 분배
//   node budget.js 30000 8 1,1,1,2,2,3,2,1    # 클라이맥스 강조
//
// 출력:
//   각 챕터의 TARGET 자수 (TARGET 주석에 그대로 복붙 가능)
// ────────────────────────────────────────────────────────────────────────────

const [,, totalStr, countStr, weightsStr = '균등'] = process.argv;

if (!totalStr || !countStr) {
  console.error('사용: node budget.js <본문_총_자수> <챕터_수> [가중치]');
  console.error('예:   node budget.js 30000 8');
  console.error('     node budget.js 30000 8 1,1,1,2,2,3,2,1');
  process.exit(1);
}

const total = parseInt(totalStr, 10);
const count = parseInt(countStr, 10);

if (!Number.isFinite(total) || total <= 0) {
  console.error('❌ 본문 총 자수는 양수여야 합니다.');
  process.exit(1);
}
if (!Number.isFinite(count) || count <= 0) {
  console.error('❌ 챕터 수는 양수여야 합니다.');
  process.exit(1);
}

let weights;
if (weightsStr === '균등') {
  weights = Array(count).fill(1);
} else {
  weights = weightsStr.split(',').map((w) => {
    const n = parseFloat(w);
    if (!Number.isFinite(n) || n <= 0) {
      console.error(`❌ 잘못된 가중치: "${w}"`);
      process.exit(1);
    }
    return n;
  });

  if (weights.length !== count) {
    console.error(`❌ 가중치 개수(${weights.length})와 챕터 수(${count}) 불일치.`);
    process.exit(1);
  }
}

const weightSum = weights.reduce((a, b) => a + b, 0);
const allocations = weights.map((w) => Math.round((w / weightSum) * total));

// 반올림 오차 보정 — 마지막 챕터에 잔차 흡수
const allocSum = allocations.reduce((a, b) => a + b, 0);
allocations[allocations.length - 1] += total - allocSum;

// ── 출력 ───────────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`본문 총 자수 : ${total.toLocaleString()} 자`);
console.log(`챕터 수      : ${count}`);
console.log(`가중치       : ${weights.join(', ')}`);
console.log('───────────────────────────────────────');
console.log('챕터별 TARGET (각 챕터 파일 상단 주석에 복붙):');
console.log('');
allocations.forEach((chars, i) => {
  const idx = String(i + 1).padStart(2, '0');
  console.log(`  // chapters/${idx}_*.js`);
  console.log(`  // TARGET: ~${chars.toLocaleString()} 자`);
  console.log('');
});
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 가중치 가이드');
console.log('   - 균등 분배가 안전한 기본. 클라이맥스 챕터를 강조하고 싶을 때만 가중치.');
console.log('   - 도입부 챕터는 보통 가볍게(0.5-1), 클라이맥스는 무겁게(2-3).');
console.log('   - 마지막 챕터(수습)는 다시 가볍게(0.5-1).');

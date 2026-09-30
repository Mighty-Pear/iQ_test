'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildBank } = require('../js/bank.js');
const M = require('../js/matrices.js');

const bank = buildBank();

test('bank zadań jest deterministyczny (powtarzalność)', () => {
  const again = buildBank();
  assert.equal(again.hash, bank.hash);
  assert.deepEqual(again.matrices, bank.matrices);
});

test('liczba zadań', () => {
  assert.equal(bank.matrices.items.length, 30);
  assert.equal(bank.series.items.length, 15);
  assert.equal(bank.matrices.practice.length, 2);
  assert.equal(bank.series.practice.length, 2);
});

for (const item of [...bank.matrices.practice, ...bank.matrices.items]) {
  test(`matryca ${item.id}: jednoznaczna odpowiedź i bezstronne dystraktory`, () => {
    const cfg = M.CONFIGS[item.config];
    const full = item.cells.concat([item.options[item.correct]]);
    for (const k of Object.keys(cfg.attrs)) {
      const m = [0, 1, 2].map(r => [0, 1, 2].map(c => full[r * 3 + c][k]));
      assert.ok(M.isUnambiguous(m, cfg.attrs[k]), `atrybut ${k} niejednoznaczny`);
      // każda wartość atrybutu w opcjach: albo we wszystkich 8, albo dokładnie w 4 (drzewo bisekcji)
      const counts = {};
      for (const o of item.options) counts[o[k]] = (counts[o[k]] || 0) + 1;
      const vals = Object.values(counts).sort();
      assert.ok(JSON.stringify(vals) === '[8]' || JSON.stringify(vals) === '[4,4]', `atrybut ${k}: ${JSON.stringify(counts)}`);
    }
    assert.equal(new Set(item.options.map(o => JSON.stringify(o))).size, 8, 'opcje muszą być różne');
    // żaden dystraktor nie spełnia wszystkich reguł
    item.options.forEach((o, i) => {
      if (i === item.correct) return;
      const cand = item.cells.concat([o]);
      const fits = Object.keys(cfg.attrs).every(k =>
        M.isUnambiguous([0, 1, 2].map(r => [0, 1, 2].map(c => cand[r * 3 + c][k])), cfg.attrs[k]));
      assert.ok(!fits, `dystraktor ${i + 1} również spełnia reguły`);
    });
  });
}

test('pozycja poprawnej odpowiedzi jest zrównoważona', () => {
  const counts = Array(8).fill(0);
  bank.matrices.items.forEach(it => counts[it.correct]++);
  assert.ok(Math.max(...counts) <= 8, JSON.stringify(counts));
});

test('złożoność zadań rośnie wraz z numerem (korelacja rang > 0,9)', () => {
  const c = bank.matrices.items.map(i => i.complexity);
  const rank = a => a.map(v => a.filter(x => x < v).length + (a.filter(x => x === v).length - 1) / 2);
  const rx = rank(c.map((_, i) => i)), ry = rank(c);
  const n = c.length, mx = (n - 1) / 2;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (rx[i] - mx) * (ry[i] - mx); sxx += (rx[i] - mx) ** 2; syy += (ry[i] - mx) ** 2; }
  assert.ok(sxy / Math.sqrt(sxx * syy) > 0.9);
});

test('walidator wykrywa zadanie niejednoznaczne', () => {
  // wiersze: progresja +1, ale kolumny sugerują coś innego? Konstrukcja: 1 2 3 / 2 3 4 / 3 4 ? -> 5 (zgodne w obu kierunkach)
  assert.ok(M.isUnambiguous([[1, 2, 3], [2, 3, 4], [3, 4, 5]], { min: 0, max: 9 }));
  // wiersze: suma (1+2=3, 2+2=4 -> 3+2=5), kolumna 3: progresja 3,4 -> 5; przy odpowiedzi 6 walidator musi odrzucić
  assert.ok(M.isUnambiguous([[1, 2, 3], [2, 2, 4], [3, 2, 5]], { min: 0, max: 9 }));
  assert.ok(!M.isUnambiguous([[1, 2, 3], [2, 2, 4], [3, 2, 6]], { min: 0, max: 9 }));
  // sprzeczne hipotezy: wiersze = suma (-> 7), kolumny = progresja +1 (-> 6)
  assert.ok(!M.isUnambiguous([[1, 1, 2], [2, 2, 4], [3, 4, 7]], { min: 0, max: 9 }) ||
            M.predictions([[1, 1, 2], [2, 2, 4], [3, 4, null]], { min: 0, max: 9 }).every(p => p === 7));
  // brak jakiejkolwiek reguły -> niejednoznaczne
  assert.ok(!M.isUnambiguous([[1, 5, 2], [4, 1, 8], [2, 7, 3]], { min: 0, max: 9 }));
});

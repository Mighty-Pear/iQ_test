'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/series.js');

const expected = {
  'S-T1': [[2, 4, 6, 8, 10], 12], 'S-T2': [[1, 2, 4, 8, 16], 32],
  S01: [[3, 7, 11, 15, 19], 23], S02: [[40, 35, 30, 25, 20], 15], S03: [[2, 6, 18, 54], 162],
  S04: [[5, 6, 8, 11, 15], 20], S05: [[1, 4, 9, 16, 25], 36], S06: [[3, 5, 4, 6, 5, 7], 6],
  S07: [[2, 3, 5, 8, 13], 21], S08: [[96, 48, 24, 12], 6], S09: [[10, 3, 12, 5, 14, 7], 16],
  S10: [[1, 3, 7, 15, 31], 63], S11: [[7, 9, 13, 21, 37], 69], S12: [[1, 8, 27, 64], 125],
  S13: [[2, 4, 12, 48, 240], 1440], S14: [[1, 2, 5, 14, 41], 122], S15: [[3, 4, 8, 17, 33], 58],
};

test('ciągi: wyrazy i odpowiedzi wynikają z reguł', () => {
  const b = S.buildSeries();
  for (const it of [...b.practice, ...b.items]) {
    assert.deepEqual([it.terms, it.answer], expected[it.id], it.id);
    assert.ok(Number.isInteger(it.answer));
  }
});

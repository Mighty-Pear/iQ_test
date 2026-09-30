'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Sc = require('../js/scoring.js');
const { buildBank } = require('../js/bank.js');
const { NORMS } = require('../js/norms.js');

test('rozkład normalny', () => {
  assert.ok(Math.abs(Sc.normalCdf(0) - 0.5) < 1e-7);
  assert.ok(Math.abs(Sc.normalCdf(1.96) - 0.975) < 1e-3);
  assert.ok(Math.abs(Sc.normalCdf(-1) - 0.1587) < 1e-3);
});

test('przeliczenie na IQ', () => {
  assert.equal(Sc.toIq(20, { mean: 20, sd: 5 }), 100);
  assert.equal(Sc.toIq(25, { mean: 20, sd: 5 }), 115);
  assert.equal(Sc.toIq(10, { mean: 20, sd: 5 }), 70);
});

test('KR-20 – przykład kontrolny', () => {
  // idealna skala Guttmana 4 osoby × 3 zadania
  const m = [[1, 1, 1], [1, 1, 0], [1, 0, 0], [0, 0, 0]];
  // wariancja sum (populacyjna) = 1.25; Σpq = .1875+.25+.1875 = .625; KR20 = 1.5*(1-.5) = .75
  assert.ok(Math.abs(Sc.kr20(m) - 0.75) < 1e-9);
});

test('punktacja sesji i przedział ufności', () => {
  const bank = buildBank();
  const resp = {};
  bank.matrices.items.forEach((it, i) => { resp[it.id] = { answer: i < 15 ? it.correct : (it.correct + 1) % 8 }; });
  const sresp = {};
  bank.series.items.forEach((it, i) => { sresp[it.id] = { answer: i < 7 ? String(it.answer) : null }; });
  const sess = { sections: { matrices: { responses: resp }, series: { responses: sresp } } };
  const score = Sc.scoreSession(bank, sess);
  assert.equal(score.matrices.raw, 15);
  assert.equal(score.series.raw, 7);
  const it = Sc.interpret(score, NORMS, 30);
  assert.ok(it.ci90[0] < it.iq && it.iq < it.ci90[1]);
  assert.ok(it.percentile > 0 && it.percentile < 100);
});

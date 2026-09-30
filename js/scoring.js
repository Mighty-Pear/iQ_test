/* Punktacja, przeliczenie na IQ i statystyki psychometryczne. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rng.js'));
  else root.IQ = Object.assign(root.IQ || {}, factory(root.IQ));
})(this, function (R) {
  'use strict';

  // ---------- rozkład normalny ----------
  // erf – Abramowitz & Stegun 7.1.26 (błąd < 1.5e-7)
  function erf(x) {
    const s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  const normalCdf = z => 0.5 * (1 + erf(z / Math.SQRT2));

  // ---------- punktacja ----------
  function scoreSection(items, responses, isCorrect) {
    const perItem = items.map(it => {
      const r = responses[it.id];
      const answered = r && r.answer !== null && r.answer !== undefined && r.answer !== '';
      return answered && isCorrect(it, r.answer) ? 1 : 0;
    });
    return { raw: perItem.reduce((a, b) => a + b, 0), max: items.length, perItem };
  }

  function scoreSession(bank, session) {
    const m = scoreSection(bank.matrices.items, session.sections.matrices.responses, (it, a) => Number(a) === it.correct);
    const s = scoreSection(bank.series.items, session.sections.series.responses, (it, a) => Number(a) === it.answer);
    return { matrices: m, series: s, total: { raw: m.raw + s.raw, max: m.max + s.max } };
  }

  // ---------- normy ----------
  function pickGroup(norms, age) {
    return norms.groups.find(g => age >= g.ageMin && age <= g.ageMax) || norms.groups[norms.groups.length - 1];
  }

  const IQ_MIN = 55, IQ_MAX = 145; // poza tym zakresem normy ogólnopopulacyjne są niewiarygodne

  function toIq(raw, stat) {
    const iq = 100 + 15 * (raw - stat.mean) / stat.sd;
    return Math.round(iq);
  }

  function classify(iq) {
    if (iq >= 130) return 'bardzo wysoki';
    if (iq >= 120) return 'wysoki';
    if (iq >= 110) return 'powyżej przeciętnej';
    if (iq >= 90) return 'przeciętny';
    if (iq >= 80) return 'poniżej przeciętnej';
    if (iq >= 70) return 'niski';
    return 'bardzo niski';
  }

  function interpret(score, norms, age, bankHash) {
    const g = pickGroup(norms, age);
    const iqRaw = toIq(score.total.raw, g.total);
    const iq = Math.max(IQ_MIN, Math.min(IQ_MAX, iqRaw));
    const sem = 15 * Math.sqrt(1 - norms.reliability);
    const half = Math.round(1.645 * sem);
    const percentile = normalCdf((iq - 100) / 15) * 100;
    return {
      group: g.label,
      iq,
      clipped: iqRaw < IQ_MIN ? 'below' : iqRaw > IQ_MAX ? 'above' : null,
      ci90: [Math.max(40, iq - half), Math.min(160, iq + half)],
      sem: Math.round(sem * 10) / 10,
      percentile: Math.round(percentile * 10) / 10,
      category: classify(iq),
      sub: {
        matrices: toIq(score.matrices.raw, g.matrices),
        series: toIq(score.series.raw, g.series),
      },
      // normy wyliczone dla innej wersji zadań nie mogą być użyte jako empiryczne
      normsStatus: norms.bankHash && bankHash && norms.bankHash !== bankHash ? 'mismatch' : norms.status,
      normsVersion: norms.version,
    };
  }

  // ---------- statystyki (narzędzie normalizacyjne) ----------
  function mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
  function sd(a) { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); }
  function pearson(x, y) {
    const mx = mean(x), my = mean(y);
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
  }
  // KR-20 (Kuder i Richardson, 1937) dla macierzy 0/1: osoby × zadania
  function kr20(matrix) {
    const n = matrix.length, k = matrix[0] ? matrix[0].length : 0;
    if (n < 2 || k < 2) return null;
    const totals = matrix.map(r => r.reduce((a, b) => a + b, 0));
    const varT = sd(totals) ** 2 * (n - 1) / n;
    if (!varT) return null;
    let pq = 0;
    for (let j = 0; j < k; j++) { const p = mean(matrix.map(r => r[j])); pq += p * (1 - p); }
    return (k / (k - 1)) * (1 - pq / varT);
  }
  // Wskaźniki zadań: łatwość p i skorygowana korelacja zadanie–reszta testu
  function itemStats(matrix) {
    const k = matrix[0] ? matrix[0].length : 0;
    const totals = matrix.map(r => r.reduce((a, b) => a + b, 0));
    const out = [];
    for (let j = 0; j < k; j++) {
      const col = matrix.map(r => r[j]);
      out.push({ p: mean(col), rit: pearson(col, totals.map((t, i) => t - col[i])) });
    }
    return out;
  }

  // Suma kontrolna sesji (wykrywa przypadkowe/ręczne modyfikacje odpowiedzi).
  function sessionChecksum(session) {
    const payload = JSON.stringify([session.bankHash, session.participant.age,
      session.sections.matrices.responses, session.sections.series.responses]);
    return R.hashHex(payload).slice(0, 12).toUpperCase();
  }

  return { erf, normalCdf, scoreSession, interpret, toIq, classify, pickGroup, mean, sd, pearson, kr20, itemStats, sessionChecksum, IQ_MIN, IQ_MAX };
});

/* Zadania „ciągi liczbowe" (rozumowanie indukcyjne, Gf; format jak w podteście
 * Number/Letter Series ICAR – Condon i Revelle, 2014). Odpowiedź otwarta (wpisywana),
 * więc zgadywanie praktycznie nie wpływa na wynik. Liczby są niezależne od języka.
 * Każde zadanie ma zdefiniowaną regułę `gen(n)` — test automatyczny sprawdza,
 * że wyrazy i odpowiedź wynikają z reguły. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IQ = Object.assign(root.IQ || {}, factory());
})(this, function () {
  'use strict';

  // Pomocnicze generatory: zwracają tablicę `len` wyrazów.
  const arith = (a, d) => len => Array.from({ length: len }, (_, i) => a + i * d);
  const geom = (a, q) => len => Array.from({ length: len }, (_, i) => a * Math.pow(q, i));
  const rec = (first, f) => len => { const s = first.slice(); while (s.length < len) s.push(f(s, s.length)); return s.slice(0, len); };
  const interleave = (g1, g2) => len => {
    const a = g1(Math.ceil(len / 2)), b = g2(Math.floor(len / 2));
    return Array.from({ length: len }, (_, i) => (i % 2 === 0 ? a[i / 2] : b[(i - 1) / 2]));
  };

  const SERIES = [
    // trening
    { id: 'S-T1', shown: 5, gen: arith(2, 2), rule: 'Każdy kolejny wyraz jest większy o 2.' },
    { id: 'S-T2', shown: 5, gen: geom(1, 2), rule: 'Każdy kolejny wyraz jest dwa razy większy.' },
    // zadania właściwe (kolejność wg przewidywanej trudności)
    { id: 'S01', shown: 5, gen: arith(3, 4), rule: '+4' },
    { id: 'S02', shown: 5, gen: arith(40, -5), rule: '−5' },
    { id: 'S03', shown: 4, gen: geom(2, 3), rule: '×3' },
    { id: 'S04', shown: 5, gen: rec([5], (s, i) => s[i - 1] + i), rule: '+1, +2, +3, +4, …' },
    { id: 'S05', shown: 5, gen: len => Array.from({ length: len }, (_, i) => (i + 1) * (i + 1)), rule: 'kwadraty kolejnych liczb' },
    { id: 'S06', shown: 6, gen: interleave(arith(3, 1), arith(5, 1)), rule: 'dwa przeplatające się ciągi, każdy +1' },
    { id: 'S07', shown: 5, gen: rec([2, 3], (s, i) => s[i - 1] + s[i - 2]), rule: 'suma dwóch poprzednich' },
    { id: 'S08', shown: 4, gen: geom(96, 0.5), rule: ':2' },
    { id: 'S09', shown: 6, gen: interleave(arith(10, 2), arith(3, 2)), rule: 'dwa przeplatające się ciągi: 10, 12, 14… oraz 3, 5, 7…' },
    { id: 'S10', shown: 5, gen: rec([1], s => s[s.length - 1] * 2 + 1), rule: '×2 +1' },
    { id: 'S11', shown: 5, gen: rec([7], (s, i) => s[i - 1] + Math.pow(2, i)), rule: '+2, +4, +8, +16, …' },
    { id: 'S12', shown: 4, gen: len => Array.from({ length: len }, (_, i) => Math.pow(i + 1, 3)), rule: 'sześciany kolejnych liczb' },
    { id: 'S13', shown: 5, gen: rec([2], (s, i) => s[i - 1] * (i + 1)), rule: '×2, ×3, ×4, ×5, …' },
    { id: 'S14', shown: 5, gen: rec([1], s => s[s.length - 1] * 3 - 1), rule: '×3 −1' },
    { id: 'S15', shown: 5, gen: rec([3], (s, i) => s[i - 1] + i * i), rule: '+1, +4, +9, +16, … (kwadraty)' },
  ];

  function materialize(def) {
    const all = def.gen(def.shown + 1);
    return { id: def.id, terms: all.slice(0, def.shown), answer: all[def.shown], rule: def.rule };
  }

  function buildSeries() {
    const items = SERIES.map(materialize);
    return { practice: items.filter(i => i.id.startsWith('S-T')), items: items.filter(i => !i.id.startsWith('S-T')) };
  }

  return { SERIES_DEFS: SERIES, buildSeries };
});

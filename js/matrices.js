/* Generator zadań typu „matryce progresywne" (rozumowanie niewerbalne, Gf).
 *
 * Model zadań: taksonomia reguł Carpentera, Justa i Shella (1990) w wersji
 * formalnej zbioru RAVEN (Zhang i in., 2019): reguły działają w wierszach
 * na atrybutach figur (stała, progresja, arytmetyka, rozkład trzech wartości).
 * Odpowiedzi-dystraktory: drzewo bisekcji atrybutów (I-RAVEN, Hu i in., 2021),
 * dzięki któremu poprawnej odpowiedzi nie da się odgadnąć bez analizy matrycy.
 *
 * Każde zadanie jest generowane deterministycznie z seeda, a następnie
 * walidowane: odrzucane jest każde zadanie, w którym jakakolwiek alternatywna
 * reguła (wierszowa lub kolumnowa) zgodna z danymi przewiduje inną odpowiedź.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./rng.js'));
  else root.IQ = Object.assign(root.IQ || {}, factory(root.IQ));
})(this, function (R) {
  'use strict';

  const TYPES = ['triangle', 'square', 'pentagon', 'hexagon', 'circle'];
  const TYPE_SIDES = [3, 4, 5, 6, 0];
  // Odcienie szarości (luminancja) – czytelne także dla osób z zaburzeniami widzenia barw.
  const COLORS = ['#ffffff', '#cfcfcf', '#a0a0a0', '#737373', '#474747', '#161616'];
  const CENTER_SIZES = [0.42, 0.53, 0.64, 0.75, 0.87, 1.0];
  const SMALL_SIZES = [0.55, 0.77, 1.0];

  const CONFIGS = {
    center: {
      label: 'jedna figura',
      attrs: {
        type: { min: 0, max: 4, nominal: true, progMax: 3 },
        size: { min: 0, max: 5 },
        color: { min: 0, max: 5 },
      },
    },
    grid: {
      label: 'układ figur 3×3',
      attrs: {
        number: { min: 1, max: 9 },
        type: { min: 0, max: 4, nominal: true, progMax: 3 },
        size: { min: 0, max: 2 },
        color: { min: 0, max: 5 },
      },
    },
    inout: {
      label: 'figura w figurze',
      attrs: {
        oType: { min: 0, max: 4, nominal: true, progMax: 3 },
        iType: { min: 0, max: 4, nominal: true, progMax: 3 },
        iSize: { min: 0, max: 2 },
        iColor: { min: 0, max: 5 },
      },
    },
  };

  // Wagi złożoności reguł (kolejność trudności zgodna z Carpenter i in., 1990; Matzen i in., 2010).
  const RULE_WEIGHT = { fixed: 0, const: 0.5, prog: 1, dist3: 1.5, arith: 2 };
  const CONFIG_WEIGHT = { center: 0, grid: 0.5, inout: 1 };

  // Plan formy A: 30 zadań o rosnącej złożoności + 2 zadania treningowe.
  const F = 'fixed', C = 'const', P = 'prog', D = 'dist3', A = 'arith';
  const PRACTICE_PLAN = [
    { config: 'center', rules: { type: P, size: F, color: F } },
    { config: 'grid', rules: { number: P, type: F, size: F, color: F } },
  ];
  const FORM_A_PLAN = [
    { config: 'center', rules: { type: P, size: F, color: F } },
    { config: 'center', rules: { type: F, size: P, color: F } },
    { config: 'center', rules: { type: F, size: F, color: P } },
    { config: 'grid', rules: { number: P, type: F, size: F, color: F } },
    { config: 'center', rules: { type: D, size: F, color: F } },
    { config: 'center', rules: { type: C, size: P, color: F } },
    { config: 'center', rules: { type: F, size: D, color: C } },
    { config: 'grid', rules: { number: C, type: P, size: F, color: F } },
    { config: 'center', rules: { type: P, size: P, color: F } },
    { config: 'center', rules: { type: D, size: F, color: P } },
    { config: 'grid', rules: { number: A, type: F, size: F, color: F } },
    { config: 'inout', rules: { oType: P, iType: F, iSize: F, iColor: F } },
    { config: 'center', rules: { type: P, size: C, color: D } },
    { config: 'grid', rules: { number: P, type: D, size: F, color: F } },
    { config: 'inout', rules: { oType: D, iType: P, iSize: F, iColor: F } },
    { config: 'center', rules: { type: D, size: P, color: P } },
    { config: 'grid', rules: { number: D, type: F, size: P, color: C } },
    { config: 'inout', rules: { oType: C, iType: D, iSize: P, iColor: F } },
    { config: 'center', rules: { type: D, size: D, color: P } },
    { config: 'grid', rules: { number: A, type: D, size: F, color: F } },
    { config: 'inout', rules: { oType: P, iType: F, iSize: D, iColor: P } },
    { config: 'center', rules: { type: D, size: D, color: D } },
    { config: 'grid', rules: { number: P, type: D, size: F, color: P } },
    { config: 'inout', rules: { oType: D, iType: D, iSize: P, iColor: F } },
    { config: 'grid', rules: { number: A, type: P, size: C, color: D } },
    { config: 'inout', rules: { oType: P, iType: D, iSize: F, iColor: D } },
    { config: 'grid', rules: { number: D, type: D, size: D, color: P } },
    { config: 'inout', rules: { oType: D, iType: P, iSize: D, iColor: P } },
    { config: 'grid', rules: { number: A, type: D, size: P, color: D } },
    { config: 'inout', rules: { oType: D, iType: D, iSize: D, iColor: D } },
  ];

  function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
  function transpose(m) { return [0, 1, 2].map(c => [0, 1, 2].map(r => m[r][c])); }

  // Generuje macierz 3×3 wartości atrybutu zgodnie z regułą. Zwraca {m, meta}.
  function genValues(rule, spec, rng) {
    const min = spec.min;
    // progresja kształtu tylko wśród wielokątów (3–6 boków) – koło nie ma „kolejnej liczby boków”
    const max = rule === 'prog' && spec.progMax !== undefined ? spec.progMax : spec.max;
    const m = [[], [], []];
    const meta = { rule };
    if (rule === F) {
      const v = rng.int(min, max);
      for (let r = 0; r < 3; r++) m[r] = [v, v, v];
    } else if (rule === C) {
      for (let r = 0; r < 3; r++) { const v = rng.int(min, max); m[r] = [v, v, v]; }
      if (m[0][0] === m[1][0] && m[1][0] === m[2][0]) return null; // byłoby to 'fixed'
    } else if (rule === P) {
      const ds = [1, -1, 2, -2].filter(d => Math.abs(d) * 2 <= max - min);
      const d = rng.pick(ds);
      meta.d = d;
      for (let r = 0; r < 3; r++) {
        const lo = d > 0 ? min : min - 2 * d;
        const hi = d > 0 ? max - 2 * d : max;
        const s = rng.int(lo, hi);
        m[r] = [s, s + d, s + 2 * d];
      }
    } else if (rule === D) {
      const vals = rng.shuffle(range(min, max)).slice(0, 3);
      const shift = rng.pick([1, 2]);
      for (let r = 0; r < 3; r++) m[r] = [0, 1, 2].map(c => vals[(c + shift * r) % 3]);
    } else if (rule === A) {
      const op = rng.pick(['add', 'sub']);
      meta.op = op;
      for (let r = 0; r < 3; r++) {
        if (op === 'add') {
          const a = rng.int(min, max - min);
          const b = rng.int(min, max - a);
          m[r] = [a, b, a + b];
        } else {
          const a = rng.int(2 * min, max);
          const b = rng.int(min, a - min);
          m[r] = [a, b, a - b];
        }
      }
    } else {
      throw new Error('Nieznana reguła: ' + rule);
    }
    return { m, meta };
  }

  /* Zbiór przewidywań dla brakującego pola (m[2][2]) ze wszystkich hipotez,
   * które są zgodne z ośmioma znanymi polami — zarówno w wierszach, jak i w kolumnach. */
  function predictions(m, spec) {
    const preds = [];
    const inRange = v => Number.isInteger(v) && v >= spec.min && v <= spec.max;
    for (const g of [m, transpose(m)]) {
      const [a, b, c] = g;
      // stała w wierszu
      if (a[0] === a[1] && a[1] === a[2] && b[0] === b[1] && b[1] === b[2] && c[0] === c[1]) preds.push(c[0]);
      // progresja o stałym kroku
      const d = a[1] - a[0];
      if (d !== 0 && a[2] - a[1] === d && b[1] - b[0] === d && b[2] - b[1] === d && c[1] - c[0] === d) preds.push(c[1] + d);
      // arytmetyka (suma / różnica) – tylko atrybuty ilościowe
      if (!spec.nominal) {
        if (a[2] === a[0] + a[1] && b[2] === b[0] + b[1]) preds.push(c[0] + c[1]);
        if (a[2] === a[0] - a[1] && b[2] === b[0] - b[1]) preds.push(c[0] - c[1]);
      }
      // rozkład trzech wartości
      const sa = new Set(a), sb = new Set(b);
      if (sa.size === 3 && sb.size === 3 && [...sa].every(v => sb.has(v)) &&
          c[0] !== c[1] && sa.has(c[0]) && sa.has(c[1])) {
        preds.push([...sa].find(v => v !== c[0] && v !== c[1]));
      }
    }
    return preds.filter(inRange);
  }

  function isUnambiguous(m, spec) {
    const masked = m.map(r => r.slice());
    const answer = masked[2][2];
    masked[2][2] = null;
    const preds = predictions(masked, spec);
    return preds.length > 0 && preds.every(p => p === answer);
  }

  function complexity(plan) {
    let s = CONFIG_WEIGHT[plan.config];
    for (const k in plan.rules) s += RULE_WEIGHT[plan.rules[k]];
    return Math.round(s * 10) / 10;
  }

  function panelKey(p) { return JSON.stringify(p); }

  function generateItem(id, plan, seedBase) {
    const cfg = CONFIGS[plan.config];
    const keys = Object.keys(cfg.attrs);
    for (let attempt = 0; attempt < 2000; attempt++) {
      const rng = R.makeRng(seedBase + '|' + id + '|' + attempt);
      const grids = {}, metas = {};
      let ok = true;
      for (const k of keys) {
        const res = genValues(plan.rules[k], cfg.attrs[k], rng);
        if (!res || !isUnambiguous(res.m, cfg.attrs[k])) { ok = false; break; }
        grids[k] = res.m;
        metas[k] = res.meta;
      }
      if (!ok) continue;

      const cells = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const p = {};
        for (const k of keys) p[k] = grids[k][r][c];
        cells.push(p);
      }
      const answer = cells[8];

      // Drzewo bisekcji atrybutów: 3 poziomy => 8 opcji; każda wartość
      // każdego zmienianego atrybutu występuje w dokładnie połowie opcji.
      const varying = rng.shuffle(keys.filter(k => plan.rules[k] !== F));
      const fixed = rng.shuffle(keys.filter(k => plan.rules[k] === F));
      const chosen = varying.concat(fixed).slice(0, 3);
      let opts = [answer];
      for (const k of chosen) {
        const spec = cfg.attrs[k];
        const alts = range(spec.min, spec.max).filter(v => v !== answer[k]);
        const seen = new Set(grids[k].flat());
        const plausible = alts.filter(v => seen.has(v));
        const alt = rng.pick(plausible.length ? plausible : alts);
        opts = opts.flatMap(o => [o, Object.assign({}, o, { [k]: alt })]);
      }
      if (new Set(opts.map(panelKey)).size !== 8) continue;

      const order = rng.shuffle(range(0, 7));
      const options = order.map(i => opts[i]);
      const correct = order.indexOf(0);
      return {
        id,
        config: plan.config,
        rules: metas,
        complexity: complexity(plan),
        cells: cells.slice(0, 8),
        options,
        correct,
        attempt,
      };
    }
    throw new Error('Nie udało się wygenerować jednoznacznego zadania ' + id);
  }

  function buildMatrices(formId) {
    const seedBase = 'IQ-PL/matryce/' + formId + '/v1';
    return {
      practice: PRACTICE_PLAN.map((p, i) => generateItem('M-T' + (i + 1), p, seedBase + '/trening')),
      items: FORM_A_PLAN.map((p, i) => generateItem('M' + String(i + 1).padStart(2, '0'), p, seedBase)),
    };
  }

  // ---------- Opis reguł (dla zadań treningowych i dokumentacji) ----------
  // [mianownik, rodzaj: m/f]
  const ATTR_PL = {
    type: ['kształt figury', 'm'], size: ['wielkość figury', 'f'], color: ['odcień wypełnienia', 'm'],
    number: ['liczba figur', 'f'], oType: ['kształt figury zewnętrznej', 'm'], iType: ['kształt figury wewnętrznej', 'm'],
    iSize: ['wielkość figury wewnętrznej', 'f'], iColor: ['odcień figury wewnętrznej', 'm'],
  };
  const QUANT = {
    type: ['liczba boków figury', 'rośnie', 'maleje'], oType: ['liczba boków figury zewnętrznej', 'rośnie', 'maleje'],
    iType: ['liczba boków figury wewnętrznej', 'rośnie', 'maleje'],
    size: ['figura', 'powiększa się', 'zmniejsza się'], iSize: ['figura wewnętrzna', 'powiększa się', 'zmniejsza się'],
    color: ['wypełnienie', 'ciemnieje', 'jaśnieje'], iColor: ['wypełnienie figury wewnętrznej', 'ciemnieje', 'jaśnieje'],
    number: ['liczba figur', 'rośnie', 'maleje'],
  };
  const stepsPl = n => n === 1 ? '1 stopień' : n + ' stopnie';
  function describeRule(key, meta) {
    const [name, g] = ATTR_PL[key];
    const cap = name[0].toUpperCase() + name.slice(1);
    switch (meta.rule) {
      case F: return cap + (g === 'f' ? ' jest taka sama' : ' jest taki sam') + ' we wszystkich polach.';
      case C: return cap + (g === 'f' ? ' jest stała' : ' jest stały') + ' w obrębie każdego wiersza.';
      case P: {
        const [what, up, down] = QUANT[key];
        const n = Math.abs(meta.d);
        const unit = /boków|liczba/.test(what) ? String(n) : stepsPl(n);
        return 'W każdym wierszu ' + what + ' ' + (meta.d > 0 ? up : down) + ' o ' + unit + ' z pola na pole.';
      }
      case D: return cap + ': w każdym wierszu występują te same trzy warianty, za każdym razem w innej kolejności.';
      case A: return cap + ': w każdym wierszu trzecie pole = ' + (meta.op === 'add' ? 'suma' : 'różnica') + ' dwóch pierwszych.';
    }
    return '';
  }
  function explain(item) {
    return Object.keys(item.rules).map(k => describeRule(k, item.rules[k]));
  }

  // ---------- Rysowanie SVG ----------
  const AREA_COMP = [1.11, 1.0, 0.96, 0.94, 0.89]; // częściowe wyrównanie pola powierzchni figur
  const STROKE = '#1a1a1a';

  function shapeSvg(type, cx, cy, r, fill, sw) {
    const t = TYPES[type];
    if (t === 'circle') return `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="${fill}" stroke="${STROKE}" stroke-width="${sw}"/>`;
    const n = TYPE_SIDES[type];
    const a0 = t === 'square' ? -135 : -90;
    const cyAdj = t === 'triangle' ? cy + r * 0.12 : cy; // optyczne wyśrodkowanie trójkąta
    const pts = [];
    for (let i = 0; i < n; i++) {
      const ang = (a0 + (360 / n) * i) * Math.PI / 180;
      pts.push((cx + r * Math.cos(ang)).toFixed(2) + ',' + (cyAdj + r * Math.sin(ang)).toFixed(2));
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${STROKE}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }

  const DICE = {
    1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8], 7: [0, 2, 3, 4, 5, 6, 8], 8: [0, 1, 2, 3, 5, 6, 7, 8], 9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  };

  function panelInner(p, config) {
    if (config === 'center') {
      const r = 40 * CENTER_SIZES[p.size] * AREA_COMP[p.type];
      return shapeSvg(p.type, 50, 50, r, COLORS[p.color], 2.2);
    }
    if (config === 'grid') {
      const r = 12.5 * SMALL_SIZES[p.size] * AREA_COMP[p.type];
      return DICE[p.number].map(pos => {
        const cx = 17 + (pos % 3) * 33, cy = 17 + Math.floor(pos / 3) * 33;
        return shapeSvg(p.type, cx, cy, r, COLORS[p.color], 1.6);
      }).join('');
    }
    if (config === 'inout') {
      const outer = shapeSvg(p.oType, 50, 50, 42 * AREA_COMP[p.oType], '#ffffff', 2.2);
      const inner = shapeSvg(p.iType, 50, 50 + (TYPES[p.oType] === 'triangle' ? 42 * 1.11 * 0.12 : 0),
        17 * SMALL_SIZES[p.iSize] * AREA_COMP[p.iType], COLORS[p.iColor], 1.8);
      return outer + inner;
    }
    return '';
  }

  function panelSvg(p, config, label) {
    return `<svg viewBox="0 0 100 100" role="img" aria-label="${label || 'figura'}" xmlns="http://www.w3.org/2000/svg">` +
      (p ? panelInner(p, config) : `<text x="50" y="64" text-anchor="middle" font-size="44" font-family="system-ui, sans-serif" fill="#888">?</text>`) +
      `</svg>`;
  }

  return {
    TYPES, COLORS, CONFIGS, FORM_A_PLAN, PRACTICE_PLAN,
    genValues, predictions, isUnambiguous, generateItem, buildMatrices, complexity, explain, panelSvg,
  };
});

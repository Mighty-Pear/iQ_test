/* Deterministyczny generator liczb pseudolosowych.
 * Ten sam seed => identyczna sekwencja w każdej przeglądarce (tylko arytmetyka całkowitoliczbowa 32-bit). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IQ = Object.assign(root.IQ || {}, factory());
})(this, function () {
  'use strict';

  // FNV-1a 32-bit
  function hash32(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function hashHex(str) {
    // dwa niezależne przebiegi => 64 bity, mniejsze ryzyko kolizji
    const a = hash32(str).toString(16).padStart(8, '0');
    const b = hash32('#' + str + '#').toString(16).padStart(8, '0');
    return a + b;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seedStr) {
    const next = mulberry32(hash32(String(seedStr)));
    const rng = {
      next,
      int(min, max) { return min + Math.floor(next() * (max - min + 1)); },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
    };
    return rng;
  }

  return { hash32, hashHex, makeRng };
});

/* Normy przeliczania wyniku surowego na skalę IQ (M = 100, SD = 15).
 *
 * UWAGA: status "provisional" = wartości ZAŁOŻONE, nie empiryczne.
 * Aby wynik IQ był miarodajny, należy zastąpić ten plik normami wyliczonymi
 * w narzędziu normalizacja.html na reprezentatywnej próbie Polaków
 * (zalecane N ≥ 500, dobór warstwowy wg wieku, płci, wykształcenia i klasy
 * miejscowości zgodnie z danymi GUS; min. 100 osób w każdej grupie wiekowej). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IQ = Object.assign(root.IQ || {}, factory());
})(this, function () {
  'use strict';
  return {
    NORMS: {
      version: 'tymczasowe-0',
      status: 'provisional',
      bankHash: null,
      createdAt: null,
      description: 'Normy tymczasowe: założono średnią = 50% maksymalnego wyniku i SD = 18% maksimum. ' +
        'Nie pochodzą z badań – wynik IQ jest wyłącznie orientacyjny.',
      reliability: 0.85,
      groups: [
        {
          label: '16+ (wszyscy)', ageMin: 16, ageMax: 120, n: 0,
          total: { mean: 22.5, sd: 8.1 },
          matrices: { mean: 15, sd: 5.4 },
          series: { mean: 7.5, sd: 2.7 },
        },
      ],
    },
  };
});

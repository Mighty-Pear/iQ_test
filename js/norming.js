/* Narzędzie weryfikacji i normalizacji (strona normalizacja.html). */
(function () {
  'use strict';
  const IQ = window.IQ;
  const BANK = IQ.buildBank();
  const AGE_BANDS = [[16, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 120]];
  const out = document.getElementById('out');
  let records = [];

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f2 = x => (x === null || x === undefined || Number.isNaN(x)) ? '–' : x.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function verify(sess, fileName) {
    const rec = { file: fileName, ok: false, issues: [], sess };
    if (!sess || sess.app !== 'test-iq-pl') { rec.issues.push('to nie jest plik wyniku tego testu'); return rec; }
    if (sess.bankHash !== BANK.hash) { rec.issues.push('inna wersja zadań (' + sess.bankHash + ' ≠ ' + BANK.hash + ') – wynik nieporównywalny'); return rec; }
    const score = IQ.scoreSession(BANK, sess);
    rec.score = score;
    if (!sess.score || sess.score.total.raw !== score.total.raw) rec.issues.push('zapisany wynik różni się od przeliczonego');
    if (IQ.sessionChecksum(sess) !== sess.checksum) rec.issues.push('niezgodna suma kontrolna – plik był modyfikowany');
    for (const key of ['matrices', 'series']) {
      const s = sess.sections[key];
      const used = (s.endedAt - s.startedAt) / 1000;
      if (used > s.timeLimitSec + 5) rec.issues.push(`przekroczony limit czasu w części ${key} (${Math.round(used)} s)`);
    }
    if (records.some(r => r.sess && r.sess.checksum === sess.checksum && r.sess.startedAt === sess.startedAt)) rec.issues.push('duplikat – ten sam wynik wczytano już wcześniej');
    rec.ok = rec.issues.length === 0;
    rec.age = Number(sess.participant && sess.participant.age);
    return rec;
  }

  function stat(arr) { return { mean: IQ.mean(arr), sd: IQ.sd(arr) }; }

  function analyse() {
    const valid = records.filter(r => r.ok);
    let html = `<h2>Wczytane pliki (${records.length})</h2><div class="card" style="overflow-x:auto"><table>
      <thead><tr><th>Plik</th><th>Wiek</th><th>Matryce</th><th>Ciągi</th><th>Razem</th><th>Status</th></tr></thead><tbody>` +
      records.map(r => `<tr><td>${esc(r.file)}</td><td>${r.age || '–'}</td>
        <td>${r.score ? r.score.matrices.raw : '–'}</td><td>${r.score ? r.score.series.raw : '–'}</td><td>${r.score ? r.score.total.raw : '–'}</td>
        <td style="color:${r.ok ? 'var(--ok)' : 'var(--bad)'}">${r.ok ? 'zweryfikowany' : esc(r.issues.join('; '))}</td></tr>`).join('') +
      `</tbody></table></div>`;

    if (valid.length < 2) { out.innerHTML = html + '<p>Do analizy potrzeba co najmniej 2 zweryfikowanych wyników.</p>'; return; }

    const mM = valid.map(r => r.score.matrices.perItem), mS = valid.map(r => r.score.series.perItem);
    const mAll = valid.map((r, i) => mM[i].concat(mS[i]));
    const rel = { matrices: IQ.kr20(mM), series: IQ.kr20(mS), total: IQ.kr20(mAll) };
    const T = k => valid.map(r => r.score[k].raw);

    html += `<h2>Statystyki (N = ${valid.length})</h2><div class="card" style="overflow-x:auto"><table>
      <thead><tr><th>Skala</th><th>Średnia</th><th>SD</th><th>Min</th><th>Max</th><th>KR-20</th></tr></thead><tbody>` +
      ['matrices', 'series', 'total'].map(k => { const a = T(k); const s = stat(a);
        return `<tr><td>${{ matrices: 'Matryce', series: 'Ciągi', total: 'Razem' }[k]}</td><td>${f2(s.mean)}</td><td>${f2(s.sd)}</td>
          <td>${Math.min(...a)}</td><td>${Math.max(...a)}</td><td>${f2(rel[k])}</td></tr>`; }).join('') +
      `</tbody></table><p class="small muted">Korelacja matryce–ciągi: r = ${f2(IQ.pearson(T('matrices'), T('series')))}.
       Rzetelność KR-20 ≥ 0,80 uznaje się za wystarczającą do porównań grupowych, ≥ 0,90 – do decyzji indywidualnych.</p></div>`;

    const bandRows = AGE_BANDS.map(([a, b]) => {
      const g = valid.filter(r => r.age >= a && r.age <= b);
      const s = g.length ? stat(g.map(r => r.score.total.raw)) : null;
      return `<tr><td>${a}–${b === 120 ? '…' : b}</td><td>${g.length}</td><td>${s ? f2(s.mean) : '–'}</td><td>${s && g.length > 1 ? f2(s.sd) : '–'}</td></tr>`;
    }).join('');
    html += `<h2>Grupy wiekowe</h2><div class="card"><table><thead><tr><th>Wiek</th><th>N</th><th>Średnia (razem)</th><th>SD</th></tr></thead><tbody>${bandRows}</tbody></table></div>`;

    const items = BANK.matrices.items.map(i => i.id).concat(BANK.series.items.map(i => i.id));
    const ist = IQ.itemStats(mAll);
    html += `<h2>Analiza zadań</h2><div class="card" style="overflow-x:auto"><table>
      <thead><tr><th>Zadanie</th><th>Łatwość p</th><th>Moc różnicująca r<sub>it</sub></th><th>Uwagi</th></tr></thead><tbody>` +
      ist.map((s, j) => {
        const notes = [];
        if (s.p > 0.95) notes.push('za łatwe');
        if (s.p < 0.05) notes.push('za trudne');
        if (s.rit < 0.2) notes.push('słabo różnicuje – do przeglądu');
        return `<tr><td>${items[j]}</td><td>${f2(s.p)}</td><td>${f2(s.rit)}</td><td>${notes.join(', ')}</td></tr>`;
      }).join('') + `</tbody></table></div>`;

    html += `<h2>Eksport</h2><div class="card">
      <div class="field"><label for="minN">Minimalna liczebność grupy wiekowej, dla której tworzyć osobne normy</label>
        <input id="minN" type="number" value="100" min="30"></div>
      <div class="field"><label for="sample">Opis próby (trafi do norm i będzie widoczny dla badanych)</label>
        <input id="sample" type="text" style="width:100%" placeholder="np. próba warstwowa wg GUS (wiek, płeć, wykształcenie, klasa miejscowości), badanie nadzorowane, 2027"></div>
      <div class="actions">
        <button class="btn primary" id="dlNorms">Pobierz norms.js</button>
        <button class="btn" id="dlCsv">Pobierz dane (CSV)</button>
      </div>
      <p class="small muted">Plik norms.js zastępuje js/norms.js w katalogu aplikacji. Normy zostaną oznaczone jako empiryczne.
        Zalecenia: N ≥ 500 łącznie, ≥ 100 w grupie wiekowej, próba dobrana warstwowo, badanie w kontrolowanych warunkach.</p></div>`;
    out.innerHTML = html;

    document.getElementById('dlCsv').onclick = () => {
      const head = ['plik', 'wiek', 'plec', 'wyksztalcenie', ...items, 'matryce', 'ciagi', 'razem', 'czas_matryce_s', 'czas_ciagi_s'];
      const lines = [head.join(';')].concat(valid.map((r, i) => [
        r.file, r.age, r.sess.participant.sex || '', r.sess.participant.edu || '', ...mAll[i],
        r.score.matrices.raw, r.score.series.raw, r.score.total.raw,
        Math.round((r.sess.sections.matrices.endedAt - r.sess.sections.matrices.startedAt) / 1000),
        Math.round((r.sess.sections.series.endedAt - r.sess.sections.series.startedAt) / 1000),
      ].join(';')));
      download('wyniki-iq.csv', '﻿' + lines.join('\r\n'), 'text/csv');
    };

    document.getElementById('dlNorms').onclick = () => {
      const minN = Math.max(30, Number(document.getElementById('minN').value) || 100);
      const sample = document.getElementById('sample').value.trim();
      const mk = (label, a, b, group) => ({
        label, ageMin: a, ageMax: b, n: group.length,
        total: round(stat(group.map(r => r.score.total.raw))),
        matrices: round(stat(group.map(r => r.score.matrices.raw))),
        series: round(stat(group.map(r => r.score.series.raw))),
      });
      const groups = [];
      for (const [a, b] of AGE_BANDS) {
        const g = valid.filter(r => r.age >= a && r.age <= b);
        if (g.length >= minN) groups.push(mk(`${a}–${b === 120 ? '…' : b} lat`, a, b, g));
      }
      groups.push(mk('16+ (wszyscy)', 16, 120, valid));
      const norms = {
        version: 'empiryczne-' + new Date().toISOString().slice(0, 10),
        status: 'empirical',
        bankHash: BANK.hash,
        createdAt: new Date().toISOString(),
        description: `Normy empiryczne, N = ${valid.length}${sample ? '; ' + sample : ''}.`,
        reliability: Math.round(rel.total * 1000) / 1000,
        groups,
      };
      const js = `/* Normy wygenerowane w normalizacja.html – ${norms.createdAt} */\n(function (root, factory) {\n` +
        `  if (typeof module === 'object' && module.exports) module.exports = factory();\n` +
        `  else root.IQ = Object.assign(root.IQ || {}, factory());\n})(this, function () {\n  'use strict';\n` +
        `  return { NORMS: ${JSON.stringify(norms, null, 2).replace(/\n/g, '\n  ')} };\n});\n`;
      download('norms.js', js, 'text/javascript');
    };
  }

  function round(s) { return { mean: Math.round(s.mean * 100) / 100, sd: Math.round(s.sd * 100) / 100 }; }

  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  document.getElementById('files').addEventListener('change', async e => {
    records = [];
    for (const file of e.target.files) {
      try { records.push(verify(JSON.parse(await file.text()), file.name)); }
      catch (err) { records.push({ file: file.name, ok: false, issues: ['nieprawidłowy plik JSON'] }); }
    }
    analyse();
  });

  if (IQ.NORMS.bankHash && IQ.NORMS.bankHash !== BANK.hash) {
    out.innerHTML = '<div class="notice">Uwaga: bieżące normy zostały wyliczone dla innej wersji zadań.</div>';
  }
})();

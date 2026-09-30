/* Interfejs testu. Stan zapisywany lokalnie (localStorage), aby odświeżenie strony nie
 * przerywało badania; zegar liczy czas bezwzględny, więc przerwa go nie zatrzymuje. */
(function () {
  'use strict';
  const IQ = window.IQ;
  const APP_VERSION = '1.0.0';
  const STORE_KEY = 'iqtest-pl-v1';
  const BANK = IQ.buildBank();
  const SECTIONS = {
    matrices: { name: 'Część 1: Matryce', items: BANK.matrices.items, practice: BANK.matrices.practice, limit: BANK.timeLimits.matrices },
    series: { name: 'Część 2: Ciągi liczbowe', items: BANK.series.items, practice: BANK.series.practice, limit: BANK.timeLimits.series },
  };
  const app = document.getElementById('app');
  let state = load() || freshState();
  let timerHandle = null;

  function freshState() { return { screen: 'welcome', bankHash: BANK.hash }; }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* tryb prywatny itp. */ } }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.bankHash === BANK.hash && s.screen) return s;
    } catch (e) { /* brak dostępu */ }
    return null;
  }
  function go(screen, patch) {
    Object.assign(state, patch || {}, { screen });
    save();
    render(true);
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtTime = sec => { sec = Math.max(0, sec); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); };
  const plural = (n, one, few, many) => {
    if (n === 1) return one;
    const d = n % 10, t = n % 100;
    return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
  };

  // ---------------- ekrany ----------------
  const SCREENS = {
    welcome() {
      return `
        <h1>Test rozumowania – iloraz inteligencji (IQ)</h1>
        <p>Test mierzy <strong>inteligencję płynną</strong> – zdolność dostrzegania reguł i wnioskowania w nowych sytuacjach.
        Jest to składnik inteligencji najsilniej związany z czynnikiem ogólnym <em>g</em>. Zadania są niewerbalne
        (figury i liczby), więc wynik nie zależy od zasobu słownictwa ani wiedzy szkolnej.</p>
        <div class="card">
          <h2 style="margin-top:0">Przebieg</h2>
          <ol>
            <li><strong>Matryce</strong> – ${SECTIONS.matrices.items.length} zadań, limit ${SECTIONS.matrices.limit / 60} minut.</li>
            <li><strong>Ciągi liczbowe</strong> – ${SECTIONS.series.items.length} zadań, limit ${SECTIONS.series.limit / 60} minut.</li>
          </ol>
          <p>Przed każdą częścią są zadania treningowe z objaśnieniem (nie wliczają się do wyniku).
          Łącznie ok. <strong>50 minut</strong>.</p>
          <h2>Warunki badania</h2>
          <ul>
            <li>Ciche miejsce, bez przerw – zegar biegnie także po zamknięciu strony.</li>
            <li>Rozwiązujesz samodzielnie. Wolno używać kartki i długopisu, <strong>nie wolno</strong> używać kalkulatora ani innych pomocy.</li>
            <li>Najlepiej na komputerze lub tablecie (na telefonie figury są mniejsze).</li>
            <li>Test przeznaczony dla osób w wieku 16 lat i starszych.</li>
          </ul>
        </div>
        <div class="notice">
          <strong>Ważne ograniczenie.</strong> ${IQ.NORMS.status === 'empirical' && (!IQ.NORMS.bankHash || IQ.NORMS.bankHash === BANK.hash)
            ? `Wynik przeliczany jest na podstawie norm: ${esc(IQ.NORMS.description)}`
            : `Test nie ma jeszcze polskich norm z badań na reprezentatywnej próbie. Wynik surowy jest dokładny i powtarzalny,
               ale przeliczenie na IQ jest <strong>orientacyjne</strong>. Wynik nie jest diagnozą psychologiczną i nie może zastąpić
               badania prowadzonego przez psychologa standaryzowanym testem.`}
        </div>
        <p class="small muted">Prywatność: nic nie jest wysyłane do internetu. Odpowiedzi są przechowywane wyłącznie w tej przeglądarce;
        możesz je samodzielnie pobrać jako plik po zakończeniu.</p>
        <div class="actions"><button class="btn primary" data-action="toParticipant">Rozpocznij</button></div>`;
    },

    participant() {
      return `
        <h1>Kilka informacji o Tobie</h1>
        <p>Wiek jest potrzebny do wyboru właściwej grupy normatywnej. Płeć i wykształcenie są opcjonalne –
        służą wyłącznie do ewentualnych badań normalizacyjnych i nie wpływają na wynik.</p>
        <form class="card" data-form="participant" novalidate>
          <div class="field">
            <label for="age">Wiek (w latach)</label>
            <input id="age" name="age" type="number" min="16" max="99" inputmode="numeric" required>
          </div>
          <div class="field">
            <label for="sex">Płeć (opcjonalnie)</label>
            <select id="sex" name="sex">
              <option value="">nie podaję</option><option value="K">kobieta</option><option value="M">mężczyzna</option>
            </select>
          </div>
          <div class="field">
            <label for="edu">Najwyższe ukończone wykształcenie (opcjonalnie)</label>
            <select id="edu" name="edu">
              <option value="">nie podaję</option>
              <option value="podstawowe">podstawowe / gimnazjalne lub niższe</option>
              <option value="zawodowe">zasadnicze zawodowe / branżowe</option>
              <option value="srednie">średnie (ogólnokształcące, technikum, policealne)</option>
              <option value="wyzsze">wyższe</option>
            </select>
          </div>
          <div class="field">
            <label class="inline"><input type="checkbox" name="agree" required>
              <span>Będę rozwiązywać test samodzielnie, bez kalkulatora i pomocy innych osób, w jednym podejściu.</span></label>
          </div>
          <p class="small" id="formError" style="color:var(--bad)" role="alert"></p>
          <div class="actions">
            <button type="button" class="btn" data-action="toWelcome">Wstecz</button>
            <button type="submit" class="btn primary">Dalej</button>
          </div>
        </form>`;
    },

    introMatrices() {
      return `
        <h1>${SECTIONS.matrices.name}</h1>
        <div class="card">
          <p>Zobaczysz kwadrat złożony z 9 pól ułożonych w 3 wiersze. W ostatnim polu (prawy dolny róg) brakuje figury.</p>
          <p>Figury w każdym <strong>wierszu</strong> zmieniają się według tych samych reguł – np. figura ma coraz więcej boków,
          robi się coraz większa, ciemniejsza albo w wierszu powtarzają się te same trzy warianty w różnej kolejności.
          Jednocześnie może działać kilka reguł.</p>
          <p>Twoje zadanie: wybierz spośród 8 odpowiedzi tę, która <strong>poprawnie uzupełnia</strong> ostatni wiersz.
          Zawsze dokładnie jedna odpowiedź jest poprawna.</p>
          <p>Zadania są coraz trudniejsze. Możesz wracać do wcześniejszych zadań i zmieniać odpowiedzi.
          Za błędną odpowiedź nie ma punktów ujemnych – warto zaznaczyć odpowiedź w każdym zadaniu.</p>
          <p class="small muted">Klawiatura: 1–8 wybór odpowiedzi, ← → poprzednie/następne zadanie.</p>
        </div>
        <div class="actions"><button class="btn primary" data-action="startPractice" data-section="matrices">Zadania treningowe</button></div>`;
    },

    introSeries() {
      return `
        <h1>${SECTIONS.series.name}</h1>
        <div class="card">
          <p>Zobaczysz ciąg liczb ułożonych według pewnej reguły. Wpisz liczbę, która powinna być <strong>następna</strong>.</p>
          <p>Reguły mogą dotyczyć dodawania, odejmowania, mnożenia, dzielenia, kolejnych kwadratów lub przeplatania się dwóch ciągów.
          Odpowiedzią zawsze jest liczba całkowita.</p>
          <p>Możesz liczyć na kartce. Nie używaj kalkulatora. Możesz wracać do wcześniejszych zadań.</p>
          <p class="small muted">Klawiatura: Enter – zapisz i przejdź dalej.</p>
        </div>
        <div class="actions"><button class="btn primary" data-action="startPractice" data-section="series">Zadania treningowe</button></div>`;
    },

    practice() {
      const pr = state.practice;
      const sec = SECTIONS[pr.section];
      const item = sec.practice[pr.idx];
      const last = pr.idx === sec.practice.length - 1;
      let body, feedback = '';
      if (pr.section === 'matrices') {
        body = matrixHtml(item, pr.answer, pr.checked);
        if (pr.checked) {
          const ok = pr.answer === item.correct;
          feedback = `<div class="feedback ${ok ? 'ok' : 'bad'}" role="status">
            <strong>${ok ? 'Dobrze!' : 'To nie ta odpowiedź. Poprawna jest nr ' + (item.correct + 1) + '.'}</strong>
            <p>Reguły w tym zadaniu:</p><ul>${IQ.explain(item).map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
        }
      } else {
        body = seriesHtml(item, pr.answer, pr.checked);
        if (pr.checked) {
          const ok = Number(pr.answer) === item.answer && pr.answer !== '';
          feedback = `<div class="feedback ${ok ? 'ok' : 'bad'}" role="status">
            <strong>${ok ? 'Dobrze!' : 'Poprawna odpowiedź to ' + item.answer + '.'}</strong> ${esc(item.rule)}</div>`;
        }
      }
      return `
        <div class="testbar"><span><strong>Zadanie treningowe ${pr.idx + 1} z ${sec.practice.length}</strong></span><span class="muted small">bez limitu czasu</span></div>
        ${body}${feedback}
        <div class="actions" style="justify-content:center">
          ${pr.checked
            ? (last ? `<button class="btn primary" data-action="toReady">Przejdź do części właściwej</button>`
                    : `<button class="btn primary" data-action="nextPractice">Następne zadanie treningowe</button>`)
            : `<button class="btn primary" data-action="checkPractice" ${pr.answer === null || pr.answer === '' ? 'disabled' : ''}>Sprawdź</button>`}
        </div>`;
    },

    ready() {
      const sec = SECTIONS[state.practice.section];
      return `
        <h1>${sec.name}</h1>
        <div class="card">
          <p><strong>${sec.items.length} ${plural(sec.items.length, 'zadanie', 'zadania', 'zadań')}, limit ${sec.limit / 60} minut.</strong></p>
          <p>Zegar ruszy po kliknięciu przycisku i nie zatrzyma się do końca tej części. Po upływie czasu część zakończy się automatycznie,
          a zadania bez odpowiedzi zostaną policzone jako błędne.</p>
          <p>Od tej chwili nie ma już informacji, czy odpowiedź jest poprawna.</p>
        </div>
        <div class="actions"><button class="btn primary" data-action="startSection" data-section="${state.practice.section}">Start – zaczynam</button></div>`;
    },

    test() {
      const key = state.current;
      const sec = SECTIONS[key];
      const st = state.sections[key];
      const item = sec.items[st.idx];
      const resp = st.responses[item.id];
      const answer = resp ? resp.answer : null;
      const body = key === 'matrices' ? matrixHtml(item, answer, false) : seriesHtml(item, answer, false);
      const answeredCount = sec.items.filter(it => { const r = st.responses[it.id]; return r && r.answer !== null && r.answer !== ''; }).length;
      return `
        <div class="testbar">
          <span><strong>${sec.name.split(':')[1].trim()}</strong> · zadanie ${st.idx + 1} / ${sec.items.length}</span>
          <span class="timer" id="timer" aria-label="pozostały czas">${fmtTime(remaining(key))}</span>
        </div>
        ${body}
        <div class="actions" style="justify-content:center">
          <button class="btn" data-action="prev" ${st.idx === 0 ? 'disabled' : ''}>← Poprzednie</button>
          ${st.idx < sec.items.length - 1
            ? `<button class="btn primary" data-action="next">Następne →</button>`
            : `<button class="btn primary" data-action="finishSection">Zakończ tę część</button>`}
        </div>
        <nav class="nav" aria-label="Lista zadań">
          ${sec.items.map((it, i) => {
            const r = st.responses[it.id];
            const done = r && r.answer !== null && r.answer !== '';
            return `<button data-action="goto" data-idx="${i}" class="${done ? 'done' : ''} ${i === st.idx ? 'current' : ''}"
              aria-label="Zadanie ${i + 1}${done ? ', udzielono odpowiedzi' : ''}">${i + 1}</button>`;
          }).join('')}
        </nav>
        <p class="small muted" style="text-align:center">Odpowiedzi: ${answeredCount} / ${sec.items.length}.
          <button class="btn small" style="padding:4px 10px;margin-left:8px" data-action="finishSection">Zakończ część wcześniej</button></p>`;
    },

    results() {
      const res = state.result;
      const s = res.score, it = res.interpretation;
      const provisional = it.normsStatus !== 'empirical';
      const iqLabel = it.clipped === 'below' ? '≤ ' + it.iq : it.clipped === 'above' ? '≥ ' + it.iq : String(it.iq);
      return `
        <h1>Wynik</h1>
        ${provisional ? `<div class="notice"><strong>Wynik orientacyjny.</strong> ${it.normsStatus === 'mismatch'
          ? 'Normy zostały wyliczone dla innej wersji zadań i nie pasują do tego testu.' : esc(IQ.NORMS.description)}
          Dokładne i powtarzalne są wyniki surowe (liczba poprawnych odpowiedzi) – na ich podstawie IQ można przeliczyć ponownie,
          gdy powstaną normy empiryczne.</div>` : ''}
        <div class="card">
          <div class="result-big">
            <div><div class="muted small">Iloraz inteligencji (skala M = 100, SD = 15)</div><div class="iq">${iqLabel}</div></div>
            <div>
              <div><strong>Przedział ufności 90%:</strong> ${it.ci90[0]}–${it.ci90[1]}</div>
              <div><strong>Centyl:</strong> ${it.percentile.toLocaleString('pl-PL')} (wynik wyższy niż u ok. ${Math.round(it.percentile)}% populacji)</div>
              <div><strong>Poziom:</strong> ${it.category}</div>
            </div>
          </div>
          ${bellSvg(it)}
          <table>
            <thead><tr><th>Część</th><th>Poprawne</th><th>Wynik w skali IQ</th></tr></thead>
            <tbody>
              <tr><td>Matryce</td><td>${s.matrices.raw} / ${s.matrices.max}</td><td>${it.sub.matrices}</td></tr>
              <tr><td>Ciągi liczbowe</td><td>${s.series.raw} / ${s.series.max}</td><td>${it.sub.series}</td></tr>
              <tr><th>Razem</th><th>${s.total.raw} / ${s.total.max}</th><th>${iqLabel}</th></tr>
            </tbody>
          </table>
          <p class="small muted">Grupa normatywna: ${esc(it.group)} · normy: ${esc(it.normsVersion)} · błąd standardowy pomiaru: ${it.sem} pkt IQ.
            Wyniki cząstkowe opierają się na mniejszej liczbie zadań i są mniej dokładne niż wynik łączny.</p>
          <p class="small">Kod kontrolny wyniku: <span class="code">${res.checksum}</span> · wersja zadań: <span class="code">${BANK.hash}</span></p>
        </div>
        <div class="card small">
          <h2 style="margin-top:0">Jak rozumieć wynik</h2>
          <ul>
            <li>Przedział ufności pokazuje, że żaden test nie mierzy bez błędu: przy ponownym badaniu wynik z dużym prawdopodobieństwem mieściłby się w tym zakresie.</li>
            <li>Test mierzy rozumowanie płynne. Nie obejmuje m.in. wiedzy, zdolności językowych, pamięci roboczej ani szybkości przetwarzania, które wchodzą w skład pełnych skal IQ (np. WAIS).</li>
            <li>Na wynik wpływają zmęczenie, stres, stan zdrowia, znajomość podobnych zadań oraz warunki badania.</li>
            <li>Formalnej diagnozy (np. do celów orzeczniczych, szkolnych, zawodowych) dokonuje wyłącznie psycholog, standaryzowanym testem z aktualnymi normami.</li>
          </ul>
        </div>
        <div class="actions">
          <button class="btn primary" data-action="download">Pobierz wynik (plik JSON)</button>
          <button class="btn" data-action="print">Drukuj / zapisz PDF</button>
          <button class="btn" data-action="restart">Nowy test</button>
        </div>
        <p class="small muted">Plik JSON zawiera wszystkie odpowiedzi. Można go zweryfikować (ponownie przeliczyć) na stronie
          <a href="normalizacja.html">Weryfikacja wyników i normalizacja</a>.</p>`;
    },
  };

  // ---------------- fragmenty widoku ----------------
  function matrixHtml(item, answer, reveal) {
    const cells = item.cells.map((p, i) => `<div class="cell">${IQ.panelSvg(p, item.config, 'pole ' + (i + 1))}</div>`).join('') +
      `<div class="cell missing">${IQ.panelSvg(null, item.config, 'brakujące pole')}</div>`;
    const opts = item.options.map((p, i) => {
      let cls = answer === i ? 'selected' : '';
      if (reveal) cls = i === item.correct ? 'correct' : (answer === i ? 'wrong' : '');
      return `<button class="opt ${cls}" data-action="choose" data-opt="${i}" aria-pressed="${answer === i}" aria-label="Odpowiedź ${i + 1}">
        <span class="num">${i + 1}</span>${IQ.panelSvg(p, item.config, 'odpowiedź ' + (i + 1))}</button>`;
    }).join('');
    return `<div class="matrix" role="group" aria-label="Matryca">${cells}</div><div class="options" role="group" aria-label="Odpowiedzi">${opts}</div>`;
  }

  function seriesHtml(item, answer, locked) {
    return `
      <div class="seq" aria-label="Ciąg liczb">${item.terms.map(t => `<span>${t}</span>`).join('')}<span class="q">?</span></div>
      <div class="answer-row">
        <label for="seriesAnswer" style="margin:0">Następna liczba:</label>
        <input id="seriesAnswer" type="text" inputmode="numeric" autocomplete="off" value="${answer === null || answer === undefined ? '' : esc(answer)}" ${locked ? 'disabled' : ''}>
      </div>`;
  }

  function bellSvg(it) {
    const W = 560, H = 150, x = v => ((v - 40) / 120) * W;
    const pdf = v => Math.exp(-0.5 * ((v - 100) / 15) ** 2);
    const y = v => H - 20 - pdf(v) * (H - 36);
    let d = `M ${x(40)} ${H - 20}`, fill = `M ${x(40)} ${H - 20}`;
    for (let v = 40; v <= 160; v += 1) { d += ` L ${x(v).toFixed(1)} ${y(v).toFixed(1)}`; if (v <= it.iq) fill += ` L ${x(v).toFixed(1)} ${y(v).toFixed(1)}`; }
    fill += ` L ${x(it.iq).toFixed(1)} ${H - 20} Z`;
    const ticks = [55, 70, 85, 100, 115, 130, 145].map(v =>
      `<line x1="${x(v)}" x2="${x(v)}" y1="${H - 20}" y2="${H - 15}" stroke="currentColor"/><text x="${x(v)}" y="${H - 3}" font-size="11" text-anchor="middle" fill="currentColor">${v}</text>`).join('');
    return `<svg class="bell" viewBox="0 0 ${W} ${H}" role="img" aria-label="Położenie wyniku na krzywej rozkładu normalnego">
      <rect x="${x(it.ci90[0])}" y="8" width="${x(it.ci90[1]) - x(it.ci90[0])}" height="${H - 28}" fill="var(--accent)" opacity="0.12"/>
      <path d="${fill}" fill="var(--accent)" opacity="0.35"/>
      <path d="${d}" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="${x(it.iq)}" x2="${x(it.iq)}" y1="8" y2="${H - 20}" stroke="var(--accent)" stroke-width="2.5"/>
      <line x1="0" x2="${W}" y1="${H - 20}" y2="${H - 20}" stroke="currentColor"/>${ticks}</svg>`;
  }

  // ---------------- logika sekcji ----------------
  function remaining(key) {
    const st = state.sections[key];
    return SECTIONS[key].limit - Math.floor((Date.now() - st.startedAt) / 1000);
  }

  function leaveItem() {
    const key = state.current;
    if (!key || !state.itemEnteredAt) return;
    const st = state.sections[key];
    const id = SECTIONS[key].items[st.idx].id;
    const r = st.responses[id] || (st.responses[id] = { answer: null, timeMs: 0 });
    r.timeMs += Math.max(0, Date.now() - state.itemEnteredAt);
    state.itemEnteredAt = Date.now();
  }

  function setIdx(idx) {
    leaveItem();
    const key = state.current;
    state.sections[key].idx = Math.max(0, Math.min(SECTIONS[key].items.length - 1, idx));
    state.itemEnteredAt = Date.now();
    save();
    render(false);
  }

  function readSeriesInput() {
    const el = document.getElementById('seriesAnswer');
    if (!el) return null;
    const v = el.value.replace(/\s/g, '').replace('−', '-');
    return v === '' ? '' : v;
  }

  function storeSeriesAnswer() {
    if (state.screen !== 'test' || state.current !== 'series') return;
    const v = readSeriesInput();
    if (v === null) return; // pole nie jest wyrenderowane – nie nadpisuj zapisanej odpowiedzi
    const st = state.sections.series;
    const id = SECTIONS.series.items[st.idx].id;
    const r = st.responses[id] || (st.responses[id] = { answer: null, timeMs: 0 });
    r.answer = v === '' ? null : v;
  }

  function finishSection(auto) {
    const key = state.current;
    if (!auto) {
      const st = state.sections[key];
      const missing = SECTIONS[key].items.filter(it => { const r = st.responses[it.id]; return !r || r.answer === null || r.answer === ''; }).length;
      const msg = missing
        ? `Bez odpowiedzi: ${missing} ${plural(missing, 'zadanie', 'zadania', 'zadań')}. Pozostały czas: ${fmtTime(remaining(key))}. Zakończyć tę część? Nie będzie można do niej wrócić.`
        : 'Zakończyć tę część? Nie będzie można do niej wrócić.';
      if (!window.confirm(msg)) return;
    }
    if (key === 'series') storeSeriesAnswer();
    leaveItem();
    state.sections[key].endedAt = Date.now();
    state.current = null;
    state.itemEnteredAt = null;
    if (key === 'matrices') go('introSeries');
    else finishTest();
  }

  function finishTest() {
    state.finishedAt = Date.now();
    const score = IQ.scoreSession(BANK, state);
    const interpretation = IQ.interpret(score, IQ.NORMS, state.participant.age, BANK.hash);
    state.result = { score, interpretation, checksum: IQ.sessionChecksum(state) };
    go('results');
  }

  function exportSession() {
    return {
      app: 'test-iq-pl', appVersion: APP_VERSION, formatVersion: 1,
      formId: BANK.formId, bankHash: BANK.hash,
      startedAt: new Date(state.startedAt).toISOString(), finishedAt: new Date(state.finishedAt).toISOString(),
      participant: state.participant,
      sections: {
        matrices: sectionExport('matrices'),
        series: sectionExport('series'),
      },
      score: state.result.score,
      interpretation: state.result.interpretation,
      checksum: state.result.checksum,
    };
  }
  function sectionExport(key) {
    const st = state.sections[key];
    return { startedAt: st.startedAt, endedAt: st.endedAt, timeLimitSec: SECTIONS[key].limit, responses: st.responses };
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------------- akcje ----------------
  const ACTIONS = {
    toParticipant: () => go('participant'),
    toWelcome: () => go('welcome'),
    startPractice: el => go('practice', { practice: { section: el.dataset.section, idx: 0, answer: null, checked: false } }),
    choose: el => {
      const i = Number(el.dataset.opt);
      if (state.screen === 'practice') {
        if (state.practice.checked) return;
        state.practice.answer = i;
      } else if (state.screen === 'test') {
        const st = state.sections.matrices;
        const id = SECTIONS.matrices.items[st.idx].id;
        const r = st.responses[id] || (st.responses[id] = { answer: null, timeMs: 0 });
        r.answer = i;
      }
      save();
      render(false);
    },
    checkPractice: () => {
      if (state.practice.section === 'series') state.practice.answer = readSeriesInput();
      if (state.practice.answer === null || state.practice.answer === '') return;
      state.practice.checked = true;
      save();
      render(false);
    },
    nextPractice: () => { state.practice = Object.assign(state.practice, { idx: state.practice.idx + 1, answer: null, checked: false }); save(); render(true); },
    toReady: () => go('ready'),
    startSection: el => {
      const key = el.dataset.section;
      state.sections = state.sections || {};
      state.sections[key] = { startedAt: Date.now(), endedAt: null, idx: 0, responses: {} };
      go('test', { current: key, itemEnteredAt: Date.now() });
    },
    prev: () => { storeSeriesAnswer(); setIdx(state.sections[state.current].idx - 1); },
    next: () => { storeSeriesAnswer(); setIdx(state.sections[state.current].idx + 1); },
    goto: el => { storeSeriesAnswer(); setIdx(Number(el.dataset.idx)); },
    finishSection: () => { storeSeriesAnswer(); save(); finishSection(false); },
    download: () => download(`wynik-iq-${new Date(state.finishedAt).toISOString().slice(0, 10)}-${state.result.checksum}.json`,
      JSON.stringify(exportSession(), null, 2), 'application/json'),
    print: () => window.print(),
    restart: () => {
      if (!window.confirm('Rozpocząć nowy test? Bieżący wynik zostanie usunięty z tej przeglądarki (pobierz go wcześniej, jeśli chcesz go zachować).')) return;
      state = freshState();
      save();
      render(true);
    },
  };

  app.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    e.preventDefault();
    ACTIONS[el.dataset.action](el);
  });

  app.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const age = Number(f.age.value);
    const err = document.getElementById('formError');
    if (!Number.isInteger(age) || age < 16 || age > 99) { err.textContent = 'Podaj wiek jako liczbę całkowitą od 16 do 99.'; f.age.focus(); return; }
    if (!f.agree.checked) { err.textContent = 'Potwierdź warunki rozwiązywania testu.'; return; }
    go('introMatrices', { participant: { age, sex: f.sex.value || null, edu: f.edu.value || null }, startedAt: Date.now(), sections: {} });
  });

  app.addEventListener('input', e => {
    if (e.target.id !== 'seriesAnswer') return;
    if (state.screen === 'practice') {
      state.practice.answer = readSeriesInput();
      const btn = app.querySelector('[data-action="checkPractice"]');
      if (btn) btn.disabled = state.practice.answer === '' || state.practice.answer === null;
    } else {
      storeSeriesAnswer();
    }
    save();
  });

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || (e.target.tagName === 'INPUT' && e.key !== 'Enter')) return;
    const scr = state.screen;
    if (scr === 'test' && state.current === 'matrices' && /^[1-8]$/.test(e.key)) {
      ACTIONS.choose({ dataset: { opt: String(Number(e.key) - 1) } });
    } else if (scr === 'practice' && state.practice.section === 'matrices' && /^[1-8]$/.test(e.key)) {
      ACTIONS.choose({ dataset: { opt: String(Number(e.key) - 1) } });
    } else if (scr === 'test' && e.key === 'ArrowRight' && e.target.tagName !== 'INPUT') {
      if (state.sections[state.current].idx < SECTIONS[state.current].items.length - 1) ACTIONS.next();
    } else if (scr === 'test' && e.key === 'ArrowLeft' && e.target.tagName !== 'INPUT') {
      ACTIONS.prev();
    } else if (e.key === 'Enter' && e.target.id === 'seriesAnswer') {
      e.preventDefault();
      if (scr === 'practice') { if (!state.practice.checked) ACTIONS.checkPractice(); }
      else if (scr === 'test') {
        const st = state.sections.series;
        if (st.idx < SECTIONS.series.items.length - 1) ACTIONS.next();
        else ACTIONS.finishSection();
      }
    }
  });

  // ---------------- render ----------------
  function render(newScreen) {
    clearInterval(timerHandle);
    if (state.screen === 'test' && remaining(state.current) <= 0) { finishSection(true); return; }
    app.innerHTML = SCREENS[state.screen]();
    if (newScreen) {
      window.scrollTo(0, 0);
      const h = app.querySelector('h1');
      if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }
    const input = document.getElementById('seriesAnswer');
    if (input && !input.disabled) input.focus({ preventScroll: true });
    if (state.screen === 'test') {
      timerHandle = setInterval(() => {
        const rem = remaining(state.current);
        const t = document.getElementById('timer');
        if (t) { t.textContent = fmtTime(rem); t.classList.toggle('low', rem <= 120); }
        if (rem <= 0) {
          clearInterval(timerHandle);
          window.alert('Czas na tę część minął. Zapisano udzielone odpowiedzi.');
          finishSection(true);
        }
      }, 1000);
    }
  }

  render(true);
})();

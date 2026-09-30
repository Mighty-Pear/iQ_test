# Metodologia testu

## 1. Co mierzy test

Test mierzy **inteligencję płynną (Gf)**, czyli zdolność wykrywania reguł i wnioskowania w nowych sytuacjach. W modelu Cattella–Horna–Carrolla (CHC) jest to czynnik najsilniej nasycony inteligencją ogólną *g*. Do pomiaru użyto dwóch klasycznych, niewerbalnych formatów:

| Część | Format | Zadania | Limit | Odpowiedź |
|---|---|---|---|---|
| 1. Matryce | matryce progresywne 3×3 (format Ravena) | 30 (+2 treningowe) | 30 min | wybór 1 z 8 |
| 2. Ciągi liczbowe | uzupełnianie ciągu (format ICAR Number Series) | 15 (+2 treningowe) | 15 min | wpisanie liczby |

**Dlaczego zadania niewerbalne?** Zadania słownikowe i wiedzowe wymagają pełnej adaptacji kulturowej i językowej, a ich tłumaczenie zmienia trudność. Figury i liczby są rozumiane jednakowo niezależnie od języka; po polsku są wyłącznie instrukcje, zadania treningowe z objaśnieniem i interpretacja wyniku. Jest to to samo podejście, na którym opiera się Test Matryc Ravena, od lat standaryzowany w Polsce (Jaworowska i Szustrowa, PTP).

## 2. Konstrukcja matryc

1. **Reguły** – według taksonomii Carpentera, Justa i Shella (1990) w formalizacji zbioru RAVEN (Zhang i in., 2019): w każdym wierszu atrybut figury (kształt, wielkość, odcień, liczba figur) podlega jednej regule:
   - *stała* (w całej matrycy lub w wierszu),
   - *progresja* (np. figura ma coraz więcej boków, jest coraz ciemniejsza),
   - *arytmetyka* (liczba figur w 3. polu = suma / różnica dwóch pierwszych),
   - *rozkład trzech wartości* (w każdym wierszu te same trzy warianty w innej kolejności).
2. **Układy**: jedna figura; figury w układzie 3×3 (jak oczka kostki); figura w figurze.
3. **Trudność** rośnie z liczbą i rodzajem reguł – zgodnie z wynikami Carpentera i in. (1990) oraz Matzen i in. (2010), gdzie poprawność spadała z ok. 87% (1 relacja) do ok. 55% (3 relacje). Kolejność zadań: od 1 do 4 jednoczesnych reguł. Waga złożoności każdego zadania jest zapisana w banku (`complexity`); test automatyczny sprawdza, że rośnie z numerem zadania (korelacja rang > 0,9).
4. **Jednoznaczność** – każde wygenerowane zadanie przechodzi walidację: dla każdego atrybutu sprawdzane są wszystkie hipotezy (stała, progresja, suma, różnica, rozkład trzech) w wierszach **i w kolumnach**. Zadanie jest odrzucane, jeśli jakakolwiek hipoteza zgodna z ośmioma polami przewiduje inną odpowiedź niż poprawna. Dodatkowo test automatyczny sprawdza, że żaden z 7 dystraktorów nie spełnia reguł.
5. **Dystraktory** – algorytm drzewa bisekcji atrybutów (Attribute Bisection Tree, I-RAVEN; Hu i in., 2021). Każda wartość każdego zmienianego atrybutu występuje w dokładnie połowie odpowiedzi, więc poprawnej odpowiedzi **nie da się wskazać bez analizy matrycy** (np. wybierając „najczęstsze cechy” wśród opcji – znana wada oryginalnego zbioru RAVEN).
6. **Dostępność** – odcienie wypełnień to skala szarości (różnice luminancji), więc zadania są rozwiązywalne przy zaburzeniach widzenia barw.

## 3. Ciągi liczbowe

Reguły: stała różnica, stały iloraz, rosnące przyrosty, kwadraty i sześciany, ciąg Fibonacciego, dwa przeplatające się ciągi, operacje złożone (×2+1, ×3−1). Odpowiedź jest wpisywana, więc prawdopodobieństwo zgadnięcia jest bliskie zeru (w matrycach wynosi 1/8). Każde zadanie jest zdefiniowane regułą w kodzie (`js/series.js`), a testy automatyczne sprawdzają zgodność wyrazów i odpowiedzi.

## 4. Powtarzalność i weryfikowalność

- **Te same zadania dla każdego.** Bank zadań jest generowany deterministycznie z ustalonego ziarna (PRNG mulberry32, wyłącznie arytmetyka całkowita 32-bit) – identycznie w każdej przeglądarce i systemie.
- **Wersja testu = skrót banku (`bankHash`).** Jakakolwiek zmiana zadań zmienia skrót; wyniki z różnych wersji nie są mieszane (narzędzie normalizacyjne je odrzuca, a normy są przypisane do wersji).
- **Standaryzacja**: jednakowe instrukcje, zadania treningowe z informacją zwrotną, sztywne limity czasu liczone od chwili startu (odświeżenie ani zamknięcie strony nie zatrzymuje zegara).
- **Wynik jest przeliczalny**: plik JSON zawiera wszystkie odpowiedzi i czasy. Strona `normalizacja.html` ponownie liczy punkty, sprawdza sumę kontrolną, limit czasu i duplikaty.
- **Ograniczenie**: test działa w przeglądarce badanego, więc suma kontrolna wykrywa przypadkowe zmiany i niekonsekwencje, ale nie zabezpiecza przed celowym fałszerstwem ani przed pomocą osób trzecich. Wyniki do badań normalizacyjnych należy zbierać w warunkach nadzorowanych.

## 5. Przeliczenie na IQ

- Wynik surowy = liczba poprawnych odpowiedzi (0–45).
- IQ = 100 + 15 · (wynik − średnia grupy wiekowej) / SD grupy wiekowej (skala dewiacyjna Wechslera).
- Przedział ufności 90% = IQ ± 1,645 · SEM, gdzie SEM = 15 · √(1 − rzetelność).
- Centyl z rozkładu normalnego. Zakres raportowany: 55–145 (poza nim normy ogólnopopulacyjne tego rozmiaru nie dają wiarygodnych wyników).
- Kategorie opisowe: ≥130 bardzo wysoki, 120–129 wysoki, 110–119 powyżej przeciętnej, 90–109 przeciętny, 80–89 poniżej przeciętnej, 70–79 niski, <70 bardzo niski.

### Stan norm – ważne

**Aktualnie aplikacja nie ma polskich norm empirycznych** (`js/norms.js`, status `provisional`). Parametry tymczasowe (średnia = 50% maksimum, SD = 18% maksimum, rzetelność 0,85) są założeniami, dlatego wynik IQ jest wyświetlany jako orientacyjny. Wynik surowy jest natomiast dokładny i powtarzalny, więc każdy zachowany plik JSON można przeliczyć ponownie, gdy normy powstaną.

## 6. Procedura normalizacji (aby test był miarodajny)

1. **Badanie pilotażowe** (N ≈ 100–200): analiza zadań w `normalizacja.html` – łatwość *p* (docelowo 0,10–0,95) i moc różnicująca *r_it* (docelowo ≥ 0,20). Zadania słabe należy wymienić (zmiana planu w `js/matrices.js` → nowa wersja banku).
2. **Badanie normalizacyjne**: N ≥ 500 (zalecane ≥ 1000), dobór warstwowy według danych GUS: wiek, płeć, wykształcenie, klasa miejscowości, województwo; co najmniej 100 osób w każdej grupie wiekowej (16–19, 20–29, …, 70+). Badanie w warunkach nadzorowanych.
3. **Rzetelność**: KR-20 (liczona automatycznie) – cel ≥ 0,85 dla wyniku łącznego; dodatkowo test–retest po 2–4 tygodniach na podpróbie.
4. **Trafność**: korelacja z uznanym testem (np. TMS-K Ravena, WAIS-R(PL)) na podpróbie N ≥ 100 – oczekiwane r ≥ 0,6. Sprawdzenie braku stronniczości zadań (DIF) względem płci.
5. **Wygenerowanie norm**: przycisk „Pobierz norms.js” → podmiana pliku `js/norms.js`. Normy są przypisane do `bankHash`.
6. **Aktualizacja**: ze względu na efekt Flynna normy należy odnawiać co ok. 10–15 lat.

## 7. Czego test nie mierzy

Pełne skale IQ (np. WAIS-IV) obejmują też rozumienie werbalne, pamięć roboczą i szybkość przetwarzania. Ten test mierzy jedną, choć centralną, zdolność. Nie jest narzędziem diagnostycznym: diagnozy (orzecznictwo, niepełnosprawność intelektualna, rekrutacja z konsekwencjami prawnymi) prowadzi psycholog, standaryzowanym testem z aktualnymi normami.

## Źródła

- Carpenter, P. A., Just, M. A., & Shell, P. (1990). What one intelligence test measures: A theoretical account of the processing in the Raven Progressive Matrices Test. *Psychological Review, 97*(3), 404–431.
- Matzen, L. E., Benz, Z. O., Dixon, K. R., Posey, J., Kroger, J. K., & Speed, A. E. (2010). Recreating Raven's: Software for systematically generating large numbers of Raven-like matrix problems with normed properties. *Behavior Research Methods, 42*(2), 525–541. https://link.springer.com/article/10.3758/BRM.42.2.525
- Zhang, C., Gao, F., Jia, B., Zhu, Y., & Zhu, S.-C. (2019). RAVEN: A Dataset for Relational and Analogical Visual rEasoNing. *CVPR 2019*.
- Hu, S., Ma, Y., Liu, X., Wei, Y., & Bai, S. (2021). Stratified Rule-Aware Network for Abstract Visual Reasoning. *AAAI, 35*(2), 1567–1574. https://ojs.aaai.org/index.php/AAAI/article/view/16248
- Condon, D. M., & Revelle, W. (2014). The International Cognitive Ability Resource: Development and initial validation of a public-domain measure. *Intelligence, 43*, 52–64.
- Kuder, G. F., & Richardson, M. W. (1937). The theory of the estimation of test reliability. *Psychometrika, 2*(3), 151–160.
- Raven, J. (2000). The Raven's Progressive Matrices: Change and stability over culture and time. *Cognitive Psychology, 41*(1), 1–48.
- Jaworowska, A., & Szustrowa, T. *Test Matryc Ravena w wersji Standard TMS. Formy: Klasyczna, Równoległa, Plus. Polskie standaryzacje.* Warszawa: Pracownia Testów Psychologicznych PTP.
- AERA, APA, NCME (2014). *Standards for Educational and Psychological Testing.*

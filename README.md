# Test rozumowania IQ (PL)

Niewerbalny test inteligencji płynnej działający w przeglądarce: **30 matryc** (format Ravena) + **15 ciągów liczbowych**, ok. 50 minut. Interfejs, instrukcje i interpretacja po polsku. Bez serwera, bez instalacji, bez wysyłania danych.

## Uruchomienie

- **Najprościej:** otwórz `index.html` w przeglądarce (Chrome, Edge, Firefox) – działa także z dysku.
- Lokalny serwer (opcjonalnie): `python -m http.server 8000` → http://localhost:8000
- Publikacja: dowolny hosting plików statycznych (np. GitHub Pages).

## Pliki

| Plik | Rola |
|---|---|
| `index.html`, `js/app.js` | test (ekrany, zegar, zapis postępu, wynik, eksport JSON) |
| `js/matrices.js` | generator i walidator matryc, rysowanie SVG |
| `js/series.js` | ciągi liczbowe (każdy z regułą w kodzie) |
| `js/bank.js` | budowa banku zadań formy A i jego skrót `bankHash` |
| `js/scoring.js` | punktacja, IQ, przedział ufności, KR-20, analiza zadań |
| `js/norms.js` | normy (obecnie **tymczasowe**) |
| `normalizacja.html` | weryfikacja plików wyników, statystyki, generowanie norm i CSV |
| `docs/METODOLOGIA.md` | metodologia, procedura normalizacji, źródła |

## Testy

```
npm test
```

Sprawdzają m.in.: deterministyczność banku, jednoznaczność każdej matrycy (hipotezy wierszowe i kolumnowe), to, że żaden dystraktor nie spełnia reguł, bezstronność zestawu odpowiedzi (drzewo bisekcji), wzrost złożoności zadań, poprawność ciągów, punktację i KR-20.

## Ograniczenie

Do czasu przeprowadzenia badania normalizacyjnego na reprezentatywnej polskiej próbie wynik IQ jest **orientacyjny** (wyniki surowe są dokładne). Procedura – w `docs/METODOLOGIA.md`, sekcja 6.

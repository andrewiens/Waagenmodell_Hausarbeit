# Testprotokoll

## Prüfstand

| Merkmal | Stand |
| --- | --- |
| Anwendung | Gleichungen im Gleichgewicht |
| Datum | 18. August 2026 |
| Automatischer Testlauf | `npm test` |
| Testwerkzeug | integrierter Node.js-Test-Runner (`node:test`) |
| Ausführungsumgebung | Node.js v25.6.1 |
| Ergebnis | **33/33 Tests erfolgreich** |
| Fehlgeschlagen / übersprungen | 0 / 0 |
| Manuelle Browserprüfung | **Bestanden im Codex In-App Browser** |
| Geprüfte Ansichten | Standardansicht (ca. 1264 × 711), 360 × 800, 320 × 740 |

Dieses Protokoll trennt automatisierte Prüfungen der Mathematik und Eingabeverarbeitung von der interaktiven und visuellen Prüfung im Codex In-App Browser. Es wird ausdrücklich nicht behauptet, dass Firefox, Safari, eine bestimmte externe Chrome-Version oder eine assistive Technik getestet wurde.

## Automatisierter Testumfang

Ausgeführt wurden:

- `tests/math.test.mjs`: 19 Tests zu Bruchrechnung, Lösungsfällen, Operationen, Verlauf und Formatierung
- `tests/parser.test.mjs`: 14 Tests zu gültigen Eingaben, Normalisierung und konkreten Fehlerfällen

Der vollständige Lauf endete mit:

```text
tests 33
pass 33
fail 0
cancelled 0
skipped 0
todo 0
```

## Pflichtfälle

| Nr. | Fall | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status |
| ---: | --- | --- | --- | :---: |
| 1 | `3x + 2 = 11` | genau eine Lösung, `x = 3` | `unique`, exakter Wert `3` | ✓ |
| 2 | `5x + 4 = 2x + 13` | genau eine Lösung, `x = 3` | `unique`, exakter Wert `3` | ✓ |
| 3 | `2x = 3` | genau eine Lösung, `x = 3/2` | `unique`, gekürzter Bruch `3/2` | ✓ |
| 4 | `-x + 5 = 2` | genau eine Lösung, `x = 3` | `unique`, exakter Wert `3` | ✓ |
| 5 | `2x + 1 = 2x + 1` | unendlich viele Lösungen | Typ `infinite` | ✓ |
| 6 | `2x + 1 = 2x + 3` | keine Lösung | Typ `none` | ✓ |
| 7 | beidseitig `+4` bei `3x + 2 = 11` | `3x + 6 = 15`, Lösungsmenge bleibt erhalten | Ergebnis wie erwartet; als äquivalent erkannt | ✓ |
| 8 | beidseitig `-2` bei `3x + 2 = 11` | `3x = 9`, Lösungsmenge bleibt erhalten | Ergebnis wie erwartet; als äquivalent erkannt | ✓ |
| 9 | beidseitig `·(-3/2)` bei `2x - 1 = 4` | `-3x + 3/2 = -6`, Lösungsmenge bleibt erhalten | exaktes Ergebnis; als äquivalent erkannt | ✓ |
| 10 | beidseitig `:2` bei `2x + 1 = 3` | `x + 1/2 = 3/2`, Lösungsmenge bleibt erhalten | exakte Brüche; als äquivalent erkannt | ✓ |
| 11 | Division durch `0` | Operation wird mit verständlichem Fehler verhindert | Fehlercode `DIVISION_BY_ZERO`; Meldung nennt Division durch null | ✓ |
| 12 | nur links `+1` bei `3x + 2 = 11` | nicht äquivalent; am ursprünglichen `x = 3` links `12`, rechts `11` | als nicht äquivalent erkannt; Werte `12` und `11` | ✓ |
| 13 | zwei Schritte, danach Rückgängig und Zurücksetzen | Rückgängig liefert `3x = 9`; Zurücksetzen liefert `3x + 2 = 11` | Verlauf und Ausgangsobjekt bleiben unverändert; Ergebnisse wie erwartet | ✓ |
| 14 | ungültige Eingaben | kein Absturz; konkrete deutsche Fehlermeldungen | leere Eingabe, fehlendes/mehrfaches `=`, leere Seite, Nullnenner, nichtlinearer Term und ungültige Zeichen abgefangen | ✓ |
| 15 | Bruchverarbeitung und -darstellung | exakt, vollständig gekürzt, keine Dezimalrundung | u. a. `0.1 + 0.2 = 3/10`, `1,25 = 5/4`, `6/4 → 3/2` | ✓ |

Zusätzlich ist die Multiplikation beider Seiten mit null gesperrt, weil sie die Information über die ursprüngliche Lösungsmenge löschen würde. Addition und Subtraktion von x-Termen auf beiden Seiten wurden ebenfalls als lösungsmengenerhaltend geprüft.

## Verwendete Testgleichungen

| Eingabe | Erwartung | Tatsächliches Ergebnis | Status |
| --- | --- | --- | :---: |
| `3x + 2 = 11` | `x = 3` | `x = 3` | ✓ |
| `5x + 4 = 2x + 13` | `x = 3` | `x = 3` | ✓ |
| `x + 5 = 9` | `x = 4` | `x = 4` | ✓ |
| `2x = 8` | `x = 4` | `x = 4` | ✓ |
| `-x + 5 = 2` | `x = 3` | `x = 3` | ✓ |
| `2x - 4 = x + 5` | `x = 9` | `x = 9` | ✓ |
| `2x = 3` | `x = 3/2` | `x = 3/2` | ✓ |
| `2x + 1 = 2x + 1` | alle Zahlen | `infinite` | ✓ |
| `2x + 1 = 2x + 3` | keine Zahl | `none` | ✓ |
| `1/2x + 1,5 = 2·x - 3/4` | `x = 3/2` | `x = 3/2` | ✓ |

Weitere Parserprüfungen bestätigen, dass Leerzeichen, `X` statt `x`, Dezimalkomma, ein optionales Malzeichen zwischen Zahl und `x` sowie bereits auf einer Seite vorhandene gleichartige Terme korrekt verarbeitet werden.

## Sonderfall: einseitige Fixpunktoperation

Der Testfall beginnt mit `x = 0` und multipliziert **nur die linke Seite** mit `2`. Daraus wird `2x = 0`.

- Erwartung an die Lernregel: Der Handlungsschritt wird nicht als reguläre Äquivalenzumformung akzeptiert, weil nicht auf beiden Seiten dieselbe Operation ausgeführt wurde.
- Erwartung an das sichtbare Gleichgewicht: Beim ursprünglichen Lösungswert `x = 0` haben beide Seiten weiterhin den Wert `0`. Die Anwendung darf deshalb keine mathematisch falsche Kippung erzwingen.
- Tatsächliches Ergebnis der Kernlogik: Der Schritt ist als `equivalent: false` markiert; die exakte Auswertung am ursprünglichen Lösungswert meldet zugleich `balanced: true`.
- Tatsächliche Browserdarstellung: Warnstatus **„zufällig ausgeglichen“**, waagerechter Balken und Erklärung, dass der einseitige Schritt trotzdem keine allgemein erlaubte Umformungsregel ist. Im Browser wie erwartet geprüft.

Die Ausgangs- und Ergebnisgleichung besitzen in diesem besonderen Beispiel zufällig dieselbe Lösungsmenge. Getestet wird daher bewusst sowohl die **Regel des Modellhandelns** als auch der **tatsächliche Wertvergleich**; ein Warnhinweis ersetzt eine künstliche Kippanimation.

## Weitere geprüfte Funktionen

- vollständig gekürzte Brüche mit positivem Nenner
- exakte Verarbeitung von endlichen Dezimalzahlen und wissenschaftlicher Schreibweise in der Kernlogik
- Ablehnung von Nullnennern
- exakte Auswertung eines Terms `ax + b`
- Unveränderlichkeit der übergebenen Gleichungs- und Verlaufsobjekte
- Formatierung von `x`, `-x`, `0`, Brüchen und Operationszeilen wie `| -2`, `| +3x` und `| :3`
- Parserfehler für Klammern, nichtlineare Terme, andere Variablen, fehlende Operatoren und fehlende Terme
- Ablehnung HTML-ähnlicher Eingabe als ungültiger Text
- UI-freundliches Parser-Ergebnisobjekt ohne ungefangenen Parserfehler

## Gefundene Fehler und vorgenommene Korrekturen

Im dokumentierten automatisierten Abschlusslauf trat kein Testfehler auf; alle 33 Tests bestanden. Bei der statischen und manuellen Oberflächenprüfung wurden dagegen konkrete Punkte gefunden und korrigiert:

| Fehlerquelle | Umsetzung im aktuellen Stand | Prüfung |
| --- | --- | --- |
| Rundungsfehler durch binäre Gleitkommazahlen | Brüche werden mit ganzzahligen Zählern und Nennern exakt gerechnet und gekürzt | automatisch bestanden |
| Division oder Bruch mit Nenner null | wird mit eigenem Fehlercode und verständlicher Meldung abgewiesen | automatisch bestanden |
| Informationsverlust durch beidseitiges Multiplizieren mit null | Operation wird nicht als Äquivalenzumformung zugelassen | automatisch bestanden |
| einseitiger Schritt wird unbemerkt als korrekt übernommen | Ergebnis trägt ausdrücklich die Kennzeichnung `equivalent: false` | automatisch bestanden |
| Waage kippt im Fixpunktfall künstlich | beide Seiten werden am ursprünglichen Lösungswert exakt ausgewertet | automatisch auf Logikebene bestanden |
| Rückgängig verändert ältere Zustände | Gleichungen und Verlaufsschritte sind unveränderlich; vorheriger Zustand wird wiederhergestellt | automatisch bestanden |
| HTML-ähnliche Texte gelangen als Markup in die Verarbeitung | Parser weist entsprechende Zeichen ab; die Oberfläche setzt dynamische Inhalte ausschließlich als Text | Parser automatisch bestanden; DOM-Nutzung zusätzlich statisch geprüft |

Weitere tatsächlich vorgenommene Oberflächenkorrekturen:

| Gefundener Punkt | Korrektur | Nachprüfung |
| --- | --- | --- |
| Bei Gleichungen ohne einzelne Ausgangslösung hätte eine einseitige x-Operation eine unbegründete schwere Seite behaupten können | eigener richtungsneutraler Zustand „Einseitig verändert“ mit gestrichelter Warnmarkierung; keine erfundene Kipp-Richtung | `2x + 1 = 2x + 1`, nur links `+x`: Browser zeigt `symbolic-invalid` und erklärt die Modellgrenze |
| „Ausgangsgleichung wiederherstellen“ war zunächst wie eine äquivalente Umformung gekennzeichnet | Wiederherstellung ist nun ausdrücklich eine Steueraktion, nicht „gültige Umformung“ | Verlauf zeigt `↺ Steueraktion` und `↺ zurück`; Undo stellt den Experimentzustand wieder her |
| Sonderfall-Schaltflächen verrieten die Lösungskategorie bereits vorab | neutrale Beschriftung „Sonderfall A/B“ | Lösung bleibt bis „Lösung anzeigen“ verborgen |
| Zu viele dynamische Bereiche hätten gleichzeitig vorgelesen werden können | eine kompakte Feedback-Live-Region; Gleichung, Waage und Verlauf bleiben normal zugänglich | Barrierebaum im Browser geprüft; nur Feedback besitzt den Live-Status |
| Operandenfehler blieb beim Laden einer neuen Gleichung sichtbar | Feldfehler und `aria-invalid` werden beim Aufgabenwechsel und Reset gelöscht | nach gesperrter Division durch null neues Beispiel geladen: Fehler nicht mehr sichtbar |
| Ein bereits geöffneter Hinweis konnte nach einer Umformung veraltet sein | Hinweisfeld wird bei Operation, Undo, Moduswechsel, Reset und Wiederherstellung geschlossen und auf Stufe 1 zurückgesetzt | statische Zustandsprüfung und finaler Browser-Smoke-Test |
| Hilfetext behauptete zunächst pauschal, jede einseitige Handlung kippe die Waage | Text nennt nun den Fixpunkt-Sonderfall und den Warnstatus ohne künstliche Kippung | mit Fixpunkt-Test und Dokumentation abgeglichen |
| Reset-Dialog war noch nicht vollständig verdrahtet | Abbrechen und Bestätigen funktionieren; Fokusziel bleibt eindeutig | beide Wege im Browser geprüft |
| Escape schloss den Hilfedialog in der ersten Browserprüfung nicht zuverlässig | explizite Escape-Behandlung mit Fokus-Rückgabe zur Hilfe-Schaltfläche | erneut geprüft: Dialog geschlossen, Fokus auf `open-help` |

## Manuelle Browserprüfung

Die Anwendung wurde am 18. August 2026 über `python3 -m http.server 8000` im Codex In-App Browser geöffnet. HTML, CSS und alle drei JavaScript-Module wurden erfolgreich geladen; nach dem Abschlusslauf enthielt das Browserprotokoll keine Warnungen oder JavaScript-Fehler.

| Manuelle Prüfung | Tatsächliches Ergebnis | Status |
| --- | --- | :---: |
| `3x + 2 = 11`, `| -2`, `| :3` | `3x = 9`, danach `x = 3`; Gleichgewicht und passende Erfolgsrückmeldung bleiben erhalten | ✓ |
| Rückgängig nach zwei Schritten | zuerst `3x = 9`, danach Ausgang `3x + 2 = 11`; Zähler wieder 0 und Undo deaktiviert | ✓ |
| Bruchfall `2x = 3`, `| :2` | sichtbares exaktes `x = 3⁄2`, keine Dezimalrundung | ✓ |
| ungültig `x^2 = 4` | konkrete Meldung zu nichtlinearen Termen; bisherige gültige Gleichung bleibt unverändert | ✓ |
| Division durch null | Feldbezogene Meldung sichtbar, Gleichung und Schrittzahl unverändert; Fehler wird bei neuer Aufgabe gelöscht | ✓ |
| negativer Term `-x + 5 = 2` | symbolische Karte und Modellgrenzenhinweis statt negativer realer Masse | ✓ |
| negative Lösung `x + 5 = 2` | `data-visual-mode="symbolic"`; Hinweis erklärt `x = -3` als Modellgrenze | ✓ |
| Experiment: `3x + 2 = 11`, nur links `+1` | `3x + 3 = 11`; linke Schale sichtbar tiefer, Warnstatus „Links ist tiefer“, Verlauf „Versuch“ | ✓ |
| danach beidseitig `+2` und Wechsel in Lernmodus | `3x + 5 = 13`; früherer Fehlversuch bleibt sichtbar und wird nicht legitimiert | ✓ |
| Lösung im Experiment | zeigt ausdrücklich `x = 3` der Ausgangsgleichung und warnt vor dem aktuellen Experimentzustand | ✓ |
| Experiment zweimal rückgängig | erst einseitiger Zustand, dann vollständig ausgeglichene Ausgangsgleichung | ✓ |
| Ausgang wiederherstellen und erneut Undo | Wiederherstellung als Steueraktion; Undo bringt den einseitigen Versuch samt Kippung zurück | ✓ |
| allgemeingültiger Sonderfall | zunächst keine Lösungsangabe; symbolische, ausgeglichene Darstellung; nach Klick „Alle Zahlen sind Lösungen“ | ✓ |
| Widerspruch `2x + 1 = 2x + 3` | zunächst symbolische rechte Absenkung ohne erfundene x-Masse; nach Klick „Keine Zahl ist eine Lösung“ | ✓ |
| allgemeingültiger Ausgang, nur links `+x` | richtungsneutrale Warnmarkierung, keine unbegründete Behauptung einer schweren Seite | ✓ |
| Fixpunkt `x = 0`, nur links `·2` | `2x = 0`, Status „Zufällig ausgeglichen“ und korrekte Warnbegründung | ✓ |
| dreistufige Hilfe | Strategie → x-Term-Hinweis → konkreter Vorschlag `| -2x` | ✓ |
| Hilfe- und Reset-Dialoge | Öffnen/Schließen, Escape beim Hilfedialog, Fokus-Rückgabe, Abbrechen und Bestätigen geprüft | ✓ |
| 360 × 800 und 320 × 740 | kein horizontaler Überlauf; Eingaben, Beispielschaltflächen, Waage und gruppierte Terme bleiben lesbar | ✓ |
| Konsolenprüfung | keine Browser-Warnung und kein JavaScript-Fehler nach dem finalen Smoke-Test | ✓ |

Nicht als manuell geprüft gelten eine vollständige Tab-Reihenfolge, ein echter Screenreader-Lauf, 200-%-Zoom, die aktive Betriebssystemeinstellung `prefers-reduced-motion` sowie Firefox, Safari oder eine konkrete externe Chrome-Version. Die Anwendung verwendet native Formularelemente, sichtbare `:focus-visible`-Markierungen und eine CSS-Regel für reduzierte Bewegung; diese Punkte wurden statisch geprüft, aber nicht als vollständiger assistiver Techniktest ausgegeben.

## Verbleibende Einschränkungen

- Die automatisierten Tests decken Kernlogik und Parser ab; DOM-Ereignisse, CSS-Darstellung und Animationen wurden nur manuell im In-App Browser geprüft.
- Es gibt noch keinen automatisierten End-to-End- oder visuellen Regressionstest.
- Unterstützt wird nur `ax + b = cx + d` mit der Variablen `x`; Klammern, Potenzen, Produkte mit Variablen, Ungleichungen und Gleichungssysteme liegen außerhalb des Modells.
- Negative Terme, negative Lösungen sowie Gleichungen ohne einzelne Lösung können nicht als reale Gewichte interpretiert werden und werden deshalb symbolisch dargestellt.
- Die Waagenneigung ist ein didaktischer Zustandsindikator und keine physikalische Simulation.
- Gleichartige Terme werden intern sofort normalisiert; „Terme zusammenfassen“ kann daher ohne sichtbare Änderung der Gleichungszeile bleiben.
- Eine formale Prüfung nach einem Barrierefreiheitsstandard, ein Screenreader-Test und Tests in weiteren Browserfamilien wurden nicht durchgeführt.

## Test erneut ausführen

Im Projektordner:

```bash
npm test
```

Ein erfolgreicher Lauf muss mit `pass 33` und `fail 0` enden. Ändert sich die Zahl der Tests, ist dieses Protokoll zusammen mit den neuen Ergebnissen zu aktualisieren.

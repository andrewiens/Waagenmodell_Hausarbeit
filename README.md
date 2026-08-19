# Gleichungen im Gleichgewicht

„Gleichungen im Gleichgewicht“ ist eine statische, browserbasierte Lernanwendung zum Verstehen und Lösen linearer Gleichungen mit einer Unbekannten. Eine Gleichung wird gleichzeitig symbolisch und als Balkenwaage dargestellt. So wird sichtbar, warum dieselbe zulässige Operation auf beiden Seiten die Lösungsmenge erhält.

## Ziel und Zielgruppe

Die Anwendung richtet sich vor allem an Schülerinnen und Schüler der 8. Jahrgangsstufe sowie an Lehrkräfte, die das Waagenmodell im Unterricht, in Übungsphasen oder zur individuellen Förderung einsetzen möchten. Sie unterstützt insbesondere:

- die relationale Bedeutung des Gleichheitszeichens,
- die Gleichberechtigung der beiden Gleichungsseiten,
- das Prinzip der Äquivalenzumformung,
- die Verbindung zwischen Modellhandlung und symbolischer Rechnung,
- die Unterscheidung zwischen genau einer, keiner und unendlich vielen Lösungen.

## Funktionsumfang

- Eingabe linearer Gleichungen der Form `ax + b = cx + d`
- Beispielgleichungen in mehreren Schwierigkeitsstufen
- ganze Zahlen, gekürzte Brüche und endliche Dezimalzahlen mit Punkt oder Komma
- fehlende Koeffizienten (`x`, `-x`), negative Terme und Leerzeichen
- exakte Bruchrechnung ohne typische Gleitkomma-Rundungsfehler
- gleichzeitige Anzeige von Waagenmodell und symbolischer Gleichung
- gruppierte Modellteile bei größeren Koeffizienten und Konstanten
- Lernmodus mit automatisch beidseitigen Operationen
- Experimentiermodus für bewusst einseitige Veränderungen
- gruppiertes Operationsfeld mit sechs großen Buttons für `+ Zahl`, `− Zahl`, `· Zahl`, `: Zahl`, `+x` und `−x`
- live aktualisierte Operationsvorschau für ganze Zahlen, Dezimalzahlen und Brüche
- direkt auswählbare positive Einheitsgewichte und x-Boxen auf beiden Waagschalen
- eigene Schalenbuttons für `+1`, `−1`, `+x` und `−x`
- Gegenstückprüfung und Bestätigungsdialog für direkte Handlungen im Lernmodus
- sichtbares Zusammenfassen gleichartiger Terme
- verständliche Rückmeldungen, Operationsvorschau und dreistufige Hinweise
- Umformungsverlauf mit Ausgangsgleichung, Operation, Ergebnis und Gültigkeitskennzeichnung
- Rückgängig, Verlauf zurücksetzen und Ausgangsgleichung wiederherstellen
- vollständig lokaler A4-PDF-Export des Lösungswegs nach dem ersten gültigen Schritt
- Lösung erst nach ausdrücklicher Anforderung
- symbolische Kennzeichnung negativer Terme und weiterer Modellgrenzen
- Tastatur-freundliche Bedienelemente, sichtbare Statusmeldungen und ARIA-Beschriftungen
- reduzierte Animationen bei aktivierter Systemeinstellung `prefers-reduced-motion`

## Bedienung

1. Wähle den **Lernmodus** oder den **Experimentiermodus**.
2. Gib eine Gleichung ein oder wähle ein Beispiel aus.
3. Vergleiche die symbolische Gleichung mit den beiden Waagschalen.
4. Gib für eine Zahlenoperation den gewünschten Wert ein. Die vier Vorschauen zeigen vorab, welcher Rechenschritt durch jeden Button entsteht. Klicke anschließend auf den passenden Operationsbutton. `+x` und `−x` arbeiten mit genau einer x-Box.
5. Alternativ kannst du eine positive x-Box oder ein Einheitsgewicht direkt auf einer Schale auswählen und entfernen. Die Schalenbuttons fügen oder entfernen `1` beziehungsweise `x`.
6. Bestätige im Lernmodus die markierte Änderung auf beiden Seiten. Im Experimentiermodus wird die direkt gewählte Seite sofort einzeln verändert.
7. Verfolge den Rechenschritt und seine Begründung im Umformungsverlauf.
8. Nach dem ersten gültigen Äquivalenzschritt kannst du den aktuellen Lösungsweg als PDF herunterladen.
9. Arbeite weiter, bis `x` isoliert ist, oder untersuche einen der beiden Sonderfälle.

Die Schaltfläche **Hinweis erhalten** gibt zunächst eine Strategie, danach einen konkreteren Hinweis und erst in der dritten Stufe einen möglichen nächsten Rechenschritt. **Lösung anzeigen** nennt die Lösung der Ausgangsgleichung, ohne sie vorher ungefragt einzublenden.

### Lern- und Experimentiermodus

Im Lernmodus sind nur beidseitige Operationen möglich. Zulässige Addition, Subtraktion, Multiplikation und Division erhalten dadurch die Lösungsmenge. Division durch null und Multiplikation mit null werden verhindert; eine Multiplikation beider Seiten mit null würde die Information der Ausgangsgleichung verlieren.

Im Experimentiermodus kann eine Operation nur links oder nur rechts ausgeführt werden. Der Schritt wird als Versuch und nicht als gültige Äquivalenzumformung gekennzeichnet. Bei einer eindeutig lösbaren Ausgangsgleichung vergleicht die Anwendung beide veränderten Seiten weiterhin am **Lösungswert der Ausgangsgleichung**. Sie berechnet also nicht heimlich eine neue Lösung, um die Waage wieder auszugleichen. Ein solcher Versuch kann rückgängig gemacht oder durch **Ausgangsgleichung** verworfen werden. Spätere beidseitige Schritte machen einen vorherigen einseitigen Schritt nicht nachträglich gültig.

Bei einer direkten Entfernung prüft der Lernmodus zuerst, ob auf beiden Seiten ein positives Einheitsgewicht beziehungsweise eine positive x-Box vorhanden ist. Auswahl und Gegenstück werden sichtbar markiert; erst der Bestätigungsbutton führt die beidseitige Operation aus. Fehlt das Gegenstück, bleiben Gleichung und Verlauf unverändert und die Anwendung erklärt konkret, welche Schale das Modell verhindert. Negative Terme bleiben symbolisch und sind nicht als reale negative Gewichte anklickbar.

### PDF-Export

**Lösungsweg als PDF herunterladen** wird freigeschaltet, sobald der aktuelle Verlauf mindestens einen gültigen Äquivalenzschritt enthält. Die erzeugte A4-Datei enthält Anwendungstitel, Datum und Uhrzeit, Ausgangs- und aktuelle Gleichung, alle noch im Verlauf enthaltenen Schritte, Operationen und Gültigkeitskennzeichnungen, die Lösung beziehungsweise Lösungsmenge sowie die Erklärung des Äquivalenzprinzips. Einseitige Versuche und Wiederherstellungsaktionen werden deutlich benannt. Zuvor angezeigte Fehlerhinweise werden aufgenommen; ein mit **Rückgängig** vollständig aus dem Verlauf entfernter Schritt wird bewusst nicht als ausgeführter Schritt exportiert.

Der Export wird durch das lokale Modul `js/pdf.js` erzeugt. Es gibt **keine externe PDF-Bibliothek**, keinen Upload und keinen Serveraufruf. Deutsche Sonderzeichen werden über WinAnsi-Schriftkodierung ausgegeben, Brüche bleiben als gut lesbare Schrägstrichschreibweise erhalten, und lange Wege werden automatisch auf mehrere A4-Seiten verteilt. Zusätzlich enthält das Stylesheet bereits eine druckfreundliche Ansicht der Webseite.

### Sonderfall: einseitige Fixpunktoperation

Nicht jede einseitige Veränderung erzeugt bei der ursprünglichen Lösung einen unterschiedlichen Zahlenwert. Beispiel: Aus `x = 0` wird durch einseitiges Multiplizieren der linken Seite mit `2` die Gleichung `2x = 0`. Bei `x = 0` bleiben beide sichtbaren Werte zufällig `0`; die Waage darf deshalb nicht künstlich kippen. Die Anwendung zeigt in diesem Fall **„zufällig ausgeglichen“**, kennzeichnet den Handlungsschritt aber weiterhin als einseitigen, nicht regelgerechten Versuch. Die konkrete Ergebnisgleichung hat hier zufällig dieselbe Lösungsmenge – daraus folgt jedoch keine allgemeine Erlaubnis, nur eine Seite zu verändern.

## Lokal starten

Die Anwendung benötigt keinen Build-Schritt und keine Projektinstallation. Da sie JavaScript-Module verwendet, sollte sie über einen kleinen lokalen Webserver statt per Doppelklick auf `index.html` geöffnet werden.

Mit Python:

```bash
cd <projektordner>
python3 -m http.server 8000
```

Danach [http://localhost:8000](http://localhost:8000) öffnen. Beenden mit `Strg+C`.

Alternativ mit Node.js, ohne `serve` dauerhaft in das Projekt zu installieren:

```bash
cd <projektordner>
npx serve .
```

Anschließend die von `npx` ausgegebene lokale Adresse öffnen. Falls `serve` noch nicht im lokalen npx-Cache liegt, kann npx den einmaligen Download des Werkzeugs bestätigen lassen; die Lernanwendung selbst lädt keine externen Abhängigkeiten.

## Tests

Voraussetzung ist eine aktuelle Node.js-Version. Es müssen keine npm-Pakete installiert werden.

```bash
npm test
```

Stand 19. August 2026: **49 von 49 automatisierten Node-Tests erfolgreich**, 0 fehlgeschlagen. Neben mathematischer Kernlogik und Parser prüfen 16 neue Abnahmefälle die Operationsbuttons, frei wählbare Zahlen, direkte `1`-/`x`-Handlungen, Lern- und Experimentiermodus, Synchronität, Rückgängig sowie ein- und mehrseitige PDF-Dateien.

Zusätzlich wurde die überarbeitete Oberfläche über einen lokalen Webserver im Codex In-App Browser geprüft. Getestet wurden unter anderem Wertvorschau und Buttons, Division durch null, Elementauswahl, Gegenstückmarkierung und Bestätigung, fehlendes Gegenstück, direkter Experimentierschritt mit korrekter Kippung, Rückgängig, PDF-Freischaltung und -Erzeugung sowie die 360 × 800-Pixel-Ansicht ohne horizontalen Überlauf. Dabei traten nach der letzten Korrektur keine Browser-Konsolenfehler auf. Andere Browserfamilien, Screenreader und eine formale Barrierefreiheitsprüfung wurden nicht behauptet. Details stehen im [Testprotokoll](docs/testprotokoll.md).

## Projektstruktur

```text
.
├── index.html              # semantische Oberfläche der Lernanwendung
├── css/
│   └── styles.css          # Gestaltung, Waage, responsive Regeln, reduzierte Bewegung
├── js/
│   ├── app.js              # Zustand, DOM-Darstellung und Interaktionen
│   ├── math.js             # exakte Bruchrechnung und Gleichungsoperationen
│   ├── parser.js           # sichere Eingabeanalyse und verständliche Parserfehler
│   ├── scale-actions.js    # Regeln für direkte Schalenhandlungen
│   └── pdf.js              # lokaler A4-PDF-Generator und Browserdownload
├── tests/
│   ├── math.test.mjs       # Tests der mathematischen Kernlogik
│   ├── parser.test.mjs     # Tests der Eingabeverarbeitung
│   └── new-features.test.mjs # 16 Abnahmefälle der Überarbeitung
├── docs/
│   └── testprotokoll.md    # dokumentierte automatische und manuelle Prüfungen
├── package.json            # Testbefehl, keine Laufzeitabhängigkeiten
├── scripts/
│   └── generate-sample-pdf.mjs # reproduzierbare PDF-Prüfdatei
├── output/pdf/             # validierte Beispiel-PDF
└── README.md
```

Die JavaScript-Schichten sind bewusst getrennt: `math.js` kennt weder Browser noch Eingabetext, `parser.js` übersetzt Text in mathematische Daten, `scale-actions.js` beschreibt direkte Modellhandlungen, `pdf.js` erzeugt Binärdaten ohne DOM-Abhängigkeit, und `app.js` verbindet alles mit der Oberfläche.

## Veröffentlichung über GitHub Pages

1. Lege ein GitHub-Repository an und übertrage den vollständigen Projektinhalt in den Standard-Branch, üblicherweise `main`.
2. Öffne im Repository **Settings → Pages**.
3. Wähle unter **Build and deployment** die Quelle **Deploy from a branch**.
4. Wähle den Branch `main` und den Ordner `/ (root)`, danach **Save**.
5. Nach dem Deployment zeigt GitHub dort die veröffentlichte Adresse an.

Alle Verweise sind relativ und funktionieren deshalb auch auf einer GitHub-Pages-Projektadresse wie `https://<name>.github.io/<repository>/`. Ein Build-System, Servercode oder eine Datenbank wird nicht benötigt.

## Datenschutz und Sicherheit

- Es gibt keine Benutzerkonten, Datenbank, Cookies, Analyse oder Werbung.
- Gleichungen und Rechenschritte bleiben im Arbeitsspeicher des aktuellen Browser-Tabs.
- Die Anwendung sendet keine Eingaben an externe Server und bindet keine externen Skripte ein.
- Auch PDF-Dateien entstehen ausschließlich im Browser aus dem aktuellen Arbeitsspeicher.
- Beim Neuladen werden die nicht gespeicherten Arbeitsschritte verworfen.
- Eingaben sind auf eine einzelne Gleichung und 250 Zeichen begrenzt.
- HTML-ähnliche Zeichen werden abgewiesen; dynamische Inhalte werden als Text in das Dokument eingesetzt.

Beim Abruf über GitHub Pages gelten zusätzlich die Datenschutz- und Serverprotokoll-Regelungen des Hostinganbieters. Die Anwendung selbst ergänzt keine Nachverfolgung.

## Didaktische Entscheidungen

- **Gleichheit als Beziehung:** Beide Seiten bleiben gleichzeitig sichtbar; das Gleichheitszeichen wird nicht als bloße Aufforderung zum Ausrechnen behandelt.
- **Fester Vergleichswert:** Bei genau einer Lösung dient der Lösungswert der Ausgangsgleichung als Referenz für die Waage. Dadurch wird eine einseitige Veränderung nicht durch Neuberechnung „repariert“.
- **Modellgrenzen statt negativer Massen:** Negative Konstanten, negative x-Terme und negative Lösungen werden ausdrücklich symbolisch und nicht als reale negative Gewichte dargestellt.
- **Sonderfälle ohne erfundene Masse:** Bei keiner oder unendlich vielen Lösungen wird kein einzelner x-Wert als Masse angenommen. Die Darstellung wechselt zum symbolischen Vergleich.
- **Übersicht vor Stückzahl:** Bis zu vier positive ganzzahlige Einheiten werden einzeln gezeigt; größere oder gebrochene Werte werden gruppiert.
- **Exakte Rechnungen:** Brüche werden vollständig gekürzt gespeichert und ausgegeben. Das unterstützt mathematisches Argumentieren ohne Rundungsartefakte.
- **Produktives Üben:** Die Lösung bleibt zunächst verborgen. Hinweise sind abgestuft, Fehlversuche bleiben sichtbar und können gezielt rückgängig gemacht werden.
- **Handlung vor Symbol:** Direkte Schalenaktionen werden immer als mathematische Operation in Gleichung und Verlauf gespiegelt; eine bloße grafische Veränderung ist nicht möglich.
- **Sichere Äquivalenzhandlung:** Der Lernmodus verlangt bei direkten Aktionen ein vorhandenes Gegenstück und eine bewusste Bestätigung, der Experimentiermodus lässt den didaktisch markierten Regelbruch zu.

## Bekannte Grenzen

- Unterstützt werden ausschließlich lineare Gleichungen mit der Variablen `x` in der Form `ax + b = cx + d`.
- Klammern, Potenzen, Produkte von Variablen, andere Variablen, Ungleichungen und Gleichungssysteme werden nicht verarbeitet.
- Die Waage ist ein didaktisches Vergleichsmodell, keine physikalische Simulation. Symbolische Karten haben keine reale Masse.
- Gleichartige Terme werden bereits beim Einlesen und nach jeder Operation normalisiert. Die Schaltfläche zum Zusammenfassen macht diesen Schritt explizit, kann aber deshalb ohne sichtbare Textänderung bleiben.
- Brüche erscheinen als kompakte Inline-Schreibweise und nicht als zweizeiliger Formelsatz.
- Es wird ein Ergebnis, aber kein automatisch erzeugter vollständiger Musterlösungsweg angezeigt.
- Ein rückgängig gemachter und damit aus dem aktuellen Verlauf entfernter Schritt wird nicht in der PDF protokolliert. Wiederherstellungsaktionen, noch vorhandene Fehlversuche und Fehlerhinweise werden dagegen gekennzeichnet exportiert.
- Die PDF verwendet integrierte Standardschriften und ist visuell lesbar, aber nicht als barrierefrei getaggtes PDF ausgegeben.
- Drag-and-drop wurde bewusst nicht ergänzt; alle direkten Handlungen sind zuverlässig per nativen Buttons bedienbar.
- Eine formale Barrierefreiheitsprüfung mit Screenreader sowie Tests in weiteren Browserfamilien stehen noch aus. Die überarbeitete responsive Darstellung wurde im Codex In-App Browser bei 360 × 800 Pixeln geprüft.

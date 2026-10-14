# AVT Check-in 1.0.0-test.9 – reine GitHub-Demo

**Nur den INHALT dieses Verzeichnisses `03_Checkin_Frontend_GitHub` in das Demo-GitHub-Repository/den Demo-Pfad kopieren.** Das produktive Frontend und das produktive Google Apps Script bleiben unverändert.

## Anmeldung und Test
- Demo-Webseite öffnen, mit Passwort **`demo`** anmelden.
- Beispielfall **Anna Beispiel (A-01/A-02/A-03)**: 3 Personen mit regulär 12,00 € eingecheckt. Über Lupe → **Eingecheckt** → **Anna Beispiel** öffnen, auf Familie (10,00 €) umstellen, Grund angeben und bestätigen. Die Demo-Eintrittssumme sinkt von 17,00 € auf 15,00 €.
- Über **€+ → Spenden anzeigen / korrigieren** sind zwei Beispielspenden (10,00 € und 5,00 €) vorhanden. Beträge korrigieren oder eine Spende stornieren (mit Begründung).
- Auch im Bereich **Übersicht** lassen sich eingecheckte Personen öffnen; Check-in-Rücknahme möglich.
- Über **Status: offen (abschließen)** den Status „durchgeführt“ simulieren. Danach sind Korrekturen gesperrt; mit dem Button wieder öffnen.
- **Demo zurücksetzen** stellt die ursprünglichen erfundenen Daten wieder her.

## Datentrennung und Sicherheit
- **Kein Google Apps Script, keine Google-Tabellen, keine echten Voranmeldungen, kein produktives Passwort.** `js/backend.js` ist eine lokale Simulation; es gibt darin keine Netzwerkaufrufe.
- Alle Demodaten werden ausschließlich in `localStorage` unter eigenem `avt-checkin-demo-test8-*`-Schlüssel gespeichert, daher getrennt vom bisherigen Frontend. Ein anderer Browser oder ein anderes Gerät hat eigene Demodaten.
- Die Simulation zeigt keine echte Mehrgeräte-Synchronisierung, Serverberechtigungen, Änderungen der bestehenden Google-Tabellen und auch keinen realen automatischen Kalenderabschluss.
- Die ursprüngliche App-Struktur und QR-Kameraansicht bleiben erhalten; der jsQR-Loader kann bei Bedarf eine externe Open-Source-QR-Bibliothek nachladen. **Es werden keine AVT-Daten an einen Server geschickt.**
- Die Demo enthält ein eigenes *öffentliches* Testpasswort `demo`, **keine produktiven Zugangsdaten**.

## Installation auf GitHub Pages
1. Bestehende Demo vorher sichern, keinesfalls das Produktiv-Repository überschreiben.
2. Die Dateien und Unterverzeichnisse aus `03_Checkin_Frontend_GitHub` exakt in den bisherigen Demo-Pfad übertragen. `index.html`, `manifest.webmanifest`, `service-worker.js`, `styles.css`, `js/` und `icons/` müssen unter derselben relativen Struktur liegen.
3. Änderungen committen; die neue Demo-Seite über HTTPS laden (bei älteren PWA-Caches notfalls neu laden und wieder öffnen).
4. **Ordner 02 / Apps Script brauchst du für diese Version nicht.**

Die lokale Simulation ist **nicht** für produktiven Einlass oder echte Abrechnung geeignet.

## Neu in test.9
- **Lupe → Eingecheckt / Alle:** Zusätzlich zu Voranmeldungen erscheinen unangemeldete Check-ins als „Unangemeldet“, mit Anzahl, Erfassungszeit und interner Kennung. Tippen öffnet die Korrektur.
- **Übersicht:** Unangemeldete Check-ins sind auch hier auswählbar.
- Der Browser-Speicher aus test.8 bleibt absichtlich erhalten (unveränderte `avt-checkin-demo-test8-*`-Schlüssel). Die PWA-Kennung bleibt ebenfalls unverändert.

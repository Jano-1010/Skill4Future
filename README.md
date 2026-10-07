# Skill4Future
Kompetenzen fürs Leben.

## Wissensnetz: Versicherung, Vorsorge, Investition, Vermögensallokation (Schweiz)

Die Startseite zeigt ein Netz mit vier Bereichen. Ein Klick auf einen Bereich zeigt dessen Themen wieder als Netz, ein Klick auf ein Thema öffnet die eigene Seite dazu. Insgesamt gibt es 28 Themenseiten mit festem Aufbau: Auf einen Blick, So funktioniert's, Rechenbeispiel, Häufige Fehler, interaktive Checkliste und Quellen.

Website: https://jano-1010.github.io/Skill4Future/

### Aufbau des Repositorys

| Pfad | Inhalt |
| --- | --- |
| `index.html` | Startseite mit Kreuz, Bereichsauswahl und Themenübersicht |
| `themen/*.html` | Erzeugte Themenseiten, nicht von Hand bearbeiten |
| `assets/nodes.js` | Erzeugte Datenliste für Startseite und Themenübersicht, nicht von Hand bearbeiten |
| `assets/site.css`, `assets/menu.js` | Gemeinsames Design (Farben, Schriften, Kopf- und Fusszeile, Burger-Menü) |
| `assets/index.css`, `assets/index.js` | Startseite: Kreuz, Hintergrundnetz, Bereichsabschnitt |
| `assets/page.css`, `assets/page.js` | Themenseiten: Gestaltung und abhakbare Checkliste |
| `assets/logo-round.png`, `assets/favicon-*.png`, `assets/apple-touch-icon.png` | Rundes Logo mit transparentem Rand (Seite, Browser-Tab, Handy-Startbildschirm) |
| `content/bereiche.json` | Die vier Bereiche und der Einleitungstext der Startseite |
| `content/themen/*.md` | **Die Inhalte**, ein Markdown-Dokument pro Thema |
| `content/_vorlage.html` | HTML-Vorlage der Themenseiten |
| `build.ps1` | Erzeugt `themen/*.html` und `assets/nodes.js` aus `content/` |

### Design
Das Design stammt aus dem Claude-Design-Handoff (Logo-Blau `#164782`, Akzent Himmelblau `#4FA3E0`, Schriften League Spartan, Cormorant Garamond und Lora). Die Farben stehen als Variablen oben in `assets/site.css`. Himmelblau wird nie als Textfarbe auf Weiss verwendet, dafür gilt `#1F5F8F`.

Die Menüpunkte im Burger-Menü (Login, Registrieren, Über uns, Kontakt, Mein Profil, Einstellungen) sind Platzhalter ohne Zielseite.

### Inhalte ändern oder ergänzen

1. Datei in `content/themen/` bearbeiten oder eine neue anlegen (am einfachsten eine bestehende kopieren).
2. Aufbau einer Themendatei: Oben ein Kopfbereich zwischen `---`, danach Text.

```
---
id: saeule3a
bereich: vorsorge          # versicherung, vorsorge, investition oder allokation
titel: Säule 3a – gebundene Vorsorge
kurztitel: Säule 3a        # Beschriftung im Netz
icon: 🔒
reihenfolge: 3             # Position im Bereich
verwandt: etf, saeule2     # IDs verwandter Themen
video:                     # optional, YouTube-Link
stand: Oktober 2026
---
Einleitungsabsatz (Kurz erklärt).

## Auf einen Blick
- Stichpunkt

## So funktioniert's
Text mit **Fettdruck**, Links wie [ETF](thema:etf) oder [Quelle](https://...).
```

3. Seiten neu erzeugen (Windows PowerShell, im Ordner des Repositorys):

```
powershell -ExecutionPolicy Bypass -File build.ps1
```

4. Änderungen committen und pushen. GitHub Pages veröffentlicht automatisch.

Überschriften, die mit "Auf einen Blick", "Beispiel", "Checkliste" oder "Quellen" beginnen, erhalten ihre besondere Darstellung. Tabellen werden mit `| a | b |` geschrieben, Checklisten mit `- [ ] Punkt`.

### Hinweise zu den Inhalten
Die Texte sind allgemeine Information und keine Anlage-, Steuer- oder Rechtsberatung. Zahlen wie Franchise, Säule-3a-Höchstbetrag oder BVG-Grenzen ändern sich in der Regel jährlich. Prüfe sie vor einer Veröffentlichung gegen die verlinkten Quellen und passe das Feld `stand` an.

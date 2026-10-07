# Skill4Future
Kompetenzen fürs Leben.

## Wissensnetz: Versicherung, Vorsorge, Investition, Vermögensallokation (Schweiz)

Die Startseite zeigt ein Netz mit vier Bereichen. Ein Klick auf einen Bereich zeigt dessen Themen wieder als Netz, ein Klick auf ein Thema öffnet die eigene Seite dazu. Insgesamt gibt es 28 Themenseiten mit festem Aufbau: Auf einen Blick, So funktioniert's, Rechenbeispiel, Häufige Fehler, interaktive Checkliste und Quellen.

Website: https://jano-1010.github.io/Skill4Future/

### Aufbau des Repositorys

| Pfad | Inhalt |
| --- | --- |
| `index.html` | Startseite mit dem Netz |
| `themen/*.html` | Erzeugte Themenseiten, nicht von Hand bearbeiten |
| `assets/nodes.js` | Erzeugte Datenliste für das Netz, nicht von Hand bearbeiten |
| `assets/page.css`, `assets/page.js` | Gestaltung und Checkliste der Themenseiten |
| `content/bereiche.json` | Die vier Bereiche und der Einleitungstext der Startseite |
| `content/themen/*.md` | **Die Inhalte**, ein Markdown-Dokument pro Thema |
| `content/_vorlage.html` | HTML-Vorlage der Themenseiten |
| `build.ps1` | Erzeugt `themen/*.html` und `assets/nodes.js` aus `content/` |

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

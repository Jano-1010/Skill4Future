# Skill4Future
Kompetenzen fürs Leben.

## Wissensnetz: Versicherung, Vorsorge, Investition (Schweiz)

Interaktive Übersicht als Spinnennetz. Von der Startseite aus öffnet man einen Bereich (Versicherung, Vorsorge, Investition), der seine Themen wieder als Netz zeigt. Ein Klick auf ein Thema führt zur Inhaltsseite mit Text, Video, Links und verknüpften Themen.

- `index.html`: die komplette Seite (HTML, CSS und JavaScript in einer Datei, keine Abhängigkeiten)
- Die Inhalte stehen im Array `INITIAL_NODES` im Skript am Ende der Datei. Jeder Eintrag hat `id`, `label`, `short`, `icon`, `category`, `parent`, `order`, `description`, `videoUrl`, `links` und `relatedIds`.
- Neue Themen: Eintrag mit `parent` auf den Bereich (z. B. `"versicherung"`) ergänzen. Das Netz ordnet sich automatisch.

### Bearbeitungsmodus
Der Schalter "Bearbeiten" funktioniert nur in der Claude-Artifact-Version, weil die Änderungen dort in der Artifact-Datenbank gespeichert werden. Als normale Webseite (z. B. GitHub Pages) ist die Seite schreibgeschützt und zeigt die Inhalte aus `INITIAL_NODES`.

### Lokal ansehen
`index.html` im Browser öffnen.

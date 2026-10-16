# Browser-Abnahme Styrian-Bastards-Homepage – 16.10.2026

Stand: Teilabnahme, keine Produktionsfreigabe. Ausgangscommit bcdbd44df539d9474860e3d2a4f8090ea8417f33; Korrekturcommit f7fc5f1c34c9a4d48f706344c7e1a25dc15094d7.

| Prüfung | Ergebnis | Beleg |
|---|---|---|
| Hinweis im Events-Bereich der Startseite | Bestanden | Im produktiven Browser sichtbar, Link führt nach /heimspiel-helferplanung. |
| Produktives Seitendesign | Nicht bestanden | Browser: H1 32 px, H2 64 px, seitenspezifische Gestaltung fehlt. |
| Produktive Spielanzeige | Nicht bestanden | Ladehinweis bleibt stehen, keine Spielkarten. |
| Öffentliche Datenquelle, nur lesend | Bestanden | GET auf home_game_helper_events mit publication_state=eq.published liefert drei Termine: Wiener Eislauf-Verein 17.10.2026 18:30 MESZ, ASKÖ Grizzlies Linz 25.10.2026 18:30 MEZ, Wiener Eislauf-Verein 14.11.2026 18:30 MEZ. Jeweils arrival_minutes_before=120. |
| Ursache gegen ausgelieferte CSP geprüft | Bestanden | HTTP-Antwort erlaubt self-Skripte und zwei feste Hashes, keine Freigabe für den Inline-Ladecode; style-src erlaubt keinen Inline-Styleblock. Originaldatei enthält beide Inline-Blöcke. Browserzustand passt dazu. Die Browser-Log-Schnittstelle liefert nur Erweiterungsfehler; keine gesonderte Netzwerkaufzeichnung verfügbar. |
| Unterpunkt unter Mitgliederbereich | Bestanden (Struktur) | Produktives navbar.html enthält Unterpunkt; Interaktionsabnahme noch offen. |
| Korrektur-Build | Bestanden | npm run build: Encoding-Prüfung, Hero-Schutz und statischer Build erfolgreich. |
| Korrektur-Syntax / Diff | Bestanden | node --check für beide geänderten JS-Dateien, git diff --check. |
| CSP-konforme Korrekturstruktur | Bestanden | Kein Inline-CSS oder Inline-Ladeskript auf Heimspielseite, kein Inline-Klickhandler in navbar.html, gemeinsamer sb-page-hero. |
| Preview-Gesamtabnahme | Nicht bestanden – blockiert | Keine Pages-Preview in GitHub-Commitstatus gemeldet. Dashboard fordert Anmeldung; kein Cloudflare-Plugin gefunden. |
| 375 px | Nicht bestanden – noch nicht geprüft | Keine freigegebene Preview; Browseroberfläche bietet keine Viewport-Umschaltung. |
| 390 px | Nicht bestanden – noch nicht geprüft | Wie oben. |
| 768 px | Nicht bestanden – noch nicht geprüft | Wie oben. |
| 1024 px | Nicht bestanden – noch nicht geprüft | Wie oben. |
| 1440 px | Nicht bestanden – noch nicht geprüft | Wie oben. Produktiver Istzustand wurde bei 1363 × 936 geprüft. |
| Cloudflare-Projektkonfiguration und Git-Verknüpfung | Nicht bestanden – blockiert | Anmeldung erforderlich. Cloudflare-Header auf Produktivseite nachgewiesen; das allein bestätigt weder Projektkonfiguration noch Deployment-Commit. |
| Veröffentlichung und erneute Produktionsabnahme | Nicht bestanden – bewusst nicht ausgeführt | Bedingung der erfolgreichen Preview-Gesamtabnahme ist nicht erfüllt. |

## Korrekturumfang

Separate CSS-/JS-Dateien für Heimspielseite, expliziter gemeinsamer Unterseiten-Hero, delegierte Dropdownsteuerung ohne Inline-Handler, mobile Menüschaltfläche, 44-Pixel-Bedienflächen, Escape-/Außenklick-Behandlung und aktive Seitenmarkierung. Versionierte Asset-URLs wegen langem Cache. Änderungen ausschließlich im Website-Repository. Keine Datenbank-, Vereinsmanager-V2- oder Sektion-Liebenau-Änderungen.

## Fortsetzung

Cloudflare anmelden, Pages-Projekt styrian-bastards-website öffnen, Git-Integration/Produktionszweig/Buildbefehl/Ausgabeverzeichnis/Previewzweige und Deployments prüfen. Preview des Korrekturzweigs bereitstellen. Vollständige Browser- und Netzwerkprüfung mit realer CSP und fünf Breiten durchführen. Erst nach Erfolg PR zusammenführen, Deployment-Commit bestätigen und Produktion erneut prüfen.

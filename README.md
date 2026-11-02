# ChessTrainer

Schach-Eröffnungstrainer als installierbare Web-App (PWA). Du spielst deine Repertoire-Züge,
der Gegner antwortet automatisch. Fehler werden mit Pfeil korrigiert, und Linien kommen per
verteilter Wiederholung (Leitner-System) wieder, wenn sie fällig sind.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server auf http://localhost:5173
npm run build    # Produktions-Build nach dist/
npm run lint
```

Zum Testen auf dem Handy im selben WLAN: `npm run dev -- --host` und die angezeigte Netzwerk-URL öffnen.
Service Worker und Installation funktionieren allerdings nur über HTTPS (bzw. localhost).

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/data/repertoires.ts` | Eingebaute Eröffnungslinien (SAN-Züge) |
| `src/lib/storage.ts` | Lernfortschritt + eigene Linien in `localStorage`, Leitner-Intervalle |
| `src/components/Trainer.tsx` | Trainingsbrett (Ziehen oder Antippen) |
| `src/components/ImportForm.tsx` | Eigene Linien per PGN hinzufügen |
| `vite.config.ts` | PWA-Manifest und Service Worker (`vite-plugin-pwa`) |

## Deployment

Pushes auf `main` werden per GitHub Action auf GitHub Pages veröffentlicht
(`.github/workflows/deploy.yml`). Einmalig im Repo unter **Settings → Pages → Source: GitHub Actions** aktivieren.

## Als App installieren

- **iPhone/iPad:** Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“
- **Android:** In Chrome „App installieren“ wählen

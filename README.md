# ChessTrainer

Schach-Eröffnungstrainer als installierbare Web-App (PWA).

- **Repertoire als Stellungsbaum:** Für jede Stellung ist dein Zug hinterlegt, Zugumstellungen werden erkannt.
- **Gegner aus der Lichess-Datenbank:** Der Gegner wählt Züge gewichtet nach Häufigkeit (Lichess-Partien
  nach Elo/Bedenkzeit oder Meisterpartien). So kommen auch Nebenvarianten dran.
- **Neue Stellungen lernen:** Trifft der Gegner eine Variante, die noch nicht im Repertoire ist, legst du
  deinen Zug fest (mit Datenbank-Statistik als Hilfe).
- **Verteilte Wiederholung:** Jede Stellung ist eine Karteikarte (Leitner-System); fällige Stellungen werden
  vom Gegner bevorzugt angesteuert.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server auf http://localhost:5173
npm run build    # Produktions-Build nach dist/
npm run lint
npm test         # Unit-Tests (vitest)
```

Zum Testen auf dem Handy im selben WLAN: `npm run dev -- --host` und die angezeigte Netzwerk-URL öffnen.
Service Worker und Installation funktionieren allerdings nur über HTTPS (bzw. localhost).

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/data/repertoires.ts` | Startrepertoires (werden beim ersten Start in den Speicher übernommen) |
| `src/lib/repertoire.ts` | Stellungsbaum, Stellungsschlüssel, Import von Zugfolgen |
| `src/lib/storage.ts` | Repertoires, Lernfortschritt und Einstellungen in `localStorage` |
| `src/lib/srs.ts` | Leitner-Intervalle |
| `src/lib/lichessAuth.ts` | „Mit Lichess anmelden“ (OAuth2 + PKCE, ohne Server) |
| `src/lib/explorer.ts` | Opening-Explorer-Client: Cache, eine Anfrage gleichzeitig, Pause bei HTTP 429 |
| `src/lib/opponent.ts` | Gewichtete Zugwahl des Gegners |
| `src/components/Trainer.tsx` | Trainingsbrett (Ziehen oder Antippen) |
| `vite.config.ts` | PWA-Manifest und Service Worker (`vite-plugin-pwa`) |

## Deployment

Pushes auf `main` werden per GitHub Action auf GitHub Pages veröffentlicht
(`.github/workflows/deploy.yml`). Einmalig im Repo unter **Settings → Pages → Source: GitHub Actions** aktivieren.

## Als App installieren

- **iPhone/iPad:** Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“
- **Android:** In Chrome „App installieren“ wählen

## Lichess-Datenbank

Der [Opening Explorer](https://lichess.org/api#tag/Opening-Explorer) (`explorer.lichess.org`) verlangt eine
Anmeldung. Die App nutzt dafür den PKCE-Flow von Lichess, ganz ohne eigenen Server. Der Token liegt nur
lokal im Browser und gilt etwa ein Jahr. Falls die Weiterleitung nicht klappt (z. B. in der installierten
iPhone-App), kann man alternativ einen persönlichen API-Token einfügen.

Rate-Limit laut Lichess: nur eine Anfrage gleichzeitig, bei HTTP 429 mindestens eine Minute warten. Die App
hält sich daran und speichert Antworten lokal zwischen (bis 1500 Stellungen), sodass jede Stellung nur
einmal abgefragt wird.

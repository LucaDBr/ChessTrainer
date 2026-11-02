# Marketing

Erzeugt die Instagram-Beiträge für [@chesstrainerapp](https://instagram.com/chesstrainerapp) als PNG (1080×1350).

```bash
npm install
npm run render                 # alle Beiträge nach out/
npm run render -- legals-mate  # nur einen Beitrag
```

- Inhalte, Captions und Hashtags: `posts.mjs`. Brettstellungen werden als Zugfolgen angegeben und von chess.js geprüft.
- Layout und Folienvorlagen (`board`, `text`, `steps`, `timeline`, `table`, `cta`): `render.mjs`.
- Ausgabe: `out/<nr>-<id>/slide-N.png` plus `out/captions.md` mit allen Bildunterschriften.
- Schrift: Segoe UI aus `C:\Windows\Fonts` (läuft daher nur unter Windows).

## Credits

Schachfiguren: [Colin M.L. Burnett](https://commons.wikimedia.org/wiki/User:Cburnett), verwendet unter der BSD-Lizenz
(die Originale auf Wikimedia Commons sind GFDL/BSD/GPL mehrfachlizenziert).
Engine-Bewertungen: [Lichess Cloud Analysis](https://lichess.org/api#tag/Analysis).

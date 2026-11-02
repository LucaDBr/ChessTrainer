import { useState } from 'react'
import { PERSONAL_TOKEN_URL, type LichessAuth } from '../lib/lichessAuth'

export function LichessLogin({ auth }: { auth: LichessAuth }) {
  const [manual, setManual] = useState('')

  if (auth.token) {
    return (
      <section className="card login-card">
        <span>
          Lichess-Datenbank aktiv{auth.username && <> · angemeldet als <strong>{auth.username}</strong></>}
        </span>
        <button className="link" onClick={auth.logout}>Abmelden</button>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Lichess-Datenbank verbinden</h2>
      <p className="muted small">
        Damit spielt der Gegner echte Nebenvarianten – gewichtet danach, wie oft sie auf Lichess vorkommen. Lichess
        verlangt dafür eine Anmeldung (kostenloser Account genügt).
      </p>
      {auth.error && <div className="feedback bad">{auth.error}</div>}
      <button className="primary" onClick={auth.login}>Mit Lichess anmelden</button>
      <details className="manual-token">
        <summary className="muted small">Klappt nicht? Token manuell einfügen (z. B. in der iPhone-App)</summary>
        <ol className="small muted">
          <li>
            <a href={PERSONAL_TOKEN_URL} target="_blank" rel="noreferrer">Token auf Lichess erstellen</a> – keine
            Häkchen nötig, einfach „Erstellen“.
          </li>
          <li>Token kopieren und hier einfügen:</li>
        </ol>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            auth.setManualToken(manual)
            setManual('')
          }}
        >
          <input placeholder="lip_…" value={manual} onChange={(e) => setManual(e.target.value)} />
          <button type="submit" disabled={!manual.trim()}>Speichern</button>
        </form>
      </details>
    </section>
  )
}

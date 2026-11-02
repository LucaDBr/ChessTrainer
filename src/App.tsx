import { useState } from 'react'
import { ImportForm } from './components/ImportForm'
import { InstallHint } from './components/InstallHint'
import { LichessLogin } from './components/LichessLogin'
import { SettingsPanel } from './components/SettingsPanel'
import { Trainer } from './components/Trainer'
import { useLichessAuth } from './lib/lichessAuth'
import { repertoireStats } from './lib/repertoire'
import { useStoredState } from './lib/storage'
import type { Color } from './lib/types'

type Session = { repertoireId: string; round: number }

export default function App() {
  const store = useStoredState()
  const auth = useLichessAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<Color>('white')

  const active = session && store.repertoires.find((r) => r.id === session.repertoireId)
  if (session && active) {
    return (
      <main>
        <Trainer
          key={`${active.id}-${session.round}`}
          repertoire={active}
          progress={store.progress}
          settings={store.settings}
          token={auth.token}
          store={store}
          onAuthError={auth.invalidate}
          onNext={() => setSession({ ...session, round: session.round + 1 })}
          onExit={() => setSession(null)}
        />
      </main>
    )
  }

  return (
    <main>
      <header className="app-header">
        <h1>♞ ChessTrainer</h1>
        <p className="muted">Eröffnungen lernen mit verteilter Wiederholung.</p>
      </header>

      <InstallHint />
      <LichessLogin auth={auth} />

      {store.repertoires.map((rep) => {
        const stats = repertoireStats(rep, store.progress)
        return (
          <section key={rep.id} className="card">
            <div className="card-title">
              <div>
                <h2>{rep.name}</h2>
                <div className="muted small">
                  {rep.color === 'white' ? 'Weiß' : 'Schwarz'} · {stats.positions} Stellungen
                </div>
              </div>
              <button
                className="link danger"
                aria-label="Repertoire löschen"
                onClick={() => confirm(`„${rep.name}“ wirklich löschen?`) && store.deleteRepertoire(rep.id)}
              >
                ✕
              </button>
            </div>
            <div className="rep-footer">
              <span className="badges">
                {stats.due > 0 && <span className="badge due">{stats.due} fällig</span>}
                {stats.fresh > 0 && <span className="badge">{stats.fresh} neu</span>}
                {stats.due === 0 && stats.fresh === 0 && stats.positions > 0 && <span className="badge">alles gelernt</span>}
              </span>
              <button className="primary" onClick={() => setSession({ repertoireId: rep.id, round: 0 })}>
                Trainieren
              </button>
            </div>
          </section>
        )
      })}

      <details className="card">
        <summary>
          <h2>Neues Repertoire</h2>
        </summary>
        <form
          className="import-form"
          onSubmit={(e) => {
            e.preventDefault()
            store.createRepertoire(newName.trim(), newColor)
            setNewName('')
          }}
        >
          <input placeholder="Name, z. B. Caro-Kann" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <div className="segmented">
            <label>
              <input type="radio" checked={newColor === 'white'} onChange={() => setNewColor('white')} /> Ich spiele Weiß
            </label>
            <label>
              <input type="radio" checked={newColor === 'black'} onChange={() => setNewColor('black')} /> Ich spiele Schwarz
            </label>
          </div>
          <p className="muted small">
            Ein leeres Repertoire füllst du einfach beim Trainieren: In jeder neuen Stellung legst du deinen Zug fest.
            {newColor === 'black' && ' Mit Schwarz braucht der Gegner dafür die Lichess-Datenbank (oder importiere eine PGN).'}
          </p>
          <button className="primary" type="submit" disabled={!newName.trim()}>
            Anlegen
          </button>
        </form>
      </details>

      <ImportForm repertoires={store.repertoires} onImport={store.importLine} />
      <SettingsPanel settings={store.settings} onChange={store.updateSettings} />

      <footer className="muted small">
        <button className="link" onClick={() => confirm('Gesamten Lernfortschritt zurücksetzen?') && store.resetProgress()}>
          Fortschritt zurücksetzen
        </button>
      </footer>
    </main>
  )
}

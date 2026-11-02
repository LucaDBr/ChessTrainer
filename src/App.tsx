import { useCallback, useMemo, useState } from 'react'
import { ImportForm } from './components/ImportForm'
import { InstallHint } from './components/InstallHint'
import { Trainer } from './components/Trainer'
import { builtinLines } from './data/repertoires'
import { isDue, useStoredState } from './lib/storage'
import type { Line } from './lib/types'

type Session = { queue: string[]; index: number }

export default function App() {
  const store = useStoredState()
  const { progress, customLines, recordResult } = store
  const [session, setSession] = useState<Session | null>(null)

  const lines = useMemo(() => [...builtinLines, ...customLines], [customLines])
  const lineById = useMemo(() => new Map(lines.map((l) => [l.id, l])), [lines])

  const repertoires = useMemo(() => {
    const groups = new Map<string, Line[]>()
    for (const line of lines) groups.set(line.repertoire, [...(groups.get(line.repertoire) ?? []), line])
    return [...groups.entries()]
  }, [lines])

  const dueIds = lines.filter((l) => isDue(progress[l.id])).map((l) => l.id)

  function start(queue: string[]) {
    if (queue.length > 0) setSession({ queue, index: 0 })
  }

  const currentId = session?.queue[session.index]
  const handleComplete = useCallback(
    (mistakes: number) => {
      if (currentId) recordResult(currentId, mistakes)
    },
    [currentId, recordResult],
  )

  if (session && currentId) {
    const line = lineById.get(currentId)!
    const hasNext = session.index + 1 < session.queue.length
    return (
      <main>
        <Trainer
          key={`${currentId}-${session.index}`}
          line={line}
          onComplete={handleComplete}
          onNext={() => (hasNext ? setSession({ ...session, index: session.index + 1 }) : setSession(null))}
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

      <section className="card due-card">
        <div>
          <strong>{dueIds.length}</strong> von {lines.length} Linien fällig
        </div>
        <button className="primary" disabled={dueIds.length === 0} onClick={() => start(dueIds)}>
          Fällige trainieren
        </button>
      </section>

      {repertoires.map(([name, group]) => (
        <section key={name} className="card">
          <div className="card-title">
            <h2>{name}</h2>
            <button onClick={() => start(group.map((l) => l.id))}>Alle üben</button>
          </div>
          <ul className="line-list">
            {group.map((line) => {
              const p = progress[line.id]
              return (
                <li key={line.id}>
                  <button className="line-button" onClick={() => start([line.id])}>
                    <span>{line.name}</span>
                    <span className={`badge ${isDue(p) ? 'due' : ''}`}>
                      {!p ? 'neu' : isDue(p) ? 'fällig' : `Stufe ${p.box}`}
                    </span>
                  </button>
                  {line.id.startsWith('custom-') && (
                    <button className="link danger" onClick={() => store.removeCustomLine(line.id)} aria-label="Löschen">
                      ✕
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <ImportForm onAdd={store.addCustomLine} />

      <footer className="muted small">
        <button className="link" onClick={() => confirm('Gesamten Lernfortschritt zurücksetzen?') && store.resetProgress()}>
          Fortschritt zurücksetzen
        </button>
      </footer>
    </main>
  )
}

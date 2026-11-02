import type { Settings } from '../lib/types'

const RATING_GROUPS = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500]
const SPEEDS: [string, string][] = [
  ['bullet', 'Bullet'],
  ['blitz', 'Blitz'],
  ['rapid', 'Schnellschach'],
  ['classical', 'Klassisch'],
  ['correspondence', 'Fernschach'],
]

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

type Props = { settings: Settings; onChange: (patch: Partial<Settings>) => void }

export function SettingsPanel({ settings, onChange }: Props) {
  return (
    <details className="card">
      <summary>
        <h2>Einstellungen</h2>
      </summary>
      <div className="settings">
        <label className="setting">
          <span>Datenbank</span>
          <select value={settings.source} onChange={(e) => onChange({ source: e.target.value as Settings['source'] })}>
            <option value="lichess">Lichess-Partien</option>
            <option value="masters">Meisterpartien</option>
          </select>
        </label>

        {settings.source === 'lichess' && (
          <>
            <div className="setting">
              <span>Elo der Gegner</span>
              <div className="chips">
                {RATING_GROUPS.map((r) => (
                  <button
                    key={r}
                    className={`chip ${settings.ratings.includes(r) ? 'active' : ''}`}
                    onClick={() => {
                      const next = toggle(settings.ratings, r)
                      if (next.length) onChange({ ratings: next.sort((a, b) => a - b) })
                    }}
                  >
                    {r === 2500 ? '2500+' : r === 0 ? '<1000' : r}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting">
              <span>Bedenkzeit</span>
              <div className="chips">
                {SPEEDS.map(([value, label]) => (
                  <button
                    key={value}
                    className={`chip ${settings.speeds.includes(value) ? 'active' : ''}`}
                    onClick={() => {
                      const next = toggle(settings.speeds, value)
                      if (next.length) onChange({ speeds: next })
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <label className="setting">
          <span>Eigene Züge pro Runde</span>
          <select value={settings.maxDepth} onChange={(e) => onChange({ maxDepth: Number(e.target.value) })}>
            {[4, 6, 8, 10, 12, 15, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>

        <label className="setting">
          <span>Seltene Gegnerzüge ausblenden unter</span>
          <select value={settings.minShare} onChange={(e) => onChange({ minShare: Number(e.target.value) })}>
            {[0.01, 0.03, 0.05, 0.1, 0.2].map((n) => (
              <option key={n} value={n}>{n * 100} %</option>
            ))}
          </select>
        </label>
      </div>
    </details>
  )
}

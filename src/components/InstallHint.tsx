import { useState } from 'react'

const DISMISS_KEY = 'chesstrainer:install-hint-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

/** iOS zeigt keinen eigenen Installationsdialog – deshalb ein kurzer Hinweis. */
export function InstallHint() {
  const [hidden, setHidden] = useState(() => isStandalone() || !isIos || localStorage.getItem(DISMISS_KEY) === '1')
  if (hidden) return null

  return (
    <div className="card install-hint">
      <span>
        Als App installieren: In Safari auf <strong>Teilen</strong> tippen, dann <strong>„Zum Home-Bildschirm“</strong>.
      </span>
      <button
        className="link"
        aria-label="Hinweis schließen"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1')
          setHidden(true)
        }}
      >
        ✕
      </button>
    </div>
  )
}

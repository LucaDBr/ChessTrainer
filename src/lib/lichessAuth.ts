import { useCallback, useEffect, useState } from 'react'

// "Mit Lichess anmelden" per OAuth2 Authorization Code Flow mit PKCE.
// Lichess erlaubt öffentliche Clients ohne Registrierung: client_id ist frei wählbar.
const CLIENT_ID = 'chesstrainer-lucadbr'
const TOKEN_KEY = 'chesstrainer:lichess-token'
const PKCE_KEY = 'chesstrainer:lichess-pkce'

export const PERSONAL_TOKEN_URL = 'https://lichess.org/account/oauth/token/create?description=ChessTrainer'

function redirectUri(): string {
  return window.location.origin + import.meta.env.BASE_URL
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function randomString(byteLength: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

async function startLogin() {
  const verifier = randomString(48)
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
  const state = randomString(16)
  localStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }))
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  })
  window.location.assign(`https://lichess.org/oauth?${params}`)
}

// Verhindert, dass React StrictMode den Code doppelt einlöst.
let callbackPromise: Promise<string | null> | null = null

/** Verarbeitet die Rückleitung von Lichess (?code=…&state=…), falls vorhanden. */
function handleCallback(): Promise<string | null> {
  callbackPromise ??= (async () => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    if (!code && !error) return null
    window.history.replaceState(null, '', redirectUri())
    if (error) throw new Error('Anmeldung bei Lichess abgebrochen.')

    const stored = JSON.parse(localStorage.getItem(PKCE_KEY) ?? 'null') as { verifier: string; state: string } | null
    localStorage.removeItem(PKCE_KEY)
    if (!stored || stored.state !== params.get('state')) throw new Error('Anmeldung fehlgeschlagen (ungültiger Status).')

    const res = await fetch('https://lichess.org/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code!,
        code_verifier: stored.verifier,
        redirect_uri: redirectUri(),
        client_id: CLIENT_ID,
      }),
    })
    if (!res.ok) throw new Error('Anmeldung fehlgeschlagen (Token konnte nicht abgerufen werden).')
    const data = (await res.json()) as { access_token: string }
    return data.access_token
  })()
  return callbackPromise
}

export function useLichessAuth() {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [account, setAccount] = useState<{ token: string; username: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setToken = useCallback((value: string | null) => {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
    setTokenState(value)
  }, [])

  useEffect(() => {
    handleCallback()
      .then((t) => t && setToken(t))
      .catch((e: Error) => setError(e.message))
  }, [setToken])

  // Token prüfen und Benutzernamen laden.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch('https://lichess.org/api/account', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          setToken(null)
          setError('Die Lichess-Anmeldung ist abgelaufen. Bitte neu anmelden.')
        } else if (res.ok) {
          setAccount({ token, username: ((await res.json()) as { username: string }).username })
          setError(null)
        }
      })
      .catch(() => {
        // offline: Token behalten, Name bleibt leer
      })
    return () => {
      cancelled = true
    }
  }, [token, setToken])

  const login = useCallback(() => {
    setError(null)
    startLogin().catch(() => setError('Anmeldung nicht möglich (nur über HTTPS oder localhost).'))
  }, [])

  const logout = useCallback(() => {
    if (token) {
      fetch('https://lichess.org/api/token', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(
        () => {},
      )
    }
    setToken(null)
  }, [token, setToken])

  const setManualToken = useCallback((value: string) => setToken(value.trim() || null), [setToken])

  /** Wird aufgerufen, wenn eine API-Anfrage mit 401 abgelehnt wurde. */
  const invalidate = useCallback(() => {
    setToken(null)
    setError('Die Lichess-Anmeldung ist abgelaufen. Bitte neu anmelden.')
  }, [setToken])

  const username = token && account?.token === token ? account.username : null

  return { token, username, error, login, logout, setManualToken, invalidate }
}

export type LichessAuth = ReturnType<typeof useLichessAuth>

// Spotify Authorization Code with PKCE — runs entirely in the browser.
// Client ID is stored in the app store (publishable; not a secret).

const TOKEN_KEY = "spotify_token_v1";
const VERIFIER_KEY = "spotify_pkce_verifier";
const STATE_KEY = "spotify_pkce_state";

export interface SpotifyToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // ms epoch
  scope: string;
}

const SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-read-currently-playing",
  "streaming",
].join(" ");

function b64url(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(text: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

function randStr(len = 64) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return b64url(bytes.buffer);
}

export function getRedirectUri() {
  return `${window.location.origin}/spotify-callback`;
}

export function getStoredToken(): SpotifyToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SpotifyToken;
  } catch { return null; }
}

export function setStoredToken(t: SpotifyToken | null) {
  if (!t) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
}

export async function beginLogin(clientId: string) {
  if (!clientId) throw new Error("Spotify Client ID em falta");
  const verifier = randStr(64);
  const challenge = b64url(await sha256(verifier));
  const state = randStr(16);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    scope: SCOPES,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(clientId: string, code: string, state: string) {
  const savedState = sessionStorage.getItem(STATE_KEY);
  if (!savedState || savedState !== state) throw new Error("State inválido (possível CSRF)");
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Verifier PKCE em falta");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
  });
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error("Falha ao trocar code: " + (await r.text()));
  const j = await r.json();
  const token: SpotifyToken = {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + (j.expires_in - 60) * 1000,
    scope: j.scope,
  };
  setStoredToken(token);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return token;
}

export async function refreshToken(clientId: string): Promise<SpotifyToken | null> {
  const cur = getStoredToken();
  if (!cur?.refresh_token) return null;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: cur.refresh_token,
    client_id: clientId,
  });
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) { setStoredToken(null); return null; }
  const j = await r.json();
  const token: SpotifyToken = {
    access_token: j.access_token,
    refresh_token: j.refresh_token ?? cur.refresh_token,
    expires_at: Date.now() + (j.expires_in - 60) * 1000,
    scope: j.scope ?? cur.scope,
  };
  setStoredToken(token);
  return token;
}

export async function api(clientId: string, path: string, init?: RequestInit): Promise<any> {
  let t = getStoredToken();
  if (!t) throw new Error("Sem sessão Spotify");
  if (Date.now() >= t.expires_at) t = (await refreshToken(clientId)) ?? t;
  const url = path.startsWith("http") ? path : `https://api.spotify.com/v1${path}`;
  const r = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${t.access_token}`,
      "Content-Type": init?.body ? "application/json" : (init?.headers as any)?.["Content-Type"] ?? "application/json",
    },
  });
  if (r.status === 204) return null;
  if (!r.ok) throw new Error(`Spotify ${r.status}: ${await r.text()}`);
  return r.json();
}

export function logout() {
  setStoredToken(null);
}
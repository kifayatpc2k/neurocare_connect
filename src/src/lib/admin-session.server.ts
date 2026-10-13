import { useSession } from "@tanstack/react-start/server";

/**
 * Server-only Admins Access session. Credentials come only from server
 * secrets (NEUROCARE_ADMIN_LOGIN_ID / NEUROCARE_ADMIN_PASSWORD_HASH); nothing
 * is stored in the database or browser except an encrypted, httpOnly cookie.
 */
export const ADMIN_SESSION_MINUTES = 30;

type AdminSession = { login?: string; userId?: string; issuedAt?: number };

function config() {
  const password = process.env["ADMIN_SESSION_SECRET"];
  if (!password) throw new Error("Admins Access is not configured on the server.");
  return {
    password,
    name: "ncc-admin",
    maxAge: ADMIN_SESSION_MINUTES * 60,
    // SameSite=None + Partitioned so the cookie also works when the app is shown
    // inside an embedded frame (e.g. the editor preview); server functions are
    // still protected from cross-site calls by the CSRF middleware in start.ts.
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      partitioned: true,
      path: "/",
    },
  };
}

export async function getAdminSession() {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- TanStack server session helper, not a React hook
  return useSession<AdminSession>(config());
}

/** Valid only for the same signed-in research user and within the time limit. */
export async function readValidAdmin(userId: string): Promise<{ login: string } | null> {
  const s = await getAdminSession();
  const d = s.data;
  if (!d.login || !d.issuedAt || d.userId !== userId) return null;
  if (Date.now() - d.issuedAt > ADMIN_SESSION_MINUTES * 60_000) {
    await s.clear();
    return null;
  }
  if (d.login !== process.env["NEUROCARE_ADMIN_LOGIN_ID"]) return null;
  return { login: d.login };
}

export async function requireAdmin(userId: string) {
  const a = await readValidAdmin(userId);
  if (!a) throw new Error("Admins Access sign-in required.");
  return a;
}

const enc = new TextEncoder();
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function sha256(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Hash format: pbkdf2-sha256$<iterations>$<saltB64>$<hashB64> */
export async function verifyAdminCredentials(loginId: string, password: string) {
  const expectedLogin = process.env["NEUROCARE_ADMIN_LOGIN_ID"];
  const stored = process.env["NEUROCARE_ADMIN_PASSWORD_HASH"];
  if (!expectedLogin || !stored) throw new Error("Admins Access is not configured on the server.");
  const [scheme, iter, salt, hash] = stored.split("$");
  if (scheme !== "pbkdf2-sha256" || !iter || !salt || !hash)
    throw new Error("Admins Access is not configured on the server.");
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: b64(salt), iterations: Number(iter) },
      key,
      256,
    ),
  );
  const loginOk = equalBytes(
    await sha256(loginId.trim().toLowerCase()),
    await sha256(expectedLogin.toLowerCase()),
  );
  const passOk = equalBytes(bits, b64(hash));
  return loginOk && passOk;
}

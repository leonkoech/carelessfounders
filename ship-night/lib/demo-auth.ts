export const DEMO_EMAIL = "demo@loop.app";
export const DEMO_PASSWORD = "loopdemo";

const AUTH_KEY = "loop-demo-auth";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function signIn(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === DEMO_EMAIL &&
    password === DEMO_PASSWORD;
  if (ok) {
    sessionStorage.setItem(AUTH_KEY, "true");
  }
  return ok;
}

export function signOut(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  isAdmin?: boolean;
}

function sessionPassword(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET fehlt oder ist kürzer als 32 Zeichen.');
  }
  return secret;
}

function options(): SessionOptions {
  return {
    password: sessionPassword(),
    cookieName: 'wmtipper_session',
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, options());
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD ist nicht gesetzt.');
  // Konstante-Zeit-Vergleich wäre hier ideal; für ein Familien-Tool genügt der direkte Vergleich.
  return input === expected;
}

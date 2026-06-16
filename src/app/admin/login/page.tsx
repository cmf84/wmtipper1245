import { isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { login } from '../actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdmin()) redirect('/admin');
  const { error } = await searchParams;

  return (
    <div className="card mx-auto max-w-sm p-6">
      <h2 className="mb-4 text-lg font-semibold">Admin-Anmeldung</h2>
      <form action={login} className="space-y-3">
        <input
          type="password"
          name="password"
          placeholder="Passwort"
          autoFocus
          required
          className="input w-full"
        />
        {error && <p className="text-sm text-red-300">Falsches Passwort.</p>}
        <button type="submit" className="btn-gold w-full">
          Anmelden
        </button>
      </form>
    </div>
  );
}

import { ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function AccessDeniedPage() {
  const [searchParams] = useSearchParams();
  const discordUserId = searchParams.get('discordUserId');
  const username = searchParams.get('username');
  const reason = searchParams.get('reason');

  return (
    <main className="auth-screen">
      <section className="auth-panel glass-card">
        <div className="brand-mark auth-mark"><ShieldAlert size={24} /></div>
        <p className="eyebrow">Access not authorised</p>
        <h1>Roster match required</h1>
        <p>
          This Discord account is not linked to an active EMS roster member. Ask an administrator to confirm your roster entry and Discord user ID.
        </p>
        {discordUserId ? (
          <div className="status-note blue-note">
            Discord returned user ID <strong>{discordUserId}</strong>{username ? ` for ${username}` : ''}. {reason === 'lookup'
              ? 'The Supabase lookup failed, so check the Worker service-role secret and redeploy it.'
              : 'Add this exact ID to the linked roster member in Supabase.'}
          </div>
        ) : null}
      </section>
    </main>
  );
}

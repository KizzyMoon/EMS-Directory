import { ShieldAlert } from 'lucide-react';

export function AccessDeniedPage() {
  return (
    <main className="auth-screen">
      <section className="auth-panel glass-card">
        <div className="brand-mark auth-mark"><ShieldAlert size={24} /></div>
        <p className="eyebrow">Access not authorised</p>
        <h1>Roster match required</h1>
        <p>
          This Discord account is not linked to an active EMS roster member. Ask an administrator to confirm your roster entry and Discord user ID.
        </p>
      </section>
    </main>
  );
}

import { ShieldCheck } from 'lucide-react';
import { isBackendConfigured } from '../config/env';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { loginUrl, error } = useAuth();

  return (
    <main className="auth-screen">
      <section className="auth-panel glass-card">
        <div className="brand-mark auth-mark"><ShieldCheck size={24} /></div>
        <p className="eyebrow">Secure EMS access</p>
        <h1>Sign in with Discord</h1>
        <p>
          EMS Directory checks your Discord account against the active roster before any protected information is returned.
        </p>
        {isBackendConfigured ? (
          <a className="primary-button auth-button" href={loginUrl}>Continue with Discord</a>
        ) : (
          <div className="status-note amber-note">
            Backend setup mode is active. Configure the Cloudflare Worker URL before using live Discord login.
          </div>
        )}
        {error ? <div className="status-note red-note">{error}</div> : null}
      </section>
    </main>
  );
}

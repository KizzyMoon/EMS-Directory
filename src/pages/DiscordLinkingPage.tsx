import { Save, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

export function DiscordLinkingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Discord ID linking"
        description="Use this while the roster is being completed manually. Store Discord user IDs, not usernames."
      />

      <section className="glass-card form-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Manual roster match</p>
            <h2>Link a Discord account</h2>
          </div>
          <ShieldCheck size={18} />
        </div>

        <div className="form-grid">
          <label>
            <span>Member callsign or employee number</span>
            <input className="field" type="text" placeholder="M7-01" />
          </label>
          <label>
            <span>Discord user ID</span>
            <input className="field" type="text" inputMode="numeric" placeholder="123456789012345678" />
          </label>
          <label>
            <span>Display note</span>
            <input className="field" type="text" placeholder="Verified in Discord by senior staff" />
          </label>
        </div>

        <div className="status-note blue-note">
          When the backend is connected, this form should write to `discord_accounts`, update the linked member, and create an audit log entry. It should reject duplicate Discord IDs.
        </div>

        <button className="primary-button" type="button"><Save size={16} /> Save link</button>
      </section>
    </>
  );
}

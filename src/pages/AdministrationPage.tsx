import { CalendarDays, ExternalLink, Link2, RefreshCw, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { apiRequest } from '../lib/api';

interface HealthStatus {
  ok: boolean;
  version: string;
  sources: {
    roster: { ok: boolean; count: number };
    training: { ok: boolean; count: number };
  };
}

export function AdministrationPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHealth(await apiRequest<HealthStatus>('/api/health'));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to check source status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <>
      <PageHeader eyebrow="System" title="Administration" description="Live source status and working administration tools." actions={<button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'spin-icon' : ''} size={16} /> Refresh</button>} />

      {error ? <div className="status-note red-note">{error}</div> : null}

      <section className="training-summary">
        <div><Users size={18} /><strong>{health?.sources.roster.count ?? '—'}</strong><span>Roster members</span><StatusBadge tone={health?.sources.roster.ok ? 'green' : 'red'}>{health?.sources.roster.ok ? 'Live' : 'Unavailable'}</StatusBadge></div>
        <div><CalendarDays size={18} /><strong>{health?.sources.training.count ?? '—'}</strong><span>Training sessions</span><StatusBadge tone={health?.sources.training.ok ? 'green' : 'red'}>{health?.sources.training.ok ? 'Live' : 'Unavailable'}</StatusBadge></div>
      </section>

      <section className="resource-grid admin-tool-grid">
        <Link className="glass-card resource-card" to="/administration/discord-linking">
          <span className="resource-icon"><Link2 size={20} /></span>
          <span><strong>Discord ID linking</strong><small>Connect verified Discord user IDs to real roster members.</small></span>
          <ExternalLink size={16} />
        </Link>
        <a className="glass-card resource-card" href="https://docs.google.com/spreadsheets/d/1b9RV4HZh2Klex6jEq8YarlpzpDMt0F4ohV_GscHbSb8/edit#gid=647224122" target="_blank" rel="noreferrer">
          <span className="resource-icon"><Users size={20} /></span>
          <span><strong>Main EMS roster</strong><small>Manage roster details in the current authoritative Google Sheet.</small></span>
          <ExternalLink size={16} />
        </a>
        <a className="glass-card resource-card" href="https://docs.google.com/spreadsheets/d/1twcPjyyf3tuwq4L12OhmLz6QkF9_u8I5ai5qn9wAisg/edit" target="_blank" rel="noreferrer">
          <span className="resource-icon"><CalendarDays size={20} /></span>
          <span><strong>Training Attendance Sheet</strong><small>Manage current sessions, bookings, FTOs and attendance.</small></span>
          <ExternalLink size={16} />
        </a>
      </section>
    </>
  );
}

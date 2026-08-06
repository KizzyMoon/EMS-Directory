import { ArrowRight, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { CreateSessionDrawer } from '../components/CreateSessionDrawer';
import { TrainingNav } from '../components/TrainingNav';
import { mockTrainingSessions } from '../data/mockTrainingSessions';
import type { TrainingStatus, TrainingType } from '../types';
import { formatTrainingDate, getSessionCounts, sessionTone } from '../utils';

export function TrainingSessionsPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TrainingType | 'All types'>('All types');
  const [status, setStatus] = useState<TrainingStatus | 'All statuses'>('All statuses');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sessions = useMemo(() => mockTrainingSessions.filter((session) => {
    const text = `${session.title} ${session.location} ${session.server}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase()))
      && (type === 'All types' || session.type === type)
      && (status === 'All statuses' || session.status === status);
  }), [query, status, type]);

  return (
    <>
      <PageHeader
        eyebrow="Training module"
        title="Sessions"
        description="View upcoming and previous organised training sessions."
        actions={<button className="primary-button" onClick={() => setDrawerOpen(true)}><Plus size={16} /> New session</button>}
      />
      <TrainingNav />

      <section className="glass-card training-toolbar">
        <label className="training-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sessions…" /></label>
        <select value={type} onChange={(e) => setType(e.target.value as TrainingType | 'All types')}>
          <option>All types</option><option>Day 1</option><option>Day 2</option><option>Other Training</option><option>Probationer Test</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as TrainingStatus | 'All statuses')}>
          <option>All statuses</option><option>Draft</option><option>Open</option><option>Full</option><option>Completed</option><option>Cancelled</option>
        </select>
      </section>

      <section className="glass-card training-table-card">
        <div className="training-table training-table-head">
          <span>Type</span><span>Date</span><span>Time</span><span>FTOs</span><span>Cadets</span><span>Server</span><span>Status</span><span />
        </div>
        {sessions.map((session) => {
          const counts = getSessionCounts(session);
          return (
            <Link className="training-table training-table-row" to={`/training/sessions/${session.id}`} key={session.id}>
              <strong>{session.type}</strong>
              <span>{formatTrainingDate(session.date)}</span>
              <span>{session.startTime}</span>
              <span>{counts.ftos}/{session.ftoCapacity}</span>
              <span>{counts.cadets}/{session.cadetCapacity}</span>
              <span>{session.server}</span>
              <StatusBadge tone={sessionTone(session.status)}>{session.status}</StatusBadge>
              <ArrowRight size={16} />
            </Link>
          );
        })}
      </section>

      <CreateSessionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

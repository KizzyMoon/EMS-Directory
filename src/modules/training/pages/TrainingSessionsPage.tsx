import { ArrowRight, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { TrainingNav } from '../components/TrainingNav';
import { useTrainingSessions } from '../hooks/useTrainingSessions';
import type { TrainingStatus, TrainingType } from '../types';
import { formatTrainingDate, getSessionCounts, sessionTone } from '../utils';

export function TrainingSessionsPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<TrainingType | 'All types'>('All types');
  const [status, setStatus] = useState<TrainingStatus | 'All statuses'>('All statuses');
  const { sessions: records, loading, error, reload } = useTrainingSessions();

  const sessions = useMemo(() => records.filter((session) => {
    const text = `${session.title} ${session.location} ${session.server}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase()))
      && (type === 'All types' || session.type === type)
      && (status === 'All statuses' || session.status === status);
  }), [query, records, status, type]);

  return (
    <>
      <PageHeader
        eyebrow="Training module"
        title="Sessions"
        description="View upcoming and previous organised training sessions."
        actions={<a className="primary-button" href="https://docs.google.com/spreadsheets/d/1twcPjyyf3tuwq4L12OhmLz6QkF9_u8I5ai5qn9wAisg/edit" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open training sheet</a>}
      />
      <TrainingNav />

      <div className="status-note blue-note">Live session dates, bookings and staff are read from the main Google Training Attendance Sheet. Make changes in the sheet while it remains the official source.</div>

      {error ? <div className="status-note red-note"><span>{error}</span><button className="secondary-button compact-button" type="button" onClick={() => void reload()}><RefreshCw size={15} /> Try again</button></div> : null}

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
        {loading ? <div className="roster-loading"><RefreshCw className="spin-icon" size={18} /> Loading sessions…</div> : null}
        {!loading && sessions.map((session) => {
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
        {!loading && !sessions.length ? <div className="roster-empty"><strong>No training sessions found</strong><span>Create a session or change the filters.</span></div> : null}
      </section>
    </>
  );
}

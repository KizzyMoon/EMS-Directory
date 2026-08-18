import { FileCheck2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { TrainingNav } from '../components/TrainingNav';
import { useTrainingSessions } from '../hooks/useTrainingSessions';
import { formatTrainingDate } from '../utils';

export function TrainingRecordsPage() {
  const { sessions, loading, error, reload } = useTrainingSessions();
  const completed = sessions.filter((session) => session.status === 'Completed');

  return (
    <>
      <PageHeader eyebrow="Training module" title="Training Records" description="Completed session records and outcomes." />
      <TrainingNav />
      {error ? <div className="status-note red-note"><span>{error}</span><button className="secondary-button compact-button" type="button" onClick={() => void reload()}><RefreshCw size={15} /> Try again</button></div> : null}
      <section className="glass-card records-list">
        {loading ? <div className="roster-loading"><RefreshCw className="spin-icon" size={18} /> Loading records…</div> : null}
        {completed.map((session) => (
          <article key={session.id}>
            <FileCheck2 size={18} />
            <div><strong>{session.title}</strong><span>{formatTrainingDate(session.date)} · {session.server}</span></div>
            <StatusBadge tone="green">Completed</StatusBadge>
            <Link className="secondary-button compact-button" to={`/training/sessions/${session.id}`}>Open record</Link>
          </article>
        ))}
        {!loading && !completed.length ? <p className="muted-text">No completed training records yet.</p> : null}
      </section>
    </>
  );
}

import { FileCheck2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { TrainingNav } from '../components/TrainingNav';
import { mockTrainingSessions } from '../data/mockTrainingSessions';
import { formatTrainingDate } from '../utils';

export function TrainingRecordsPage() {
  const completed = mockTrainingSessions.filter((session) => session.status === 'Completed');

  return (
    <>
      <PageHeader eyebrow="Training module" title="Training Records" description="Completed session records and outcomes." />
      <TrainingNav />
      <section className="glass-card records-list">
        {completed.map((session) => (
          <article key={session.id}>
            <FileCheck2 size={18} />
            <div><strong>{session.title}</strong><span>{formatTrainingDate(session.date)} · {session.server}</span></div>
            <StatusBadge tone="green">Completed</StatusBadge>
            <button className="secondary-button compact-button">Open record</button>
          </article>
        ))}
        {!completed.length ? <p className="muted-text">No completed training records yet.</p> : null}
      </section>
    </>
  );
}

import { ArrowLeft, CalendarClock, ClipboardCheck, MapPin, Server, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { TrainingNav } from '../components/TrainingNav';
import { mockTrainingSessions } from '../data/mockTrainingSessions';
import { formatTrainingDate, getSessionCounts, sessionTone } from '../utils';

export function TrainingSessionDetailPage() {
  const { sessionId } = useParams();
  const session = mockTrainingSessions.find((item) => item.id === sessionId);

  if (!session) return <section className="glass-card empty-state"><h1>Session not found</h1><Link to="/training/sessions">Return to sessions</Link></section>;

  const counts = getSessionCounts(session);
  const ftos = session.signups.filter((signup) => signup.role === 'FTO');
  const cadets = session.signups.filter((signup) => signup.role === 'Cadet');
  const waiting = session.signups.filter((signup) => signup.status === 'Waiting List');

  return (
    <>
      <PageHeader
        eyebrow={session.type}
        title={session.title}
        description={`${formatTrainingDate(session.date)} · ${session.startTime}–${session.endTime}`}
        actions={<Link className="secondary-button inline-button" to="/training/sessions"><ArrowLeft size={16} /> Back</Link>}
      />
      <TrainingNav />

      <section className="training-detail-strip">
        <div><CalendarClock size={17} /><span>Date & time</span><strong>{formatTrainingDate(session.date)} · {session.startTime}</strong></div>
        <div><MapPin size={17} /><span>Location</span><strong>{session.location}</strong></div>
        <div><Server size={17} /><span>Server</span><strong>{session.server}</strong></div>
        <div><ClipboardCheck size={17} /><span>Status</span><StatusBadge tone={sessionTone(session.status)}>{session.status}</StatusBadge></div>
      </section>

      <div className="training-detail-grid">
        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Training staff</p><h2>FTOs</h2></div><span className="count-chip">{counts.ftos}/{session.ftoCapacity}</span></div>
          <div className="attendee-list">
            {ftos.map((person) => <div key={person.id}><span className="mono-value">{person.callsign}</span><strong>{person.memberName}</strong><StatusBadge tone="blue">{person.status}</StatusBadge></div>)}
            {!ftos.length ? <p className="muted-text">No FTOs have signed up.</p> : null}
          </div>
          <button className="secondary-button full-width-button">Volunteer as FTO</button>
        </section>

        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Attendees</p><h2>Cadets</h2></div><span className="count-chip">{counts.cadets}/{session.cadetCapacity}</span></div>
          <div className="attendee-list">
            {cadets.map((person) => <div key={person.id}><span className="mono-value">{person.callsign}</span><strong>{person.memberName}</strong><StatusBadge tone="pink">{person.status}</StatusBadge></div>)}
            {!cadets.length ? <p className="muted-text">No cadets have signed up.</p> : null}
          </div>
          <button className="primary-button full-width-button">Sign up</button>
        </section>

        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Queue</p><h2>Waiting list</h2></div><Users size={18} /></div>
          {waiting.length ? <div className="attendee-list">{waiting.map((person) => <div key={person.id}><strong>{person.memberName}</strong></div>)}</div> : <p className="muted-text">Nobody is waiting for a space.</p>}
        </section>

        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Session</p><h2>Notes</h2></div></div>
          <p>{session.notes}</p>
        </section>

        <section className="glass-card training-detail-wide">
          <div className="panel-header"><div><p className="eyebrow">Record</p><h2>Session timeline</h2></div></div>
          <div className="training-activity-list">
            {session.activity.map((item) => (
              <div key={item.id}><span className="activity-marker" /><div><strong>{item.label}</strong><span>{item.detail}</span></div><time>{item.createdAt}</time></div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

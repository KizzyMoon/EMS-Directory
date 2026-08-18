import { ArrowLeft, CalendarClock, ClipboardCheck, MapPin, RefreshCw, Server, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { getTrainingSession, signupForTrainingSession } from '../../../lib/trainingApi';
import { TrainingNav } from '../components/TrainingNav';
import type { SignupRole, TrainingSession } from '../types';
import { formatTrainingActivityDate, formatTrainingDate, getSessionCounts, sessionTone } from '../utils';

export function TrainingSessionDetailPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<SignupRole | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setLoadError(null);
    try {
      setSession(await getTrainingSession(sessionId));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load this training session.');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const signup = async (role: SignupRole) => {
    if (!sessionId) return;
    setSavingRole(role);
    setActionError(null);
    try {
      setSession(await signupForTrainingSession(sessionId, role));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save the training sign-up.');
    } finally {
      setSavingRole(null);
    }
  };

  if (loading) return <section className="glass-card empty-state"><RefreshCw className="spin-icon" size={20} /><h1>Loading session…</h1></section>;
  if (loadError) return <section className="glass-card empty-state"><h1>Unable to load session</h1><p>{loadError}</p><button className="secondary-button inline-button" type="button" onClick={() => void loadSession()}><RefreshCw size={16} /> Try again</button></section>;

  if (!session) return <section className="glass-card empty-state"><h1>Session not found</h1><Link to="/training/sessions">Return to sessions</Link></section>;

  const counts = getSessionCounts(session);
  const ftos = session.signups.filter((signup) => signup.role === 'FTO');
  const cadets = session.signups.filter((signup) => signup.role === 'Cadet');
  const waiting = session.signups.filter((signup) => signup.status === 'Waiting List');
  const currentSignup = session.signups.find((signup) => signup.memberId === user?.id);

  return (
    <>
      <PageHeader
        eyebrow={session.type}
        title={session.title}
        description={`${formatTrainingDate(session.date)} · ${session.startTime}–${session.endTime}`}
        actions={<Link className="secondary-button inline-button" to="/training/sessions"><ArrowLeft size={16} /> Back</Link>}
      />
      <TrainingNav />

      {actionError ? <div className="status-note red-note">{actionError}</div> : null}

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
          <button className="secondary-button full-width-button" type="button" disabled={Boolean(currentSignup) || savingRole !== null} onClick={() => void signup('FTO')}>
            {currentSignup ? `Signed up as ${currentSignup.role}` : savingRole === 'FTO' ? 'Saving…' : 'Volunteer as FTO'}
          </button>
        </section>

        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Attendees</p><h2>Cadets</h2></div><span className="count-chip">{counts.cadets}/{session.cadetCapacity}</span></div>
          <div className="attendee-list">
            {cadets.map((person) => <div key={person.id}><span className="mono-value">{person.callsign}</span><strong>{person.memberName}</strong><StatusBadge tone="pink">{person.status}</StatusBadge></div>)}
            {!cadets.length ? <p className="muted-text">No cadets have signed up.</p> : null}
          </div>
          <button className="primary-button full-width-button" type="button" disabled={Boolean(currentSignup) || savingRole !== null} onClick={() => void signup('Cadet')}>
            {currentSignup ? `Signed up as ${currentSignup.role}` : savingRole === 'Cadet' ? 'Saving…' : 'Sign up'}
          </button>
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
              <div key={item.id}><span className="activity-marker" /><div><strong>{item.label}</strong><span>{item.detail}</span></div><time>{formatTrainingActivityDate(item.createdAt)}</time></div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

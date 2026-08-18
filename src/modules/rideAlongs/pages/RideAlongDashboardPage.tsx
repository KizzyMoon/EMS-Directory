import { AlertTriangle, ArrowRight, Clock3, FilePenLine, Play, Plus, RefreshCw, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { hasPermission } from '../../../auth/permissions';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { RideAlongNav } from '../components/RideAlongNav';
import { useRideAlongs } from '../hooks/useRideAlongs';
import { feedbackTone, formatDuration, formatRideAlongDate, rideAlongTone } from '../utils';

export function RideAlongDashboardPage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'training.manage');
  const { rideAlongs, availableCadets, loading, error, reload } = useRideAlongs();
  const active = rideAlongs.filter((rideAlong) => rideAlong.status === 'In Progress');
  const drafts = rideAlongs.flatMap((rideAlong) => rideAlong.feedback.filter((feedback) => feedback.status === 'Draft').map((feedback) => ({ feedback, rideAlongId: rideAlong.id })));
  const recent = rideAlongs.filter((rideAlong) => rideAlong.status === 'Completed').slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Training module"
        title="Ride Alongs"
        description="Take out any available cadet, track the session and submit individual feedback."
        actions={canManage ? <Link className="primary-button" to="/ride-alongs/start"><Plus size={16} /> Start ride along</Link> : null}
      />
      <RideAlongNav />

      {error ? <div className="status-note red-note"><span>{error}</span><button className="secondary-button compact-button" type="button" onClick={() => void reload()}><RefreshCw size={15} /> Try again</button></div> : null}

      <section className="ride-summary">
        <div><Users size={18} /><strong>{availableCadets.length}</strong><span>Available cadets</span></div>
        <div><Play size={18} /><strong>{active.length}</strong><span>In progress</span></div>
        <div><FilePenLine size={18} /><strong>{drafts.length}</strong><span>Draft feedback</span></div>
        <div><AlertTriangle size={18} /><strong>{availableCadets.filter((cadet) => cadet.daysRemaining !== null && cadet.daysRemaining <= 10).length}</strong><span>Near deadline</span></div>
      </section>

      <div className="ride-dashboard-grid">
        <section className="glass-card ride-wide-panel">
          <div className="panel-header">
            <div><p className="eyebrow">Shared training pool</p><h2>Available cadets</h2></div>
            <Link className="inline-link text-link" to="/ride-alongs/start">Start one <ArrowRight size={15} /></Link>
          </div>
          <div className="available-cadet-list">
            {availableCadets.map((cadet) => (
              <article key={cadet.id}>
                <span className="mono-value">{cadet.callsign}</span>
                <div><strong>{cadet.name}</strong><span>{cadet.employeeNumber}</span></div>
                <div><span>Current focus</span><strong>{cadet.currentFocus}</strong></div>
                <div><span>Ride alongs</span><strong>{cadet.rideAlongs}</strong></div>
                <div className={cadet.daysRemaining !== null && cadet.daysRemaining <= 10 ? 'deadline-warning' : ''}><Clock3 size={14} /><span>{cadet.daysRemaining === null ? 'No deadline' : `${cadet.daysRemaining} days`}</span></div>
                {canManage ? <Link className="secondary-button compact-button" to={`/ride-alongs/start?cadet=${cadet.id}`}>Select</Link> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Live</p><h2>Active ride alongs</h2></div></div>
          <div className="active-ride-list">
            {active.map((rideAlong) => (
              <Link to={`/ride-alongs/active/${rideAlong.id}`} key={rideAlong.id}>
                <div><strong>{rideAlong.cadets.map((cadet) => cadet.name).join(', ')}</strong><span>FTO: {rideAlong.ftoName}</span></div>
                <StatusBadge tone={rideAlongTone(rideAlong.status)}>{rideAlong.status}</StatusBadge>
              </Link>
            ))}
            {!active.length ? <p className="muted-text">No ride alongs currently in progress.</p> : null}
          </div>
        </section>

        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Your queue</p><h2>Feedback drafts</h2></div></div>
          <div className="feedback-draft-list">
            {drafts.map(({ feedback, rideAlongId }) => (
              <Link to={`/ride-alongs/${rideAlongId}`} key={feedback.id}>
                <div><strong>{feedback.cadetName}</strong><span>{feedback.currentFocus || 'Focus not set'}</span></div>
                <StatusBadge tone={feedbackTone(feedback.status)}>{feedback.status}</StatusBadge>
              </Link>
            ))}
            {!drafts.length ? <p className="muted-text">No unfinished feedback.</p> : null}
          </div>
        </section>

        <section className="glass-card ride-wide-panel">
          <div className="panel-header">
            <div><p className="eyebrow">Recent</p><h2>Completed ride alongs</h2></div>
            <Link className="inline-link text-link" to="/ride-alongs/history">Full history <ArrowRight size={15} /></Link>
          </div>
          <div className="ride-history-list">
            {loading ? <p className="muted-text">Loading ride alongs…</p> : null}
            {recent.map((rideAlong) => (
              <Link to={`/ride-alongs/${rideAlong.id}`} key={rideAlong.id}>
                <div><strong>{rideAlong.cadets.map((cadet) => cadet.name).join(', ')}</strong><span>{formatRideAlongDate(rideAlong.startedAt)}</span></div>
                <span>{rideAlong.ftoName}</span>
                <span>{formatDuration(rideAlong.durationMinutes)}</span>
                <StatusBadge tone={rideAlongTone(rideAlong.status)}>{rideAlong.status}</StatusBadge>
                <ArrowRight size={15} />
              </Link>
            ))}
            {!loading && !recent.length ? <p className="muted-text">No completed ride alongs yet.</p> : null}
          </div>
        </section>
      </div>
    </>
  );
}

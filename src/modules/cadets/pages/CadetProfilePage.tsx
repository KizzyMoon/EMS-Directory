import { ArrowLeft, CalendarClock, Clock3, FileText, LockKeyhole, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { getCadet } from '../../../lib/cadetsApi';
import { feedbackTone, formatDuration, formatRideAlongDate } from '../../rideAlongs/utils';
import { formatTrainingDate, sessionTone } from '../../training/utils';
import { CadetNav } from '../components/CadetNav';
import {
  getCadetFeedback,
  getCadetRideAlongs,
  getCadetStats,
  getCadetTrainingSessions,
  getUpcomingCadetSession,
} from '../selectors';
import type { CadetRecord } from '../types';
import { cadetStageTone, daysRemaining, formatCadetDate } from '../utils';

export function CadetProfilePage() {
  const { cadetId } = useParams();
  const [cadet, setCadet] = useState<CadetRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCadet = useCallback(async () => {
    if (!cadetId) return;
    setLoading(true);
    setLoadError(null);
    try {
      setCadet(await getCadet(cadetId));
    } catch (error) {
      setCadet(null);
      setLoadError(error instanceof Error ? error.message : 'Unable to load this cadet record.');
    } finally {
      setLoading(false);
    }
  }, [cadetId]);

  useEffect(() => {
    void loadCadet();
  }, [loadCadet]);

  if (loading) {
    return <section className="glass-card empty-state"><RefreshCw className="spin-icon" size={20} /><h1>Loading cadet…</h1></section>;
  }

  if (loadError) {
    return <section className="glass-card empty-state"><h1>Unable to load cadet</h1><p>{loadError}</p><button className="secondary-button inline-button" type="button" onClick={() => void loadCadet()}><RefreshCw size={16} /> Try again</button></section>;
  }

  if (!cadet) {
    return <section className="glass-card empty-state"><h1>Cadet not found</h1><Link to="/cadets">Return to cadets</Link></section>;
  }

  const stats = getCadetStats(cadet);
  const rideAlongs = getCadetRideAlongs(cadet);
  const feedback = getCadetFeedback(cadet);
  const trainingSessions = getCadetTrainingSessions(cadet);
  const upcoming = getUpcomingCadetSession(cadet);
  const remaining = daysRemaining(cadet.deadline);

  return (
    <>
      <PageHeader
        eyebrow="Cadet record"
        title={cadet.name}
        description={`${cadet.callsign} · ${cadet.employeeNumber}`}
        actions={<Link className="secondary-button" to="/cadets"><ArrowLeft size={16} /> Back</Link>}
      />
      <CadetNav />

      <section className="cadet-profile-header">
        <div><span>Stage</span><StatusBadge tone={cadetStageTone(cadet.stage)}>{cadet.stage}</StatusBadge></div>
        <div><span>Started</span><strong>{formatCadetDate(cadet.startDate)}</strong></div>
        <div><span>Deadline</span><strong>{formatCadetDate(cadet.deadline)}</strong></div>
        <div><span>Days remaining</span><strong className={remaining !== null && remaining <= 10 ? 'deadline-text' : ''}>{remaining ?? 'Not set'}</strong></div>
      </section>

      <section className="cadet-progress-strip">
        <div className={cadet.dayOneComplete ? 'complete' : ''}><span>Day 1</span><strong>{cadet.dayOneComplete ? 'Complete' : cadet.stage === 'Day 1 Signed Up' ? 'Signed up' : 'Not complete'}</strong></div>
        <div><span>Ride Alongs</span><strong>{stats.rideAlongCount}</strong></div>
        <div><span>Unique FTOs</span><strong>{stats.uniqueFtoCount}</strong></div>
        <div className={cadet.stage === 'Ready for Day 2' || cadet.stage === 'Day 2 Booked' ? 'complete' : ''}><span>Day 2</span><strong>{cadet.stage === 'Day 2 Booked' ? 'Booked' : cadet.stage === 'Ready for Day 2' ? 'Ready' : 'Not ready'}</strong></div>
      </section>

      <nav className="member-tabs cadet-tabs" aria-label="Cadet profile sections">
        <a className="member-tab active" href="#overview">Overview</a>
        <a className="member-tab" href="#training">Training</a>
        <a className="member-tab" href="#ride-alongs">Ride Alongs</a>
        <a className="member-tab" href="#feedback">Feedback</a>
        <a className="member-tab" href="#internal">Internal Notes</a>
      </nav>

      <div className="cadet-profile-grid">
        <section className="glass-card" id="overview">
          <div className="panel-header"><div><p className="eyebrow">Current</p><h2>Overview</h2></div></div>
          <dl className="detail-list">
            <div><dt>Current focus</dt><dd>{stats.currentFocus}</dd></div>
            <div><dt>Next step</dt><dd>{cadet.nextStep}</dd></div>
            <div><dt>Upcoming training</dt><dd>{upcoming ? `${upcoming.title} · ${formatTrainingDate(upcoming.date)} ${upcoming.startTime}` : 'No upcoming session'}</dd></div>
            <div><dt>Latest feedback</dt><dd>{stats.latestFeedback?.generalFeedback || 'No submitted feedback yet'}</dd></div>
          </dl>
        </section>

        <section className="glass-card" id="training">
          <div className="panel-header"><div><p className="eyebrow">Organised sessions</p><h2>Training</h2></div><CalendarClock size={18} /></div>
          <div className="cadet-record-list">
            {trainingSessions.map((session) => (
              <Link to={`/training/sessions/${session.id}`} key={session.id}>
                <div><strong>{session.title}</strong><span>{formatTrainingDate(session.date)} · {session.startTime}</span></div>
                <StatusBadge tone={sessionTone(session.status)}>{session.status}</StatusBadge>
              </Link>
            ))}
            {!trainingSessions.length ? <p className="muted-text">No organised training records.</p> : null}
          </div>
        </section>

        <section className="glass-card cadet-wide-panel" id="ride-alongs">
          <div className="panel-header"><div><p className="eyebrow">Practical training</p><h2>Ride Alongs</h2></div><Clock3 size={18} /></div>
          <div className="cadet-ride-list">
            {rideAlongs.map((rideAlong) => {
              const cadetEntry = rideAlong.cadets.find((item) => item.memberId === cadet.memberId);
              return (
                <Link to={`/ride-alongs/${rideAlong.id}`} key={rideAlong.id}>
                  <span>{formatRideAlongDate(rideAlong.startedAt)}</span>
                  <strong>{rideAlong.ftoName}</strong>
                  <span>{formatDuration(rideAlong.durationMinutes)}</span>
                  <StatusBadge tone={feedbackTone(cadetEntry?.feedbackStatus ?? 'Not Started')}>{cadetEntry?.feedbackStatus ?? 'Not Started'}</StatusBadge>
                </Link>
              );
            })}
            {!rideAlongs.length ? <p className="muted-text">No ride alongs recorded.</p> : null}
          </div>
        </section>

        <section className="glass-card cadet-wide-panel" id="feedback">
          <div className="panel-header"><div><p className="eyebrow">Cadet-visible</p><h2>Feedback</h2></div><FileText size={18} /></div>
          <div className="cadet-feedback-list">
            {feedback.map((item) => (
              <article key={item.id}>
                <div><span>Strengths</span><p>{item.strengths || 'Not recorded'}</p></div>
                <div><span>Areas to improve</span><p>{item.areasToImprove || 'Not recorded'}</p></div>
                <div><span>Current focus</span><p>{item.currentFocus || 'Not recorded'}</p></div>
                <div className="feedback-general"><span>General feedback</span><p>{item.generalFeedback || 'Not recorded'}</p></div>
              </article>
            ))}
            {!feedback.length ? <p className="muted-text">No submitted feedback yet.</p> : null}
          </div>
        </section>

        <section className="glass-card cadet-wide-panel restricted-card" id="internal">
          <div className="panel-header"><div><p className="eyebrow">FTO and above only</p><h2>Internal Information</h2></div><LockKeyhole size={18} /></div>
          <div className="internal-feedback-list">
            {feedback.map((item) => (
              <article key={item.id}>
                <div><span>Concerns</span><p>{item.concerns || 'None recorded'}</p></div>
                <div><span>Internal notes</span><p>{item.internalNotes || 'None recorded'}</p></div>
                <div><span>Recommended next step</span><p>{item.recommendedNextStep}</p></div>
              </article>
            ))}
            {!feedback.length ? <p className="muted-text">No internal feedback records.</p> : null}
          </div>
        </section>
      </div>
    </>
  );
}

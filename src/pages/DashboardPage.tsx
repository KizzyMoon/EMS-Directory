import {
  ArrowRight,
  CalendarClock,
  Clock3,
  ClipboardCheck,
  ExternalLink,
  Megaphone,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../auth/permissions';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { getCadets } from '../lib/cadetsApi';
import { cadetStageTone, daysRemaining } from '../modules/cadets/utils';
import type { CadetRecord } from '../modules/cadets/types';
import { useTrainingSessions } from '../modules/training/hooks/useTrainingSessions';
import { formatTrainingDate, getSessionCounts, sessionTone } from '../modules/training/utils';

const TRAINING_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1twcPjyyf3tuwq4L12OhmLz6QkF9_u8I5ai5qn9wAisg/edit';

export function DashboardPage() {
  const { user } = useAuth();
  const canReadCadets = hasPermission(user, 'cadets.read');
  const canReadTraining = hasPermission(user, 'training.read');
  const { sessions, loading: sessionsLoading, error: sessionsError } = useTrainingSessions(canReadTraining);
  const [cadets, setCadets] = useState<CadetRecord[]>([]);
  const [cadetsLoading, setCadetsLoading] = useState(canReadCadets);

  const loadCadets = useCallback(async () => {
    if (!canReadCadets) return;
    setCadetsLoading(true);
    try {
      setCadets(await getCadets());
    } catch {
      setCadets([]);
    } finally {
      setCadetsLoading(false);
    }
  }, [canReadCadets]);

  useEffect(() => {
    void loadCadets();
  }, [loadCadets]);

  const awaitingDayOne = cadets.filter((cadet) => cadet.stage === 'Awaiting Day 1');
  const awaitingDayTwo = cadets.filter((cadet) => cadet.stage === 'Day 2 Booked');
  const rideAlongReady = cadets.filter((cadet) => cadet.stage === 'Available for Ride Alongs');
  const today = new Date().toISOString().slice(0, 10);
  const upcomingSessions = sessions
    .filter((session) => session.date >= today && (session.status === 'Open' || session.status === 'Full'))
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  const sessionsNeedingFtos = upcomingSessions.filter((session) => {
    const counts = getSessionCounts(session);
    return counts.ftos < session.ftoCapacity;
  });
  const attendanceToRecord = sessions.filter((session) =>
    session.date < today
    && session.status !== 'Completed'
    && session.status !== 'Cancelled'
    && session.signups.length > 0,
  );
  const actionCount = sessionsNeedingFtos.length + attendanceToRecord.length;

  return (
    <>
      <PageHeader
        title="Operations Board"
        description="Live training status and the actions waiting on your rank today."
      />

      <section className="action-strip" aria-label="Department overview">
        <div className="action-stat">
          <div><strong>{canReadCadets ? cadets.length : '—'}</strong><span>Active cadets</span></div>
        </div>
        <div className="action-stat">
          <div><strong>{canReadCadets ? rideAlongReady.length : '—'}</strong><span>Ride-along ready</span></div>
        </div>
        <div className="action-stat">
          <div><strong>{canReadCadets ? awaitingDayOne.length : '—'}</strong><span>Awaiting Day 1</span></div>
        </div>
        <div className="action-stat">
          <div><strong>{canReadCadets ? awaitingDayTwo.length : '—'}</strong><span>Awaiting Day 2</span></div>
        </div>
        <div className="action-stat">
          <div><strong>{canReadTraining ? upcomingSessions.length : '—'}</strong><span>Upcoming sessions</span></div>
        </div>
      </section>

      <section className="glass-card priority-panel">
        <div className="priority-header">
          <span className="priority-marker" />
          <div>
            <p className="eyebrow">Needs Attention</p>
            <h2>Action Before End of Shift</h2>
          </div>
        </div>
        <div className="priority-list">
          {sessionsNeedingFtos.slice(0, 3).map((session) => {
            const counts = getSessionCounts(session);
            const spaces = session.ftoCapacity - counts.ftos;
            return (
            <article className="priority-row priority-amber" key={session.id}>
              <div>
                <strong>{session.title} needs {spaces} FTO{spaces === 1 ? '' : 's'}</strong>
                <span>{formatTrainingDate(session.date)}, {session.startTime} · {counts.ftos} of {session.ftoCapacity} FTO slots filled</span>
              </div>
              {session.source === 'Google Sheets' ? (
                <a className="secondary-button compact-button" href={TRAINING_SHEET_URL} target="_blank" rel="noreferrer">Open sheet <ExternalLink size={14} /></a>
              ) : (
                <Link className="secondary-button compact-button" to={`/training/sessions/${session.id}`}>View session</Link>
              )}
            </article>
            );
          })}
          {attendanceToRecord.slice(0, Math.max(0, 3 - sessionsNeedingFtos.length)).map((session) => (
            <article className="priority-row priority-red" key={session.id}>
              <div><strong>Attendance is outstanding for {session.title}</strong><span>{formatTrainingDate(session.date)} · {session.signups.length} sign-ups</span></div>
              {session.source === 'Google Sheets' ? (
                <a className="primary-button compact-button" href={TRAINING_SHEET_URL} target="_blank" rel="noreferrer">Update sheet <ExternalLink size={14} /></a>
              ) : (
                <Link className="primary-button compact-button" to={`/training/sessions/${session.id}`}>Record attendance</Link>
              )}
            </article>
          ))}
          {!sessionsLoading && canReadTraining && !actionCount ? <p className="muted-text">No training actions need attention.</p> : null}
          {sessionsLoading ? <p className="muted-text">Checking training actions…</p> : null}
          {sessionsError ? <p className="muted-text">Training actions could not be loaded.</p> : null}
          {!canReadTraining ? <p className="muted-text">Training actions are restricted for your rank.</p> : null}
        </div>
      </section>

      <div className="dashboard-workspace">
        <section className="glass-card dashboard-panel training-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Today & next up</p>
              <h2>Training schedule</h2>
            </div>
            <Link className="text-link inline-link" to="/training">Open calendar <ArrowRight size={15} /></Link>
          </div>
          <div className="session-list">
            {upcomingSessions.slice(0, 4).map((session) => {
              const counts = getSessionCounts(session);
              const ftoSpaces = Math.max(0, session.ftoCapacity - counts.ftos);
              const cadetSpaces = Math.max(0, session.cadetCapacity - counts.cadets);
              return (
              <article className="session-row" key={session.id}>
                <div className="session-date">
                  <CalendarClock size={18} />
                  <div><strong>{formatTrainingDate(session.date)}</strong><span>{session.startTime}</span></div>
                </div>
                <div className="session-main">
                  <strong>{session.title}</strong>
                  <span>{ftoSpaces} FTO · {cadetSpaces} cadet spaces available</span>
                </div>
                <StatusBadge tone={sessionTone(session.status)}>{session.status}</StatusBadge>
                <Link className="secondary-button compact-button" to={`/training/sessions/${session.id}`}>View</Link>
              </article>
              );
            })}
            {!sessionsLoading && canReadTraining && !upcomingSessions.length ? <p className="muted-text">No upcoming training sessions.</p> : null}
            {sessionsLoading ? <p className="muted-text">Loading training schedule…</p> : null}
            {!canReadTraining ? <p className="muted-text">Training information is restricted for your rank.</p> : null}
          </div>
        </section>

        <section className="glass-card dashboard-panel task-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Your queue</p>
              <h2>To Do List</h2>
            </div>
            <span className="count-chip">{actionCount} open</span>
          </div>
          <div className="task-list">
            {attendanceToRecord.slice(0, 2).map((session) => {
              const content = (
                <>
                <ClipboardCheck size={18} />
                <span><strong>{session.source === 'Google Sheets' ? 'Update' : 'Record'} {session.title} attendance</strong><small>{formatTrainingDate(session.date)}</small></span>
                </>
              );
              return session.source === 'Google Sheets'
                ? <a className="task-item" href={TRAINING_SHEET_URL} target="_blank" rel="noreferrer" key={session.id}>{content}</a>
                : <Link className="task-item" to={`/training/sessions/${session.id}`} key={session.id}>{content}</Link>;
            })}
            {sessionsNeedingFtos.slice(0, Math.max(0, 2 - attendanceToRecord.length)).map((session) => {
              const content = (
                <>
                <CalendarClock size={18} />
                <span><strong>Fill FTO spaces for {session.title}</strong><small>{formatTrainingDate(session.date)}</small></span>
                </>
              );
              return session.source === 'Google Sheets'
                ? <a className="task-item" href={TRAINING_SHEET_URL} target="_blank" rel="noreferrer" key={session.id}>{content}</a>
                : <Link className="task-item" to={`/training/sessions/${session.id}`} key={session.id}>{content}</Link>;
            })}
            {!sessionsLoading && canReadTraining && !actionCount ? <p className="muted-text">Your training queue is clear.</p> : null}
            {!canReadTraining ? <p className="muted-text">No training queue is available for your rank.</p> : null}
          </div>
        </section>

        <section className="glass-card dashboard-panel cadet-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">FTO work queue</p>
              <h2>Cadets requiring attention</h2>
            </div>
            <Link className="text-link inline-link" to="/cadets">View all <ArrowRight size={15} /></Link>
          </div>
          <div className="cadet-queue">
            {cadets.map((cadet) => {
              const remaining = daysRemaining(cadet.deadline);
              return (
                <Link className="cadet-row cadet-row-no-avatar" to={`/cadets/${cadet.id}`} key={cadet.id}>
                  <div className="cadet-main"><strong>{cadet.name}</strong><span>{cadet.employeeNumber}</span></div>
                  <div className="cadet-meta"><Clock3 size={14} /><span>{remaining === null ? 'Deadline not set' : `${remaining} days remaining`}</span></div>
                  <StatusBadge tone={cadetStageTone(cadet.stage)}>{cadet.stage}</StatusBadge>
                  <ArrowRight size={16} className="row-arrow" />
                </Link>
              );
            })}
            {cadetsLoading ? <p className="muted-text">Loading cadets…</p> : null}
            {!cadetsLoading && canReadCadets && !cadets.length ? <p className="muted-text">No cadets require attention.</p> : null}
            {!canReadCadets ? <p className="muted-text">Cadet information is restricted for your rank.</p> : null}
          </div>
        </section>

        <section className="glass-card dashboard-panel announcement-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Department</p>
              <h2>Operational guidance</h2>
            </div>
            <Megaphone size={18} />
          </div>
          <article className="announcement-item">
            <div className="announcement-icon"><Megaphone size={18} /></div>
            <div><strong>Keep records current</strong><p>Record attendance and ride-along feedback promptly so cadet progress remains accurate.</p></div>
          </article>
        </section>
      </div>
    </>
  );
}

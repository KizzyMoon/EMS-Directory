import { AlertTriangle, ArrowRight, CalendarClock, ClipboardCheck, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { CreateSessionDrawer } from '../components/CreateSessionDrawer';
import { TrainingNav } from '../components/TrainingNav';
import { mockTrainingSessions } from '../data/mockTrainingSessions';
import { formatTrainingDate, getSessionCounts, sessionTone } from '../utils';

export function TrainingDashboardPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const upcoming = mockTrainingSessions.filter((session) => session.status === 'Open' || session.status === 'Full');
  const attendanceRequired = mockTrainingSessions.filter(
    (session) => session.attendance.some((item) => item.status === 'Pending') && session.status === 'Completed',
  );

  return (
    <>
      <PageHeader
        eyebrow="Training module"
        title="Training Management"
        description="Sessions, sign-ups, attendance and training records in one place."
        actions={<button className="primary-button" onClick={() => setDrawerOpen(true)}><Plus size={16} /> New session</button>}
      />
      <TrainingNav />

      <section className="training-summary">
        <div><CalendarClock size={18} /><strong>{upcoming.length}</strong><span>Upcoming sessions</span></div>
        <div><Users size={18} /><strong>{upcoming.reduce((total, item) => total + getSessionCounts(item).cadets, 0)}</strong><span>Cadets signed up</span></div>
        <div><ClipboardCheck size={18} /><strong>{upcoming.reduce((total, item) => total + getSessionCounts(item).ftos, 0)}</strong><span>FTO sign-ups</span></div>
        <div><AlertTriangle size={18} /><strong>{attendanceRequired.length}</strong><span>Attendance required</span></div>
      </section>

      <div className="training-dashboard-grid">
        <section className="glass-card training-wide-panel">
          <div className="panel-header">
            <div><p className="eyebrow">Next up</p><h2>Upcoming sessions</h2></div>
            <Link className="inline-link text-link" to="/training/sessions">View all <ArrowRight size={15} /></Link>
          </div>

          <div className="training-session-stack">
            {upcoming.map((session) => {
              const counts = getSessionCounts(session);
              return (
                <Link className="training-session-card" to={`/training/sessions/${session.id}`} key={session.id}>
                  <div className="training-date-block">
                    <strong>{formatTrainingDate(session.date)}</strong>
                    <span>{session.startTime}–{session.endTime}</span>
                  </div>
                  <div className="training-session-main">
                    <strong>{session.title}</strong>
                    <span>{session.server} · {session.location}</span>
                  </div>
                  <div className="training-counts">
                    <span>{counts.cadets}/{session.cadetCapacity} cadets</span>
                    <span>{counts.ftos}/{session.ftoCapacity} FTOs</span>
                  </div>
                  <StatusBadge tone={sessionTone(session.status)}>{session.status}</StatusBadge>
                  <ArrowRight size={16} />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="glass-card">
          <div className="panel-header">
            <div><p className="eyebrow">Attention</p><h2>Outstanding work</h2></div>
          </div>
          <div className="training-action-list">
            <Link to="/training/attendance"><strong>Attendance to review</strong><span>{attendanceRequired.length} session waiting</span></Link>
            <Link to="/training/sessions"><strong>Day 1 needs another FTO</strong><span>8 Aug · 19:00</span></Link>
            <Link to="/training/records"><strong>Training records</strong><span>Review completed sessions</span></Link>
          </div>
        </section>

        <section className="glass-card training-wide-panel">
          <div className="panel-header">
            <div><p className="eyebrow">Recent</p><h2>Training activity</h2></div>
          </div>
          <div className="training-activity-list">
            {mockTrainingSessions.flatMap((session) =>
              session.activity.map((activity) => ({ ...activity, sessionTitle: session.title })),
            ).slice(0, 5).map((activity) => (
              <div key={activity.id}>
                <span className="activity-marker" />
                <div><strong>{activity.label}</strong><span>{activity.sessionTitle} · {activity.detail}</span></div>
                <time>{activity.createdAt}</time>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CreateSessionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

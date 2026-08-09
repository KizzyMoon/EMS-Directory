import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Megaphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { mockCadets } from '../data/mockCadets';

const sessions = [
  { title: 'Day 1 Training', date: '8 August', time: '19:00', note: '1 FTO space available', tone: 'amber' as const },
  { title: 'Day 2 Training', date: '10 August', time: '20:00', note: 'Cadet spaces available', tone: 'green' as const },
];

const urgentActions = [
  {
    title: 'Submit ride-along feedback for Alex Morgan',
    detail: 'Due today - logged 55m session with Kizzy Moon',
    tone: 'red',
    action: 'Submit',
  },
  {
    title: 'Day 1 Training is short one FTO',
    detail: 'Tonight, 19:00 - 2 of 3 FTO slots filled',
    tone: 'amber',
    action: 'Claim slot',
  },
  {
    title: 'Taylor Reed is 6 days from deadline',
    detail: 'M7-203 - Day 2 booked, no ride along logged yet',
    tone: 'red',
    action: 'View cadet',
  },
];

function daysUntil(deadline: string) {
  const today = new Date();
  const due = new Date(deadline);
  return Math.max(0, Math.ceil((due.getTime() - today.getTime()) / 86_400_000));
}

export function DashboardPage() {
  const awaitingDayOne = mockCadets.filter((cadet) => cadet.stage === 'Awaiting Day 1');
  const awaitingDayTwo = mockCadets.filter((cadet) => cadet.stage === 'Day 2 Booked');
  const rideAlongReady = mockCadets.filter((cadet) => cadet.stage === 'Available for Ride Alongs');

  return (
    <>
      <PageHeader
        title="Operations Board"
        description="Live training status and the actions waiting on your rank today."
      />

      <section className="action-strip" aria-label="Department overview">
        <div className="action-stat">
          <div><strong>{mockCadets.length}</strong><span>Active cadets</span></div>
        </div>
        <div className="action-stat">
          <div><strong>{rideAlongReady.length}</strong><span>Ride-along ready</span></div>
        </div>
        <div className="action-stat">
          <div><strong>{awaitingDayOne.length}</strong><span>Awaiting Day 1</span></div>
        </div>
        <div className="action-stat">
          <div><strong>{awaitingDayTwo.length}</strong><span>Awaiting Day 2</span></div>
        </div>
        <div className="action-stat">
          <div><strong>2</strong><span>Upcoming sessions</span></div>
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
          {urgentActions.map((item) => (
            <article className={`priority-row priority-${item.tone}`} key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <button className={item.action === 'Submit' ? 'primary-button compact-button' : 'secondary-button compact-button'} type="button">
                {item.action}
              </button>
            </article>
          ))}
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
            {sessions.map((session) => (
              <article className="session-row" key={session.title}>
                <div className="session-date">
                  <CalendarClock size={18} />
                  <div><strong>{session.date}</strong><span>{session.time}</span></div>
                </div>
                <div className="session-main">
                  <strong>{session.title}</strong>
                  <span>{session.note}</span>
                </div>
                <StatusBadge tone={session.tone}>{session.tone === 'amber' ? 'FTO needed' : 'Spaces open'}</StatusBadge>
                <button className="secondary-button compact-button">View</button>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card dashboard-panel task-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Your queue</p>
              <h2>To Do List</h2>
            </div>
            <span className="count-chip">2 open</span>
          </div>
          <div className="task-list">
            <label className="task-item"><input type="checkbox" /><span><strong>Check Day 1 attendance</strong><small>Training session - tomorrow</small></span></label>
            <label className="task-item"><input type="checkbox" /><span><strong>Read latest announcement</strong><small>Posted by Command</small></span></label>
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
            {mockCadets.map((cadet) => (
              <Link className="cadet-row cadet-row-no-avatar" to={`/cadets/${cadet.id}`} key={cadet.id}>
                <div className="cadet-main"><strong>{cadet.name}</strong><span>{cadet.employeeNumber}</span></div>
                <div className="cadet-meta"><Clock3 size={14} /><span>{daysUntil(cadet.deadline)} days remaining</span></div>
                <StatusBadge tone={cadet.stage === 'Awaiting Day 1' ? 'amber' : cadet.stage === 'Day 2 Booked' ? 'blue' : 'pink'}>{cadet.stage}</StatusBadge>
                <ArrowRight size={16} className="row-arrow" />
              </Link>
            ))}
          </div>
        </section>

        <section className="glass-card dashboard-panel announcement-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Department</p>
              <h2>Announcements</h2>
            </div>
            <Megaphone size={18} />
          </div>
          <article className="announcement-item">
            <div className="announcement-icon"><Megaphone size={18} /></div>
            <div><strong>Training server reminder</strong><p>All Day 1 and Day 2 sessions must be completed in the training server.</p><span>Today - Command</span></div>
          </article>
          <article className="announcement-item muted-item">
            <div className="announcement-icon"><CheckCircle2 size={18} /></div>
            <div><strong>FTO sheet updates</strong><p>Please complete feedback before ending your shift.</p><span>Yesterday - FTO Lead</span></div>
          </article>
        </section>
      </div>
    </>
  );
}

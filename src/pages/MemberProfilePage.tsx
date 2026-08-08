import { ArrowLeft, Hash, History, MessageCircle, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { QualificationBadge } from '../components/QualificationBadge';
import { StatusBadge } from '../components/StatusBadge';
import { mockMembers } from '../data/mockMembers';

export function MemberProfilePage() {
  const { memberId } = useParams();
  const member = mockMembers.find((item) => item.id === memberId);

  if (!member) {
    return (
      <section className="glass-card empty-state">
        <h1>Member not found</h1>
        <p>This roster record does not exist.</p>
        <Link className="secondary-button inline-button" to="/roster"><ArrowLeft size={16} /> Return to roster</Link>
      </section>
    );
  }

  const qualifications = [
    member.qualifications.fto ? 'FTO' : null,
    member.qualifications.hart ? 'HART' : null,
    member.qualifications.met ? 'MET' : null,
    member.qualifications.doctor ? 'Doctor' : null,
  ].filter(Boolean) as Array<'FTO' | 'HART' | 'MET' | 'Doctor'>;

  return (
    <>
      <div className="member-page-toolbar">
        <Link className="secondary-button inline-button" to="/roster"><ArrowLeft size={16} /> Back to roster</Link>
      </div>

      <section className="glass-card member-command-header">
        <div className="member-command-primary">
          <span className="member-command-callsign">{member.callsign}</span>
          <div>
            <p className="eyebrow">Personnel record</p>
            <h1>{member.name}</h1>
            <span className="member-command-rank">{member.rank}</span>
          </div>
        </div>

        <div className="member-command-meta">
          <div><span>Employee No.</span><strong>{member.employeeNumber}</strong></div>
          <div><span>Timezone</span><strong>{member.timezone}</strong></div>
          <div><span>Status</span><StatusBadge tone={member.status === 'Active' ? 'green' : member.status === 'LOA' ? 'amber' : 'neutral'}>{member.status}</StatusBadge></div>
        </div>

        <div className="member-command-quals">
          <span>Qualifications</span>
          <div className="qualification-profile-list">
            {qualifications.length
              ? qualifications.map((item) => <QualificationBadge key={item} label={item} />)
              : <span className="muted-text">None recorded</span>}
          </div>
        </div>
      </section>

      <nav className="member-tabs" aria-label="Member record sections">
        <button className="member-tab active" type="button">Overview</button>
        <button className="member-tab" type="button">Training</button>
        <button className="member-tab" type="button">Ride Alongs</button>
        <button className="member-tab" type="button">Notes</button>
        <button className="member-tab" type="button">History</button>
      </nav>

      <div className="member-profile-grid compact-profile-grid">
        <section className="glass-card member-section compact-member-section">
          <div className="panel-header">
            <div><p className="eyebrow">Accounts</p><h2>Connected details</h2></div>
            <MessageCircle size={18} />
          </div>
          <dl className="detail-list">
            <div><dt>Steam name</dt><dd>{member.steamName}</dd></div>
            <div><dt>Discord name</dt><dd>{member.discordName}</dd></div>
            <div><dt>Discord user ID</dt><dd>{member.discordUserId ?? <span className="setup-needed">Not added yet</span>}</dd></div>
            <div><dt>Login status</dt><dd><StatusBadge tone={member.discordUserId ? 'green' : 'amber'}>{member.discordUserId ? 'Configured' : 'Not configured'}</StatusBadge></dd></div>
          </dl>
        </section>

        <section className="glass-card member-section compact-member-section">
          <div className="panel-header">
            <div><p className="eyebrow">Department</p><h2>Core details</h2></div>
            <ShieldCheck size={18} />
          </div>
          <dl className="detail-list">
            <div><dt>Rank</dt><dd>{member.rank}</dd></div>
            <div><dt>Callsign</dt><dd className="mono-value">{member.callsign}</dd></div>
            <div><dt>Employee number</dt><dd className="mono-value">{member.employeeNumber}</dd></div>
            <div><dt>Timezone</dt><dd>{member.timezone}</dd></div>
          </dl>
        </section>

        <section className="glass-card member-section member-section-wide compact-member-section">
          <div className="panel-header">
            <div><p className="eyebrow">Activity</p><h2>Recent record</h2></div>
            <History size={18} />
          </div>
          <div className="member-activity-empty">
            <Hash size={17} />
            <span>Activity history will appear here once training, ride-along and rank records are connected.</span>
          </div>
        </section>
      </div>
    </>
  );
}

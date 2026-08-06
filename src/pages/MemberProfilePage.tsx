import { ArrowLeft, BadgeCheck, Hash, MessageCircle, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
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
      <PageHeader
        eyebrow="Personnel record"
        title={member.name}
        description={`${member.rank} · ${member.callsign}`}
        actions={<Link className="secondary-button inline-button" to="/roster"><ArrowLeft size={16} /> Back to roster</Link>}
      />

      <section className="glass-card member-hero">
        <div className="member-hero-avatar">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
        <div className="member-hero-copy">
          <div className="member-title-row">
            <div><h2>{member.name}</h2><p>{member.rank}</p></div>
            <StatusBadge tone={member.status === 'Active' ? 'green' : member.status === 'LOA' ? 'amber' : 'neutral'}>{member.status}</StatusBadge>
          </div>
          <div className="member-identity-strip">
            <span><Hash size={15} /> {member.employeeNumber}</span>
            <span><ShieldCheck size={15} /> {member.callsign}</span>
            <span><UserRound size={15} /> {member.timezone}</span>
          </div>
        </div>
      </section>

      <div className="member-profile-grid">
        <section className="glass-card member-section">
          <div className="panel-header"><div><p className="eyebrow">Accounts</p><h2>Connected details</h2></div><MessageCircle size={18} /></div>
          <dl className="detail-list">
            <div><dt>Steam name</dt><dd>{member.steamName}</dd></div>
            <div><dt>Discord name</dt><dd>{member.discordName}</dd></div>
            <div><dt>Discord user ID</dt><dd>{member.discordUserId ?? <span className="setup-needed">Not added yet</span>}</dd></div>
            <div><dt>Login status</dt><dd><StatusBadge tone={member.discordUserId ? 'green' : 'amber'}>{member.discordUserId ? 'Configured' : 'Not configured'}</StatusBadge></dd></div>
          </dl>
        </section>

        <section className="glass-card member-section">
          <div className="panel-header"><div><p className="eyebrow">Capabilities</p><h2>Qualifications</h2></div><BadgeCheck size={18} /></div>
          <div className="qualification-profile-list">
            {qualifications.length ? qualifications.map((item) => <QualificationBadge key={item} label={item} />) : <p className="muted-text">No specialist qualifications currently recorded.</p>}
          </div>
        </section>

        <section className="glass-card member-section member-section-wide">
          <div className="panel-header"><div><p className="eyebrow">Record</p><h2>Department information</h2></div></div>
          <div className="department-detail-grid">
            <div><span>Rank</span><strong>{member.rank}</strong></div>
            <div><span>Callsign</span><strong>{member.callsign}</strong></div>
            <div><span>Employee number</span><strong>{member.employeeNumber}</strong></div>
            <div><span>Timezone</span><strong>{member.timezone}</strong></div>
          </div>
        </section>
      </div>
    </>
  );
}

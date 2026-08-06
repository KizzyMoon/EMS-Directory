import { ArrowRight, Search, SlidersHorizontal, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { QualificationBadge } from '../components/QualificationBadge';
import { StatusBadge } from '../components/StatusBadge';
import { mockMembers } from '../data/mockMembers';
import type { EmsRank, MemberStatus } from '../types/member';

const ranks: Array<EmsRank | 'All ranks'> = [
  'All ranks',
  'Chief',
  'Deputy Chief',
  'Captain',
  'Lieutenant',
  'Sergeant',
  'Senior EMT',
  'EMT IV',
  'EMT III',
  'EMT II',
  'EMT I',
  'Probationer',
  'Cadet',
];

const statuses: Array<MemberStatus | 'All statuses'> = ['All statuses', 'Active', 'LOA', 'Inactive'];

export function RosterPage() {
  const [query, setQuery] = useState('');
  const [rank, setRank] = useState<(typeof ranks)[number]>('All ranks');
  const [status, setStatus] = useState<(typeof statuses)[number]>('All statuses');

  const filteredMembers = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return mockMembers.filter((member) => {
      const matchesQuery = !normalisedQuery || [
        member.name,
        member.callsign,
        member.employeeNumber,
        member.steamName,
        member.discordName,
        member.timezone,
      ].some((value) => value.toLowerCase().includes(normalisedQuery));

      const matchesRank = rank === 'All ranks' || member.rank === rank;
      const matchesStatus = status === 'All statuses' || member.status === status;

      return matchesQuery && matchesRank && matchesStatus;
    });
  }, [query, rank, status]);

  return (
    <>
      <PageHeader
        eyebrow="Personnel"
        title="EMS Roster"
        description="Shared department roster, account details and qualifications."
        actions={<span className="roster-count"><Users size={16} /> {filteredMembers.length} members</span>}
      />

      <section className="glass-card roster-toolbar" aria-label="Roster filters">
        <label className="roster-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, callsign, employee number, Steam or Discord…"
          />
        </label>

        <div className="roster-filter">
          <SlidersHorizontal size={16} />
          <select value={rank} onChange={(event) => setRank(event.target.value as (typeof ranks)[number])}>
            {ranks.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>

        <div className="roster-filter">
          <select value={status} onChange={(event) => setStatus(event.target.value as (typeof statuses)[number])}>
            {statuses.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
      </section>

      <section className="glass-card roster-table-card">
        <div className="roster-table roster-table-head" aria-hidden="true">
          <span>Member</span>
          <span>Rank</span>
          <span>Callsign</span>
          <span>Employee No.</span>
          <span>Timezone</span>
          <span>Qualifications</span>
          <span>Status</span>
          <span />
        </div>

        <div className="roster-list">
          {filteredMembers.map((member) => {
            const qualifications = [
              member.qualifications.fto ? 'FTO' : null,
              member.qualifications.hart ? 'HART' : null,
              member.qualifications.met ? 'MET' : null,
              member.qualifications.doctor ? 'Doctor' : null,
            ].filter(Boolean) as Array<'FTO' | 'HART' | 'MET' | 'Doctor'>;

            return (
              <Link className="roster-table roster-row" to={`/roster/${member.id}`} key={member.id}>
                <div className="roster-person">
                  <span className="member-avatar">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                  <span><strong>{member.name}</strong><small>{member.discordName}</small></span>
                </div>
                <span>{member.rank}</span>
                <span className="mono-value">{member.callsign}</span>
                <span className="mono-value">{member.employeeNumber}</span>
                <span>{member.timezone}</span>
                <span className="qualification-list">
                  {qualifications.length ? qualifications.map((item) => <QualificationBadge key={item} label={item} />) : <small className="muted-text">None</small>}
                </span>
                <StatusBadge tone={member.status === 'Active' ? 'green' : member.status === 'LOA' ? 'amber' : 'neutral'}>{member.status}</StatusBadge>
                <ArrowRight size={16} className="row-arrow" />
              </Link>
            );
          })}

          {!filteredMembers.length ? (
            <div className="roster-empty">
              <strong>No members found</strong>
              <span>Try clearing or changing the roster filters.</span>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

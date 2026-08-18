import { ArrowRight, Plus, RefreshCw, Search, SlidersHorizontal, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { hasAnyPermission } from '../auth/permissions';
import { MemberEditorDrawer } from '../components/MemberEditorDrawer';
import { PageHeader } from '../components/PageHeader';
import { QualificationBadge } from '../components/QualificationBadge';
import { StatusBadge } from '../components/StatusBadge';
import { getRoster } from '../lib/rosterApi';
import { EMS_RANKS, type EmsMember, type EmsRank, type MemberStatus } from '../types/member';

const ranks: Array<EmsRank | 'All ranks'> = [
  'All ranks',
  ...EMS_RANKS,
];

const statuses: Array<MemberStatus | 'All statuses'> = ['All statuses', 'Active', 'LOA', 'Inactive'];

export function RosterPage() {
  const { user } = useAuth();
  const canManage = hasAnyPermission(user, ['roster.manage']);
  const [members, setMembers] = useState<EmsMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rank, setRank] = useState<(typeof ranks)[number]>('All ranks');
  const [status, setStatus] = useState<(typeof statuses)[number]>('All statuses');
  const sheetManaged = members.some((member) => member.source === 'Google Sheets');

  const filteredMembers = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();

    return members.filter((member) => {
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
  }, [members, query, rank, status]);

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setMembers(await getRoster());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load the EMS roster.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  return (
    <>
      <PageHeader
        eyebrow="Personnel"
        title="EMS Roster"
        description="Live department roster from the main Google Sheet, with secure account links from EMS Directory."
        actions={(
          <div className="roster-header-actions">
            <span className="roster-count"><Users size={16} /> {filteredMembers.length} members</span>
            {sheetManaged ? <span className="count-chip">Live Google roster</span> : null}
            {canManage && !loading && members.length > 0 && !sheetManaged ? <button className="primary-button" type="button" onClick={() => setEditorOpen(true)}><Plus size={16} /> Add member</button> : null}
          </div>
        )}
      />

      {loadError ? (
        <div className="status-note red-note roster-load-note">
          <span>{loadError}</span>
          <button className="secondary-button compact-button" type="button" onClick={() => void loadRoster()}><RefreshCw size={15} /> Try again</button>
        </div>
      ) : null}

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
          <span>Callsign</span>
          <span>Name</span>
          <span>Rank</span>
          <span>Employee No.</span>
          <span>Steam</span>
          <span>Discord</span>
          <span>Timezone</span>
          <span>Qualifications</span>
          <span>Status</span>
          <span />
        </div>

        <div className={loading ? 'roster-list roster-list-loading' : 'roster-list'} aria-busy={loading}>
          {loading ? <div className="roster-loading"><RefreshCw className="spin-icon" size={18} /> Loading roster…</div> : null}
          {filteredMembers.map((member) => {
            const qualifications = [
              member.qualifications.fto ? 'FTO' : null,
              member.qualifications.hart ? 'HART' : null,
              member.qualifications.met ? 'MET' : null,
              member.qualifications.doctor ? 'Doctor' : null,
            ].filter(Boolean) as Array<'FTO' | 'HART' | 'MET' | 'Doctor'>;

            return (
              <Link className="roster-table roster-row" to={`/roster/${member.id}`} key={member.id}>
                <span className="mono-value roster-callsign">{member.callsign}</span>
                <span className="roster-name"><strong>{member.name}</strong></span>
                <span>{member.rank}</span>
                <span className="mono-value">{member.employeeNumber}</span>
                <span>{member.steamName}</span>
                <span>{member.discordName}</span>
                <span>{member.timezone}</span>
                <span className="qualification-list">
                  {qualifications.length
                    ? qualifications.map((item) => <QualificationBadge key={item} label={item} />)
                    : <small className="muted-text">None</small>}
                </span>
                <StatusBadge tone={member.status === 'Active' ? 'green' : member.status === 'LOA' ? 'amber' : 'neutral'}>{member.status}</StatusBadge>
                <ArrowRight size={16} className="row-arrow" />
              </Link>
            );
          })}

          {!loading && !filteredMembers.length ? (
            <div className="roster-empty">
              <strong>No members found</strong>
              <span>Try clearing or changing the roster filters.</span>
            </div>
          ) : null}
        </div>
      </section>

      <MemberEditorDrawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={(member) => {
          if (member) setMembers((current) => [...current, member]);
        }}
      />
    </>
  );
}

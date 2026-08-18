import { AlertTriangle, ArrowRight, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { getCadets } from '../../../lib/cadetsApi';
import { useRideAlongs } from '../../rideAlongs/hooks/useRideAlongs';
import { CadetNav } from '../components/CadetNav';
import { getCadetStats } from '../selectors';
import type { CadetRecord, CadetStage } from '../types';
import { cadetStageTone, daysRemaining } from '../utils';

const stages: Array<CadetStage | 'All stages'> = [
  'All stages',
  'Not currently booked',
  'Awaiting Day 1',
  'Day 1 Signed Up',
  'Available for Ride Alongs',
  'Ready for Day 2',
  'Day 2 Booked',
];

export function CadetsOverviewPage() {
  const [searchParams] = useSearchParams();
  const requestedStage = searchParams.get('stage') as CadetStage | null;
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<CadetStage | 'All stages'>(requestedStage ?? 'All stages');
  const [deadlineOnly, setDeadlineOnly] = useState(false);
  const [records, setRecords] = useState<CadetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { rideAlongs } = useRideAlongs();
  const hasDeadlineData = records.some((cadet) => Boolean(cadet.deadline));

  const loadCadets = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRecords(await getCadets());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load cadet records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCadets();
  }, [loadCadets]);

  useEffect(() => {
    setStage(requestedStage ?? 'All stages');
  }, [requestedStage]);

  const cadets = useMemo(() => records.filter((cadet) => {
    const text = `${cadet.name} ${cadet.callsign} ${cadet.employeeNumber}`.toLowerCase();
    const remaining = daysRemaining(cadet.deadline);
    return (!query || text.includes(query.toLowerCase()))
      && (stage === 'All stages' || cadet.stage === stage)
      && (!deadlineOnly || (remaining !== null && remaining <= 10));
  }), [deadlineOnly, query, records, stage]);

  return (
    <>
      <PageHeader
        eyebrow="Cadet management"
        title="Cadets"
        description="Current cadets from the main roster, combined with live training bookings and EMS records."
      />
      <CadetNav />

      <section className="cadet-summary">
        <div><strong>{records.length}</strong><span>Active cadets</span></div>
        <div><strong>{records.filter((cadet) => cadet.stage === 'Day 1 Signed Up').length}</strong><span>Booked Day 1</span></div>
        <div><strong>{records.filter((cadet) => cadet.dayOneComplete).length}</strong><span>Day 1 complete</span></div>
        <div><strong>{records.filter((cadet) => cadet.stage === 'Day 2 Booked').length}</strong><span>Booked Day 2</span></div>
      </section>

      {loadError ? (
        <div className="status-note red-note roster-load-note">
          <span>{loadError}</span>
          <button className="secondary-button compact-button" type="button" onClick={() => void loadCadets()}><RefreshCw size={15} /> Try again</button>
        </div>
      ) : null}

      <section className="glass-card cadet-toolbar">
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cadet, callsign or employee number…" /></label>
        <select value={stage} onChange={(event) => setStage(event.target.value as CadetStage | 'All stages')}>
          {stages.map((option) => <option key={option}>{option}</option>)}
        </select>
        {hasDeadlineData ? (
          <button className={deadlineOnly ? 'filter-toggle active' : 'filter-toggle'} onClick={() => setDeadlineOnly((value) => !value)} type="button">
            <AlertTriangle size={15} /> Approaching deadline
          </button>
        ) : null}
      </section>

      <section className="glass-card cadet-table-card">
        <div className="cadet-table cadet-table-head">
          <span>Callsign</span><span>Name</span><span>Employee No.</span><span>Stage</span><span>Days Left</span><span>Ride Alongs</span><span>Unique FTOs</span><span>Current Focus</span><span>Next Action</span><span />
        </div>
        {loading ? <div className="roster-loading"><RefreshCw className="spin-icon" size={18} /> Loading cadets…</div> : null}
        {!loading && cadets.map((cadet) => {
          const stats = getCadetStats(cadet, rideAlongs);
          const remaining = daysRemaining(cadet.deadline);
          return (
            <Link className="cadet-table cadet-table-row" to={`/cadets/${cadet.id}`} key={cadet.id}>
              <span className="mono-value cadet-callsign">{cadet.callsign}</span>
              <strong>{cadet.name}</strong>
              <span className="mono-value">{cadet.employeeNumber}</span>
              <StatusBadge tone={cadetStageTone(cadet.stage)}>{cadet.stage}</StatusBadge>
              <span className={remaining !== null && remaining <= 10 ? 'deadline-text' : ''}>{remaining ?? (cadet.source === 'Google Sheets' ? 'Restricted' : '—')}</span>
              <span>{stats.rideAlongCount}</span>
              <span>{stats.uniqueFtoCount}</span>
              <span>{stats.currentFocus}</span>
              <span>{cadet.nextStep}</span>
              <ArrowRight size={16} />
            </Link>
          );
        })}
        {!loading && !cadets.length ? <div className="roster-empty"><strong>No cadets found</strong><span>Try clearing or changing the cadet filters.</span></div> : null}
      </section>
    </>
  );
}

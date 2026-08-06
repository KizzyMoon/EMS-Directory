import { AlertTriangle, ArrowRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { CadetNav } from '../components/CadetNav';
import { mockCadetRecords } from '../data/mockCadetRecords';
import { getCadetStats } from '../selectors';
import type { CadetStage } from '../types';
import { cadetStageTone, daysRemaining } from '../utils';

const stages: Array<CadetStage | 'All stages'> = [
  'All stages',
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

  const cadets = useMemo(() => mockCadetRecords.filter((cadet) => {
    const text = `${cadet.name} ${cadet.callsign} ${cadet.employeeNumber}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase()))
      && (stage === 'All stages' || cadet.stage === stage)
      && (!deadlineOnly || daysRemaining(cadet.deadline) <= 10);
  }), [deadlineOnly, query, stage]);

  return (
    <>
      <PageHeader
        eyebrow="Cadet management"
        title="Cadets"
        description="Training progress calculated from sessions, ride alongs and feedback."
      />
      <CadetNav />

      <section className="cadet-summary">
        <div><strong>{mockCadetRecords.length}</strong><span>Active cadets</span></div>
        <div><strong>{mockCadetRecords.filter((cadet) => cadet.stage === 'Awaiting Day 1').length}</strong><span>Awaiting Day 1</span></div>
        <div><strong>{mockCadetRecords.filter((cadet) => cadet.stage === 'Available for Ride Alongs').length}</strong><span>Ride-along ready</span></div>
        <div><strong>{mockCadetRecords.filter((cadet) => daysRemaining(cadet.deadline) <= 10).length}</strong><span>Near deadline</span></div>
      </section>

      <section className="glass-card cadet-toolbar">
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cadet, callsign or employee number…" /></label>
        <select value={stage} onChange={(event) => setStage(event.target.value as CadetStage | 'All stages')}>
          {stages.map((option) => <option key={option}>{option}</option>)}
        </select>
        <button className={deadlineOnly ? 'filter-toggle active' : 'filter-toggle'} onClick={() => setDeadlineOnly((value) => !value)} type="button">
          <AlertTriangle size={15} /> Approaching deadline
        </button>
      </section>

      <section className="glass-card cadet-table-card">
        <div className="cadet-table cadet-table-head">
          <span>Callsign</span><span>Name</span><span>Employee No.</span><span>Stage</span><span>Days Left</span><span>Ride Alongs</span><span>Unique FTOs</span><span>Current Focus</span><span>Next Action</span><span />
        </div>
        {cadets.map((cadet) => {
          const stats = getCadetStats(cadet);
          const remaining = daysRemaining(cadet.deadline);
          return (
            <Link className="cadet-table cadet-table-row" to={`/cadets/${cadet.id}`} key={cadet.id}>
              <span className="mono-value cadet-callsign">{cadet.callsign}</span>
              <strong>{cadet.name}</strong>
              <span className="mono-value">{cadet.employeeNumber}</span>
              <StatusBadge tone={cadetStageTone(cadet.stage)}>{cadet.stage}</StatusBadge>
              <span className={remaining <= 10 ? 'deadline-text' : ''}>{remaining}</span>
              <span>{stats.rideAlongCount}</span>
              <span>{stats.uniqueFtoCount}</span>
              <span>{stats.currentFocus}</span>
              <span>{cadet.nextStep}</span>
              <ArrowRight size={16} />
            </Link>
          );
        })}
      </section>
    </>
  );
}

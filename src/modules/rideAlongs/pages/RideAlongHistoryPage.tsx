import { ArrowRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { RideAlongNav } from '../components/RideAlongNav';
import { mockRideAlongs } from '../data/mockRideAlongs';
import { feedbackTone, formatDuration, formatRideAlongDate, rideAlongTone } from '../utils';

export function RideAlongHistoryPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');

  const rideAlongs = useMemo(() => mockRideAlongs.filter((rideAlong) => {
    const text = `${rideAlong.ftoName} ${rideAlong.cadets.map((cadet) => cadet.name).join(' ')}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (status === 'All statuses' || rideAlong.status === status);
  }), [query, status]);

  return (
    <>
      <PageHeader eyebrow="Ride alongs" title="History" description="Search completed and active ride-along records." />
      <RideAlongNav />

      <section className="glass-card ride-history-toolbar">
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cadet or FTO…" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>All statuses</option><option>In Progress</option><option>Completed</option><option>Cancelled</option>
        </select>
      </section>

      <section className="glass-card ride-history-table-card">
        <div className="ride-history-table ride-history-head">
          <span>Cadet(s)</span><span>FTO</span><span>Date</span><span>Duration</span><span>Feedback</span><span>Status</span><span />
        </div>
        {rideAlongs.map((rideAlong) => {
          const feedbackStatus = rideAlong.feedback.some((item) => item.status === 'Draft') ? 'Draft' : rideAlong.feedback.length ? 'Submitted' : 'Not Started';
          return (
            <Link className="ride-history-table ride-history-row" to={`/ride-alongs/${rideAlong.id}`} key={rideAlong.id}>
              <strong>{rideAlong.cadets.map((cadet) => cadet.name).join(', ')}</strong>
              <span>{rideAlong.ftoName}</span>
              <span>{formatRideAlongDate(rideAlong.startedAt)}</span>
              <span>{formatDuration(rideAlong.durationMinutes)}</span>
              <StatusBadge tone={feedbackTone(feedbackStatus)}>{feedbackStatus}</StatusBadge>
              <StatusBadge tone={rideAlongTone(rideAlong.status)}>{rideAlong.status}</StatusBadge>
              <ArrowRight size={16} />
            </Link>
          );
        })}
      </section>
    </>
  );
}

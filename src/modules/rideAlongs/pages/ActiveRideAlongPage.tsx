import { ArrowLeft, Clock3, MapPin, Square } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { RideAlongNav } from '../components/RideAlongNav';
import { mockRideAlongs } from '../data/mockRideAlongs';
import { formatRideAlongDate, rideAlongTone } from '../utils';

export function ActiveRideAlongPage() {
  const { rideAlongId } = useParams();
  const rideAlong = mockRideAlongs.find((item) => item.id === rideAlongId);

  if (!rideAlong) return <section className="glass-card empty-state"><h1>Ride along not found</h1></section>;

  return (
    <>
      <PageHeader
        eyebrow="Active ride along"
        title={rideAlong.cadets.map((cadet) => cadet.name).join(' & ')}
        description={`FTO: ${rideAlong.ftoName} · ${rideAlong.ftoCallsign}`}
        actions={<Link className="secondary-button" to="/ride-alongs"><ArrowLeft size={16} /> Back</Link>}
      />
      <RideAlongNav />

      <section className="active-ride-strip">
        <div><Clock3 size={17} /><span>Started</span><strong>{formatRideAlongDate(rideAlong.startedAt)}</strong></div>
        <div><MapPin size={17} /><span>Calls logged</span><strong>{rideAlong.callsAttended.length}</strong></div>
        <div><span>Status</span><StatusBadge tone={rideAlongTone(rideAlong.status)}>{rideAlong.status}</StatusBadge></div>
      </section>

      <div className="active-ride-grid">
        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Participants</p><h2>Cadets</h2></div></div>
          <div className="ride-participant-list">
            {rideAlong.cadets.map((cadet) => (
              <div key={cadet.id}><span className="mono-value">{cadet.callsign}</span><strong>{cadet.name}</strong><span>{cadet.employeeNumber}</span></div>
            ))}
          </div>
        </section>

        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Session log</p><h2>Calls attended</h2></div></div>
          <div className="call-chip-list">
            {rideAlong.callsAttended.map((call) => <span key={call}>{call}</span>)}
          </div>
          <button className="secondary-button full-width-button" type="button">Add call</button>
        </section>

        <section className="glass-card active-ride-actions">
          <div><p className="eyebrow">Finish</p><h2>End Ride Along</h2><p>Ending the ride along creates a separate feedback form for each cadet.</p></div>
          <Link className="primary-button" to={`/ride-alongs/${rideAlong.id}`}><Square size={16} /> End and complete feedback</Link>
        </section>
      </div>
    </>
  );
}

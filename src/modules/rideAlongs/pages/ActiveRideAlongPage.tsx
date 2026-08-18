import { ArrowLeft, Clock3, MapPin, RefreshCw, Square } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { addRideAlongCall, endRideAlong, getRideAlong } from '../../../lib/rideAlongsApi';
import { RideAlongNav } from '../components/RideAlongNav';
import type { RideAlong } from '../types';
import { formatRideAlongDate, rideAlongTone } from '../utils';

export function ActiveRideAlongPage() {
  const { rideAlongId } = useParams();
  const navigate = useNavigate();
  const [rideAlong, setRideAlong] = useState<RideAlong | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callCode, setCallCode] = useState('');
  const [savingCall, setSavingCall] = useState(false);
  const [ending, setEnding] = useState(false);

  const load = useCallback(async () => {
    if (!rideAlongId) return;
    setLoading(true);
    setError(null);
    try {
      setRideAlong(await getRideAlong(rideAlongId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the ride along.');
    } finally {
      setLoading(false);
    }
  }, [rideAlongId]);

  useEffect(() => { void load(); }, [load]);

  async function addCall() {
    if (!rideAlongId || !callCode.trim()) return;
    setSavingCall(true);
    setError(null);
    try {
      setRideAlong(await addRideAlongCall(rideAlongId, callCode));
      setCallCode('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add the call.');
    } finally {
      setSavingCall(false);
    }
  }

  async function end() {
    if (!rideAlongId) return;
    setEnding(true);
    setError(null);
    try {
      await endRideAlong(rideAlongId);
      navigate(`/ride-alongs/${rideAlongId}`);
    } catch (endError) {
      setError(endError instanceof Error ? endError.message : 'Unable to end the ride along.');
      setEnding(false);
    }
  }

  if (loading) return <section className="glass-card empty-state"><RefreshCw className="spin-icon" size={20} /><h1>Loading ride along…</h1></section>;
  if (error && !rideAlong) return <section className="glass-card empty-state"><h1>Unable to load ride along</h1><p>{error}</p><button className="secondary-button inline-button" type="button" onClick={() => void load()}><RefreshCw size={16} /> Try again</button></section>;

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

      {error ? <div className="status-note red-note">{error}</div> : null}

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
          <div className="form-row">
            <input value={callCode} onChange={(event) => setCallCode(event.target.value)} placeholder="Call code, e.g. 10-52" />
            <button className="secondary-button" disabled={!callCode.trim() || savingCall} type="button" onClick={() => void addCall()}>{savingCall ? 'Adding…' : 'Add call'}</button>
          </div>
        </section>

        <section className="glass-card active-ride-actions">
          <div><p className="eyebrow">Finish</p><h2>End Ride Along</h2><p>Ending the ride along creates a separate feedback form for each cadet.</p></div>
          <button className="primary-button" disabled={ending} type="button" onClick={() => void end()}><Square size={16} /> {ending ? 'Ending…' : 'End and complete feedback'}</button>
        </section>
      </div>
    </>
  );
}

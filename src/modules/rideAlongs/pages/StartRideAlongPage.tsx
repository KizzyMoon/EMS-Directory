import { ArrowLeft, Check, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { RideAlongNav } from '../components/RideAlongNav';
import { availableCadets } from '../data/mockRideAlongs';

export function StartRideAlongPage() {
  const [searchParams] = useSearchParams();
  const initialCadet = searchParams.get('cadet');
  const [selected, setSelected] = useState<string[]>(initialCadet ? [initialCadet] : []);
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));

  const selectedCadets = useMemo(
    () => availableCadets.filter((cadet) => selected.includes(cadet.id)),
    [selected],
  );

  function toggleCadet(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return current;
      return [...current, id];
    });
  }

  return (
    <>
      <PageHeader
        eyebrow="Ride alongs"
        title="Start Ride Along"
        description="Select one or two available cadets. No permanent trainer assignment is created."
        actions={<Link className="secondary-button" to="/ride-alongs"><ArrowLeft size={16} /> Back</Link>}
      />
      <RideAlongNav />

      <div className="start-ride-grid">
        <section className="glass-card">
          <div className="panel-header"><div><p className="eyebrow">Step 1</p><h2>Select cadets</h2></div><span className="count-chip">{selected.length}/2 selected</span></div>
          <div className="cadet-select-list">
            {availableCadets.map((cadet) => {
              const isSelected = selected.includes(cadet.id);
              return (
                <button className={isSelected ? 'cadet-select-row selected' : 'cadet-select-row'} onClick={() => toggleCadet(cadet.id)} key={cadet.id} type="button">
                  <span className="mono-value">{cadet.callsign}</span>
                  <div><strong>{cadet.name}</strong><span>{cadet.employeeNumber}</span></div>
                  <div><span>Focus</span><strong>{cadet.currentFocus}</strong></div>
                  <div><span>Ride alongs</span><strong>{cadet.rideAlongs}</strong></div>
                  {isSelected ? <Check size={17} /> : <Plus size={17} />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="glass-card ride-start-panel">
          <div className="panel-header"><div><p className="eyebrow">Step 2</p><h2>Session details</h2></div></div>
          <form className="ride-start-form">
            <label><span>FTO</span><input value="Kizzy Moon · M3-14" readOnly /></label>
            <label><span>Start time</span><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label><span>Selected cadets</span><textarea value={selectedCadets.map((cadet) => `${cadet.name} · ${cadet.callsign}`).join('\n')} readOnly rows={3} placeholder="Select a cadet from the list." /></label>
            <button className="primary-button full-width-button" disabled={!selected.length} type="button">Start ride along</button>
          </form>
          <p className="form-help">Each selected cadet will receive a separate feedback record when the ride along ends.</p>
        </section>
      </div>
    </>
  );
}

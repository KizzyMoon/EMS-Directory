import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { mockCadets } from '../data/mockCadets';

export function CadetsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Training management"
        title="Cadets"
        description="Shared cadet records, training stages and ride-along progress."
        actions={<button className="primary-button">Add cadet</button>}
      />

      <section className="glass-card table-card">
        <div className="table-toolbar">
          <input className="field" type="search" placeholder="Search cadets…" />
          <select className="field" defaultValue="all">
            <option value="all">All stages</option>
            <option>Awaiting Day 1</option>
            <option>Day 1 Signed Up</option>
            <option>Available for Ride Alongs</option>
            <option>Ready for Day 2</option>
            <option>Day 2 Booked</option>
          </select>
        </div>

        <div className="data-table" role="table" aria-label="Cadets">
          <div className="table-row table-head" role="row">
            <span>Name</span><span>Stage</span><span>Ride Alongs</span><span>Current Focus</span><span></span>
          </div>
          {mockCadets.map((cadet) => (
            <div className="table-row" role="row" key={cadet.id}>
              <span><strong>{cadet.name}</strong><small>{cadet.employeeNumber}</small></span>
              <span><span className="status-pill">{cadet.stage}</span></span>
              <span>{cadet.rideAlongs}</span>
              <span>{cadet.currentFocus}</span>
              <span><Link className="text-link" to={`/cadets/${cadet.id}`}>Open</Link></span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

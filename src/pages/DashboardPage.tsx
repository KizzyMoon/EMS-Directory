import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { mockCadets } from '../data/mockCadets';

export function DashboardPage() {
  const availableCadets = mockCadets.filter((cadet) => cadet.stage === 'Available for Ride Alongs').length;
  const awaitingDayOne = mockCadets.filter((cadet) => cadet.stage === 'Awaiting Day 1').length;

  return (
    <>
      <PageHeader
        eyebrow="Shared EMS system"
        title="Dashboard"
        description="Live department information based on your rank and permissions."
      />

      <div className="stats-grid">
        <StatCard label="Active cadets" value={mockCadets.length} detail="Across all training stages" />
        <StatCard label="Available for ride alongs" value={availableCadets} detail="Day 1 complete" />
        <StatCard label="Awaiting Day 1" value={awaitingDayOne} detail="Training not yet booked" />
        <StatCard label="Upcoming training" value="2" detail="Next seven days" />
      </div>

      <div className="dashboard-grid">
        <section className="glass-card panel-span-2">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FTO work queue</p>
              <h2>Cadets requiring attention</h2>
            </div>
          </div>
          <div className="compact-list">
            {mockCadets.map((cadet) => (
              <div className="list-row" key={cadet.id}>
                <div>
                  <strong>{cadet.name}</strong>
                  <span>{cadet.employeeNumber}</span>
                </div>
                <span className="status-pill">{cadet.stage}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card">
          <p className="eyebrow">Today</p>
          <h2>To Do List</h2>
          <div className="check-list">
            <label><input type="checkbox" /> Review outstanding ride-along feedback</label>
            <label><input type="checkbox" /> Check Day 1 attendance</label>
            <label><input type="checkbox" /> Read latest announcement</label>
          </div>
        </section>

        <section className="glass-card">
          <p className="eyebrow">Next up</p>
          <h2>Training</h2>
          <div className="event-card">
            <strong>Day 1 Training</strong>
            <span>8 August · 19:00</span>
            <small>1 FTO space available</small>
          </div>
          <div className="event-card">
            <strong>Day 2 Training</strong>
            <span>10 August · 20:00</span>
            <small>Cadet spaces available</small>
          </div>
        </section>
      </div>
    </>
  );
}

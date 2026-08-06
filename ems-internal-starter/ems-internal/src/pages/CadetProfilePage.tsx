import { Navigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { mockCadets } from '../data/mockCadets';

export function CadetProfilePage() {
  const { cadetId } = useParams();
  const cadet = mockCadets.find((item) => item.id === cadetId);
  if (!cadet) return <Navigate to="/cadets" replace />;

  return (
    <>
      <PageHeader
        eyebrow={cadet.employeeNumber}
        title={cadet.name}
        description={`${cadet.stage} · Started ${cadet.startDate}`}
        actions={<button className="primary-button">Start Ride Along</button>}
      />

      <div className="stats-grid">
        <StatCard label="Day 1" value={cadet.dayOneComplete ? 'Complete' : 'Not complete'} />
        <StatCard label="Ride Alongs" value={cadet.rideAlongs} />
        <StatCard label="Unique FTOs" value={cadet.uniqueFtos} />
        <StatCard label="Current Focus" value={cadet.currentFocus} />
      </div>

      <div className="dashboard-grid">
        <section className="glass-card panel-span-2">
          <p className="eyebrow">Training history</p>
          <h2>Recent records</h2>
          <div className="timeline">
            <div><span></span><strong>Ride Along #2</strong><small>Radio confidence set as current focus</small></div>
            <div><span></span><strong>Ride Along #1</strong><small>Initial city navigation and basic call handling</small></div>
            <div><span></span><strong>Day 1 completed</strong><small>Ambulance, F5 menu and basic treatments covered</small></div>
          </div>
        </section>

        <section className="glass-card restricted-card">
          <p className="eyebrow">FTO and above</p>
          <h2>Internal information</h2>
          <p>Detailed feedback, concerns and private notes are restricted by permission.</p>
          <button className="secondary-button">Open training sheet</button>
        </section>
      </div>
    </>
  );
}

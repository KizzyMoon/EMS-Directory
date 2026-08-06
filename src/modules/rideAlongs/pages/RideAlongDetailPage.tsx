import { ArrowLeft, LockKeyhole, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { RideAlongNav } from '../components/RideAlongNav';
import { mockRideAlongs } from '../data/mockRideAlongs';
import type { RideAlongFeedback } from '../types';
import { feedbackTone, formatDuration, formatRideAlongDate, rideAlongTone } from '../utils';

const emptyFeedback = (cadetId: string, cadetName: string): RideAlongFeedback => ({
  id: `new-${cadetId}`,
  cadetId,
  cadetName,
  strengths: '',
  areasToImprove: '',
  currentFocus: '',
  generalFeedback: '',
  concerns: '',
  internalNotes: '',
  recommendedNextStep: 'Continue Ride Alongs',
  status: 'Not Started',
});

export function RideAlongDetailPage() {
  const { rideAlongId } = useParams();
  const rideAlong = mockRideAlongs.find((item) => item.id === rideAlongId);
  const initialFeedback = useMemo(
    () => rideAlong?.cadets.map((cadet) => rideAlong.feedback.find((item) => item.cadetId === cadet.memberId) ?? emptyFeedback(cadet.memberId, cadet.name)) ?? [],
    [rideAlong],
  );
  const [selectedCadetId, setSelectedCadetId] = useState(initialFeedback[0]?.cadetId ?? '');
  const [feedbackByCadet, setFeedbackByCadet] = useState<Record<string, RideAlongFeedback>>(
    Object.fromEntries(initialFeedback.map((feedback) => [feedback.cadetId, feedback])),
  );

  if (!rideAlong) return <section className="glass-card empty-state"><h1>Ride along not found</h1></section>;
  const feedback = feedbackByCadet[selectedCadetId];

  function updateFeedback(field: keyof RideAlongFeedback, value: string) {
    setFeedbackByCadet((current) => ({
      ...current,
      [selectedCadetId]: { ...current[selectedCadetId], [field]: value, status: 'Draft' },
    }));
  }

  return (
    <>
      <PageHeader
        eyebrow="Ride along record"
        title={rideAlong.cadets.map((cadet) => cadet.name).join(' & ')}
        description={`${formatRideAlongDate(rideAlong.startedAt)} · ${formatDuration(rideAlong.durationMinutes)} · FTO ${rideAlong.ftoName}`}
        actions={<Link className="secondary-button" to="/ride-alongs"><ArrowLeft size={16} /> Back</Link>}
      />
      <RideAlongNav />

      <section className="ride-record-strip">
        <div><span>FTO</span><strong>{rideAlong.ftoName} · {rideAlong.ftoCallsign}</strong></div>
        <div><span>Duration</span><strong>{formatDuration(rideAlong.durationMinutes)}</strong></div>
        <div><span>Calls</span><strong>{rideAlong.callsAttended.join(', ') || 'None logged'}</strong></div>
        <div><span>Status</span><StatusBadge tone={rideAlongTone(rideAlong.status)}>{rideAlong.status}</StatusBadge></div>
      </section>

      <div className="feedback-layout">
        <aside className="glass-card feedback-cadet-tabs">
          <p className="eyebrow">Cadet feedback</p>
          {rideAlong.cadets.map((cadet) => {
            const cadetFeedback = feedbackByCadet[cadet.memberId];
            return (
              <button className={selectedCadetId === cadet.memberId ? 'active' : ''} onClick={() => setSelectedCadetId(cadet.memberId)} key={cadet.memberId}>
                <div><strong>{cadet.name}</strong><span>{cadet.callsign}</span></div>
                <StatusBadge tone={feedbackTone(cadetFeedback.status)}>{cadetFeedback.status}</StatusBadge>
              </button>
            );
          })}
        </aside>

        {feedback ? (
          <section className="glass-card feedback-form-card">
            <div className="panel-header"><div><p className="eyebrow">Feedback for</p><h2>{feedback.cadetName}</h2></div><StatusBadge tone={feedbackTone(feedback.status)}>{feedback.status}</StatusBadge></div>
            <form className="feedback-form">
              <label><span>What went well</span><textarea rows={3} value={feedback.strengths} onChange={(event) => updateFeedback('strengths', event.target.value)} /></label>
              <label><span>Areas to improve</span><textarea rows={3} value={feedback.areasToImprove} onChange={(event) => updateFeedback('areasToImprove', event.target.value)} /></label>
              <label><span>Current focus</span><input value={feedback.currentFocus} onChange={(event) => updateFeedback('currentFocus', event.target.value)} /></label>
              <label><span>General feedback</span><textarea rows={4} value={feedback.generalFeedback} onChange={(event) => updateFeedback('generalFeedback', event.target.value)} /></label>

              <div className="private-feedback-section">
                <div className="private-section-heading"><LockKeyhole size={16} /><div><strong>FTO and above only</strong><span>Cadets will not see these fields.</span></div></div>
                <label><span>Concerns</span><textarea rows={3} value={feedback.concerns} onChange={(event) => updateFeedback('concerns', event.target.value)} /></label>
                <label><span>Internal notes</span><textarea rows={3} value={feedback.internalNotes} onChange={(event) => updateFeedback('internalNotes', event.target.value)} /></label>
                <label><span>Recommended next step</span>
                  <select value={feedback.recommendedNextStep} onChange={(event) => updateFeedback('recommendedNextStep', event.target.value)}>
                    <option>Continue Ride Alongs</option>
                    <option>Ready for Day 2</option>
                    <option>Needs Specific Training</option>
                    <option>Command Review Required</option>
                  </select>
                </label>
              </div>

              <div className="feedback-actions">
                <button className="secondary-button" type="button"><Save size={16} /> Save draft</button>
                <button className="primary-button" type="button">Submit feedback</button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </>
  );
}

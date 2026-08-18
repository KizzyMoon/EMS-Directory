import { ArrowLeft, LockKeyhole, RefreshCw, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { hasAnyPermission, hasPermission } from '../../../auth/permissions';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { getRideAlong, saveRideAlongFeedback } from '../../../lib/rideAlongsApi';
import { RideAlongNav } from '../components/RideAlongNav';
import type { RideAlong, RideAlongFeedback } from '../types';
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
  const { user } = useAuth();
  const canManage = hasPermission(user, 'training.manage');
  const canSeeInternal = hasAnyPermission(user, ['fto_resources.read', 'training.manage']);
  const [rideAlong, setRideAlong] = useState<RideAlong | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCadetId, setSelectedCadetId] = useState('');
  const [feedbackByCadet, setFeedbackByCadet] = useState<Record<string, RideAlongFeedback>>({});
  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!rideAlongId) return;
    setLoading(true);
    setLoadError(null);
    try {
      setRideAlong(await getRideAlong(rideAlongId));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load this ride along.');
    } finally {
      setLoading(false);
    }
  }, [rideAlongId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!rideAlong) return;
    const records = rideAlong.cadets.map((cadet) =>
      rideAlong.feedback.find((item) => item.cadetId === cadet.memberId) ?? emptyFeedback(cadet.memberId, cadet.name),
    );
    setFeedbackByCadet(Object.fromEntries(records.map((feedback) => [feedback.cadetId, feedback])));
    setSelectedCadetId((current) => current || records[0]?.cadetId || '');
  }, [rideAlong]);

  const feedback = feedbackByCadet[selectedCadetId];

  function updateFeedback(field: keyof RideAlongFeedback, value: string) {
    setFeedbackByCadet((current) => ({
      ...current,
      [selectedCadetId]: { ...current[selectedCadetId], [field]: value, status: 'Draft' },
    }));
    setSavedMessage(null);
  }

  async function save(submit: boolean) {
    if (!rideAlongId || !feedback) return;
    setSaving(submit ? 'submit' : 'draft');
    setSaveError(null);
    setSavedMessage(null);
    try {
      const updated = await saveRideAlongFeedback(rideAlongId, feedback.cadetId, {
        strengths: feedback.strengths,
        areasToImprove: feedback.areasToImprove,
        currentFocus: feedback.currentFocus,
        generalFeedback: feedback.generalFeedback,
        concerns: feedback.concerns,
        internalNotes: feedback.internalNotes,
        recommendedNextStep: feedback.recommendedNextStep,
      }, submit);
      setRideAlong(updated);
      setSavedMessage(submit ? 'Feedback submitted.' : 'Draft saved.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save feedback.');
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <section className="glass-card empty-state"><RefreshCw className="spin-icon" size={20} /><h1>Loading ride along…</h1></section>;
  if (loadError) return <section className="glass-card empty-state"><h1>Unable to load ride along</h1><p>{loadError}</p><button className="secondary-button inline-button" type="button" onClick={() => void load()}><RefreshCw size={16} /> Try again</button></section>;
  if (!rideAlong) return <section className="glass-card empty-state"><h1>Ride along not found</h1></section>;

  return (
    <>
      <PageHeader
        eyebrow="Ride along record"
        title={rideAlong.cadets.map((cadet) => cadet.name).join(' & ')}
        description={`${formatRideAlongDate(rideAlong.startedAt)} · ${formatDuration(rideAlong.durationMinutes)} · FTO ${rideAlong.ftoName}`}
        actions={<Link className="secondary-button" to="/ride-alongs"><ArrowLeft size={16} /> Back</Link>}
      />
      <RideAlongNav />

      {saveError ? <div className="status-note red-note">{saveError}</div> : null}
      {savedMessage ? <div className="status-note green-note">{savedMessage}</div> : null}

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
            const cadetFeedback = feedbackByCadet[cadet.memberId] ?? emptyFeedback(cadet.memberId, cadet.name);
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
              <label><span>What went well</span><textarea disabled={!canManage} rows={3} value={feedback.strengths} onChange={(event) => updateFeedback('strengths', event.target.value)} /></label>
              <label><span>Areas to improve</span><textarea disabled={!canManage} rows={3} value={feedback.areasToImprove} onChange={(event) => updateFeedback('areasToImprove', event.target.value)} /></label>
              <label><span>Current focus</span><input disabled={!canManage} value={feedback.currentFocus} onChange={(event) => updateFeedback('currentFocus', event.target.value)} /></label>
              <label><span>General feedback</span><textarea disabled={!canManage} rows={4} value={feedback.generalFeedback} onChange={(event) => updateFeedback('generalFeedback', event.target.value)} /></label>

              {canSeeInternal ? (
                <div className="private-feedback-section">
                  <div className="private-section-heading"><LockKeyhole size={16} /><div><strong>FTO and above only</strong><span>Cadets will not see these fields.</span></div></div>
                  <label><span>Concerns</span><textarea disabled={!canManage} rows={3} value={feedback.concerns} onChange={(event) => updateFeedback('concerns', event.target.value)} /></label>
                  <label><span>Internal notes</span><textarea disabled={!canManage} rows={3} value={feedback.internalNotes} onChange={(event) => updateFeedback('internalNotes', event.target.value)} /></label>
                  <label><span>Recommended next step</span>
                    <select disabled={!canManage} value={feedback.recommendedNextStep} onChange={(event) => updateFeedback('recommendedNextStep', event.target.value)}>
                      <option>Continue Ride Alongs</option>
                      <option>Ready for Day 2</option>
                      <option>Needs Specific Training</option>
                      <option>Command Review Required</option>
                    </select>
                  </label>
                </div>
              ) : null}

              {canManage ? (
                <div className="feedback-actions">
                  <button className="secondary-button" disabled={saving !== null} type="button" onClick={() => void save(false)}><Save size={16} /> {saving === 'draft' ? 'Saving…' : 'Save draft'}</button>
                  <button className="primary-button" disabled={saving !== null} type="button" onClick={() => void save(true)}>{saving === 'submit' ? 'Submitting…' : 'Submit feedback'}</button>
                </div>
              ) : null}
            </form>
          </section>
        ) : null}
      </div>
    </>
  );
}

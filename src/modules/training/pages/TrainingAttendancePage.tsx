import { CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { hasPermission } from '../../../auth/permissions';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { saveTrainingAttendance } from '../../../lib/trainingApi';
import { TrainingNav } from '../components/TrainingNav';
import { useTrainingSessions } from '../hooks/useTrainingSessions';
import type { AttendanceStatus } from '../types';
import { formatTrainingDate, sessionTone } from '../utils';

const attendanceOptions: AttendanceStatus[] = ['Pending', 'Attended', 'Late', 'No Show', 'Cancelled', 'Excused'];

export function TrainingAttendancePage() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'training.manage');
  const { sessions, setSessions, loading, error, reload } = useTrainingSessions();
  const eligibleSessions = sessions.filter((session) => session.signups.length > 0);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const selectedSession = eligibleSessions.find((session) => session.id === selectedSessionId);

  useEffect(() => {
    if (!selectedSessionId && eligibleSessions[0]) setSelectedSessionId(eligibleSessions[0].id);
  }, [eligibleSessions, selectedSessionId]);

  useEffect(() => {
    if (!selectedSession) return;
    setAttendance(Object.fromEntries(selectedSession.attendance.map((item) => [item.memberId, item.status])));
    setNotes(Object.fromEntries(selectedSession.attendance.map((item) => [item.memberId, item.notes ?? ''])));
    setSaved(false);
  }, [selectedSession]);

  const save = async () => {
    if (!selectedSession) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await saveTrainingAttendance(selectedSession.id, selectedSession.signups.map((signup) => ({
        memberId: signup.memberId,
        status: attendance[signup.memberId] ?? 'Pending',
        notes: notes[signup.memberId] ?? '',
      })));
      setSessions((current) => current.map((session) => session.id === updated.id ? updated : session));
      setSaved(true);
    } catch (saveFailure) {
      setSaveError(saveFailure instanceof Error ? saveFailure.message : 'Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Training module" title="Attendance" description="Review live attendance from the main Google Training Attendance Sheet." />
      <TrainingNav />

      <div className="status-note blue-note">Attendance remains managed in the main Google Training Attendance Sheet. This page shows the current live booking list as read-only. <a className="inline-link" href="https://docs.google.com/spreadsheets/d/1twcPjyyf3tuwq4L12OhmLz6QkF9_u8I5ai5qn9wAisg/edit" target="_blank" rel="noreferrer">Open sheet <ExternalLink size={14} /></a></div>

      {error ? <div className="status-note red-note"><span>{error}</span><button className="secondary-button compact-button" type="button" onClick={() => void reload()}><RefreshCw size={15} /> Try again</button></div> : null}

      {eligibleSessions.length ? (
        <section className="glass-card training-toolbar">
          <select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>
            {eligibleSessions.map((session) => <option value={session.id} key={session.id}>{session.title} · {formatTrainingDate(session.date)}</option>)}
          </select>
        </section>
      ) : null}

      {selectedSession ? (
        <>
          <section className="glass-card attendance-header">
            <div><p className="eyebrow">{selectedSession.type}</p><h2>{selectedSession.title}</h2><span>{formatTrainingDate(selectedSession.date)} · {selectedSession.startTime}</span></div>
            <StatusBadge tone={sessionTone(selectedSession.status)}>{selectedSession.status}</StatusBadge>
          </section>

          {saveError ? <div className="status-note red-note">{saveError}</div> : null}
          {saved ? <div className="status-note green-note">Attendance saved and the session was marked complete.</div> : null}

          <section className="glass-card attendance-card">
            <div className="attendance-table attendance-table-head"><span>Member</span><span>Role</span><span>Attendance</span><span>Notes</span></div>
            {selectedSession.signups.map((signup) => (
              <div className="attendance-table attendance-row" key={signup.id}>
                <div><strong>{signup.memberName}</strong><span className="mono-value">{signup.callsign}</span></div>
                <span>{signup.role}</span>
                {selectedSession.source === 'Google Sheets' ? (
                  <StatusBadge tone={(attendance[signup.memberId] ?? 'Pending') === 'Attended' ? 'green' : 'amber'}>{attendance[signup.memberId] ?? 'Pending'}</StatusBadge>
                ) : (
                  <select disabled={!canManage} value={attendance[signup.memberId] ?? 'Pending'} onChange={(event) => setAttendance((current) => ({ ...current, [signup.memberId]: event.target.value as AttendanceStatus }))}>
                    {attendanceOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                )}
                {selectedSession.source === 'Google Sheets' ? (
                  <span className="muted-text">{notes[signup.memberId] || '—'}</span>
                ) : (
                  <input disabled={!canManage} value={notes[signup.memberId] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [signup.memberId]: event.target.value }))} placeholder="Optional note…" />
                )}
              </div>
            ))}
            {canManage && selectedSession.source !== 'Google Sheets' ? <div className="attendance-actions"><button className="primary-button" disabled={saving} type="button" onClick={() => void save()}><CheckCircle2 size={16} /> {saving ? 'Saving…' : 'Save attendance'}</button></div> : null}
          </section>
        </>
      ) : !loading ? <section className="glass-card empty-state"><h1>No attendance to record</h1><p>Sessions will appear here after members sign up.</p></section> : <section className="glass-card empty-state"><RefreshCw className="spin-icon" size={20} /><h1>Loading attendance…</h1></section>}
    </>
  );
}

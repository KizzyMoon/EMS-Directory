import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../../components/PageHeader';
import { StatusBadge } from '../../../components/StatusBadge';
import { TrainingNav } from '../components/TrainingNav';
import { mockTrainingSessions } from '../data/mockTrainingSessions';
import type { AttendanceStatus } from '../types';
import { formatTrainingDate } from '../utils';

const attendanceOptions: AttendanceStatus[] = ['Pending', 'Attended', 'Late', 'No Show', 'Cancelled', 'Excused'];

export function TrainingAttendancePage() {
  const completedSession = mockTrainingSessions.find((session) => session.status === 'Completed') ?? mockTrainingSessions[0];
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(completedSession.attendance.map((item) => [item.memberId, item.status])),
  );

  return (
    <>
      <PageHeader eyebrow="Training module" title="Attendance" description="Record attendance without editing a spreadsheet." />
      <TrainingNav />

      <section className="glass-card attendance-header">
        <div><p className="eyebrow">{completedSession.type}</p><h2>{completedSession.title}</h2><span>{formatTrainingDate(completedSession.date)} · {completedSession.startTime}</span></div>
        <StatusBadge tone="green">{completedSession.status}</StatusBadge>
      </section>

      <section className="glass-card attendance-card">
        <div className="attendance-table attendance-table-head"><span>Member</span><span>Role</span><span>Attendance</span><span>Notes</span></div>
        {completedSession.signups.map((signup) => (
          <div className="attendance-table attendance-row" key={signup.id}>
            <div><strong>{signup.memberName}</strong><span className="mono-value">{signup.callsign}</span></div>
            <span>{signup.role}</span>
            <select value={attendance[signup.memberId] ?? 'Pending'} onChange={(e) => setAttendance((current) => ({ ...current, [signup.memberId]: e.target.value as AttendanceStatus }))}>
              {attendanceOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <input placeholder="Optional note…" />
          </div>
        ))}
        <div className="attendance-actions"><button className="primary-button"><CheckCircle2 size={16} /> Save attendance</button></div>
      </section>
    </>
  );
}

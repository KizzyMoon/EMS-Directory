import { useEffect, useState, type FormEvent } from 'react';
import { Archive, Save, X } from 'lucide-react';
import { isBackendConfigured } from '../config/env';
import { archiveRosterMember, createRosterMember, updateRosterMember } from '../lib/rosterApi';
import { EMS_RANKS, type EmsMember, type MemberStatus, type RosterMemberInput } from '../types/member';

interface MemberEditorDrawerProps {
  member?: EmsMember | null;
  open: boolean;
  onClose: () => void;
  onSaved: (member: EmsMember | null) => void;
}

const emptyMember: RosterMemberInput = {
  rank: 'Cadet',
  callsign: '',
  name: '',
  employeeNumber: '',
  steamName: '',
  timezone: 'UK',
  status: 'Active',
  qualifications: { fto: false, hart: false, met: false, doctor: false },
};

function toInput(member?: EmsMember | null): RosterMemberInput {
  if (!member) return emptyMember;
  return {
    rank: member.rank,
    callsign: member.callsign,
    name: member.name,
    employeeNumber: member.employeeNumber,
    steamName: member.steamName,
    timezone: member.timezone,
    status: member.status,
    qualifications: { ...member.qualifications },
  };
}

export function MemberEditorDrawer({ member, open, onClose, onSaved }: MemberEditorDrawerProps) {
  const [form, setForm] = useState<RosterMemberInput>(() => toInput(member));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toInput(member));
      setError(null);
    }
  }, [member, open]);

  if (!open) return null;

  function setField<Key extends keyof RosterMemberInput>(key: Key, value: RosterMemberInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isBackendConfigured) {
      setError('Roster editing is disabled in local setup mode. Connect the Worker first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = member
        ? await updateRosterMember(member.id, form)
        : await createRosterMember(form);
      onSaved(saved);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save this member.');
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!member || !window.confirm(`Archive ${member.name}? They will be removed from the active roster but their record will be retained.`)) return;
    setSaving(true);
    setError(null);
    try {
      await archiveRosterMember(member.id);
      onSaved(null);
      onClose();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive this member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className="drawer-backdrop" aria-label="Close member editor" onClick={onClose} />
      <aside className="session-drawer member-editor-drawer" aria-label={member ? 'Edit roster member' : 'Add roster member'}>
        <header className="drawer-header">
          <div><p className="eyebrow">Personnel</p><h2>{member ? 'Edit member' : 'Add member'}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>

        <form className="session-form" onSubmit={submit}>
          <div className="form-row">
            <label><span>Name</span><input required value={form.name} onChange={(event) => setField('name', event.target.value)} /></label>
            <label><span>Callsign</span><input required value={form.callsign} onChange={(event) => setField('callsign', event.target.value)} placeholder="M7-01" /></label>
          </div>
          <div className="form-row">
            <label><span>Employee number</span><input required value={form.employeeNumber} onChange={(event) => setField('employeeNumber', event.target.value)} /></label>
            <label><span>Rank</span><select value={form.rank} onChange={(event) => setField('rank', event.target.value as RosterMemberInput['rank'])}>{EMS_RANKS.map((rank) => <option key={rank}>{rank}</option>)}</select></label>
          </div>
          <div className="form-row">
            <label><span>Steam name</span><input value={form.steamName} onChange={(event) => setField('steamName', event.target.value)} /></label>
            <label><span>Timezone</span><input required value={form.timezone} onChange={(event) => setField('timezone', event.target.value)} placeholder="UK / EU / NA" /></label>
          </div>
          <label><span>Status</span><select value={form.status} onChange={(event) => setField('status', event.target.value as MemberStatus)}><option>Active</option><option>LOA</option><option>Inactive</option></select></label>

          <fieldset className="qualification-editor">
            <legend>Qualifications</legend>
            {(['fto', 'hart', 'met', 'doctor'] as const).map((qualification) => (
              <label key={qualification}>
                <input
                  type="checkbox"
                  checked={form.qualifications[qualification]}
                  onChange={(event) => setField('qualifications', { ...form.qualifications, [qualification]: event.target.checked })}
                />
                <span>{qualification.toUpperCase()}</span>
              </label>
            ))}
          </fieldset>

          {error ? <div className="status-note red-note">{error}</div> : null}

          <div className="drawer-actions member-editor-actions">
            {member ? <button className="danger-button" disabled={saving} type="button" onClick={() => void archive()}><Archive size={16} /> Archive</button> : null}
            <span className="drawer-action-spacer" />
            <button className="secondary-button" disabled={saving} type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" disabled={saving} type="submit"><Save size={16} /> {saving ? 'Saving…' : 'Save member'}</button>
          </div>
        </form>
      </aside>
    </>
  );
}

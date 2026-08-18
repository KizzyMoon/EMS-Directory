import { X } from 'lucide-react';
import { useState } from 'react';
import { createTrainingSession } from '../../../lib/trainingApi';
import type { TrainingSession, TrainingType } from '../types';

interface CreateSessionDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (session: TrainingSession) => void;
}

export function CreateSessionDrawer({ open, onClose, onCreated }: CreateSessionDrawerProps) {
  const [type, setType] = useState<TrainingType>('Day 1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <>
      <button className="drawer-backdrop" aria-label="Close new session form" onClick={onClose} />
      <aside className="session-drawer" aria-label="Create training session">
        <header className="drawer-header">
          <div>
            <p className="eyebrow">Training</p>
            <h2>New session</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </header>

        <form className="session-form" onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          setSaving(true);
          setError(null);
          try {
            const session = await createTrainingSession({
              type,
              title: String(data.get('title') ?? ''),
              date: String(data.get('date') ?? ''),
              startTime: String(data.get('startTime') ?? ''),
              endTime: String(data.get('endTime') ?? ''),
              cadetCapacity: Number(data.get('cadetCapacity')),
              ftoCapacity: Number(data.get('ftoCapacity')),
              location: String(data.get('location') ?? ''),
              server: String(data.get('server') ?? ''),
              notes: String(data.get('notes') ?? ''),
            });
            onCreated?.(session);
            onClose();
            form.reset();
          } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Unable to create the training session.');
          } finally {
            setSaving(false);
          }
        }}>
          <label>
            <span>Training type</span>
            <select name="type" value={type} onChange={(event) => setType(event.target.value as TrainingType)}>
              <option>Day 1</option>
              <option>Day 2</option>
              <option>Other Training</option>
              <option>Probationer Test</option>
            </select>
          </label>

          <label><span>Session title</span><input name="title" defaultValue="Day 1 Training" required /></label>

          <div className="form-row">
            <label><span>Date</span><input name="date" type="date" required /></label>
            <label><span>Start time</span><input name="startTime" type="time" required /></label>
          </div>

          <div className="form-row">
            <label><span>End time</span><input name="endTime" type="time" required /></label>
          </div>

          <div className="form-row">
            <label><span>Cadet capacity</span><input name="cadetCapacity" type="number" min="1" defaultValue="6" /></label>
            <label><span>FTO capacity</span><input name="ftoCapacity" type="number" min="1" defaultValue="2" /></label>
          </div>

          <label><span>Location</span><input name="location" defaultValue="Pillbox Medical" required /></label>
          <label><span>Server</span><input name="server" defaultValue="Training Server" required /></label>
          <label><span>Notes</span><textarea name="notes" rows={5} placeholder="Add anything attendees need to know…" /></label>

          {error ? <div className="status-note red-note">{error}</div> : null}

          <div className="drawer-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create session'}</button>
          </div>
        </form>
      </aside>
    </>
  );
}

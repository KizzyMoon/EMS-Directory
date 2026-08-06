import { X } from 'lucide-react';
import { useState } from 'react';
import type { TrainingType } from '../types';

interface CreateSessionDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CreateSessionDrawer({ open, onClose }: CreateSessionDrawerProps) {
  const [type, setType] = useState<TrainingType>('Day 1');

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

        <form className="session-form" onSubmit={(event) => { event.preventDefault(); onClose(); }}>
          <label>
            <span>Training type</span>
            <select value={type} onChange={(event) => setType(event.target.value as TrainingType)}>
              <option>Day 1</option>
              <option>Day 2</option>
              <option>Other Training</option>
              <option>Probationer Test</option>
            </select>
          </label>

          <div className="form-row">
            <label><span>Date</span><input type="date" required /></label>
            <label><span>Start time</span><input type="time" required /></label>
          </div>

          <div className="form-row">
            <label><span>Cadet capacity</span><input type="number" min="1" defaultValue="6" /></label>
            <label><span>FTO capacity</span><input type="number" min="1" defaultValue="2" /></label>
          </div>

          <label><span>Location</span><input defaultValue="Pillbox Medical" /></label>
          <label><span>Server</span><input defaultValue="Training Server" /></label>
          <label><span>Notes</span><textarea rows={5} placeholder="Add anything attendees need to know…" /></label>

          <div className="drawer-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit">Create session</button>
          </div>
        </form>
      </aside>
    </>
  );
}

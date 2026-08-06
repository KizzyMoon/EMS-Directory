import { PageHeader } from '../components/PageHeader';

const sections = [
  ['Treatments', 'MVA, BFT, GSW, falls, burns, drowning and unresponsive protocols'],
  ['Medication', 'Pain levels, medication names and dosage quick checks'],
  ['10-Codes', 'Radio meanings, call-outs and common response examples'],
  ['PD / BCSO Scenes', 'Stand-off distance, Code 2 standby, Code 4 entry and escort procedure'],
  ['Morgue & ICU', 'Formats, timings, DOA / DOS / TOD and suspect handling'],
  ['DNA', 'When DNA testing is permitted and the swab process'],
  ['Dispatch Icons', '10-21, 10-33, 10-50, 10-52, 10-13 and robbery icons'],
  ['Tracker Colours', 'Cadet, probationer, EMT, supervisor, chief and doctor colours'],
  ['Controls', 'Ambulance lights, sirens, F5 menu, doors and stretcher usage'],
  ['Emotes', 'Treatment, ICU, clipboard and carrying emotes'],
];

export function QuickReferencePage() {
  return (
    <>
      <PageHeader
        eyebrow="Second-monitor tools"
        title="Quick Reference"
        description="Fast, searchable information for use during roleplay."
      />
      <input className="field reference-search" type="search" placeholder="Search treatments, codes, icons or procedures…" />
      <div className="reference-grid">
        {sections.map(([title, description]) => (
          <button className="glass-card reference-card" key={title} type="button">
            <strong>{title}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>
    </>
  );
}

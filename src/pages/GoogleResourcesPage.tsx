import { ExternalLink, FileText, Sheet } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

type ResourceSection = 'training' | 'tests' | 'knowledge' | 'forms';

interface GoogleResourcesPageProps {
  section: ResourceSection;
}

const resources = {
  training: {
    title: 'Training Sheets',
    description: 'Open the current Google Sheets used for training bookings and cadet progress.',
    items: [
      { title: 'Training Attendance Sheet', description: 'Current EU and NA Day 1/Day 2 sessions, cadet bookings, FTOs and helpers.', kind: 'sheet', url: 'https://docs.google.com/spreadsheets/d/1twcPjyyf3tuwq4L12OhmLz6QkF9_u8I5ai5qn9wAisg/edit' },
      { title: 'Cadet Progress Tracker', description: 'The existing detailed cadet training tracker. Google access is still required.', kind: 'sheet', url: 'https://docs.google.com/spreadsheets/d/1g3XXntoqyA9XMgEcXwq89RyqBUymJCpVbG1vlE4BSPY/edit#gid=1321749468' },
      { title: 'EMS Roster', description: 'The main personnel roster currently used by EMS Directory.', kind: 'sheet', url: 'https://docs.google.com/spreadsheets/d/1b9RV4HZh2Klex6jEq8YarlpzpDMt0F4ohV_GscHbSb8/edit#gid=647224122' },
    ],
  },
  tests: {
    title: 'Probationer Tests',
    description: 'Open the current Google records used for probationer and interview administration.',
    items: [
      { title: 'EMS Interview Records', description: 'Current interview and probationer records. Google access is still required.', kind: 'sheet', url: 'https://docs.google.com/spreadsheets/d/1ZxxFzXMv2BS9bDO3fJUpNWEYe-0767W-fslO1bbsv78/edit#gid=401572911' },
      { title: 'Cadet Progress Tracker', description: 'Detailed cadet progress and training completion records.', kind: 'sheet', url: 'https://docs.google.com/spreadsheets/d/1g3XXntoqyA9XMgEcXwq89RyqBUymJCpVbG1vlE4BSPY/edit#gid=1321749468' },
    ],
  },
  knowledge: {
    title: 'Knowledge Base',
    description: 'Current EMS guides and reference documents from Google Drive.',
    items: [
      { title: "Cadets' Training Guide", description: 'The current training guide used by EMS cadets.', kind: 'doc', url: 'https://docs.google.com/document/d/1vqTfoWqwhHayM07EmD5B1nwMgi5_qs_qy58ILpILp5U/edit' },
      { title: 'Medical Codes', description: 'The current EMS medical codes reference.', kind: 'doc', url: 'https://docs.google.com/document/d/1_64qj93IXBHMhC9oxniPwaE1ROYzmuNQrGsPm8cq5qU/edit' },
      { title: 'Quick Reference', description: 'Searchable EMS codes and procedures available directly in EMS Directory.', kind: 'internal', url: '#/quick-reference' },
    ],
  },
  forms: {
    title: 'Forms',
    description: 'Current EMS form templates and operational sheets from Google Drive.',
    items: [
      { title: 'EMS Civilian Ride-Along Template', description: 'The current Google Docs template for civilian ride-alongs.', kind: 'doc', url: 'https://docs.google.com/document/d/1h_vQqgyyp3pxIhdy1AX5gAbXGSrlHbVUE4mNFuJouWk/edit' },
      { title: 'Training Attendance Sheet', description: 'Current session booking and attendance form.', kind: 'sheet', url: 'https://docs.google.com/spreadsheets/d/1twcPjyyf3tuwq4L12OhmLz6QkF9_u8I5ai5qn9wAisg/edit' },
    ],
  },
} as const;

export function GoogleResourcesPage({ section }: GoogleResourcesPageProps) {
  const content = resources[section];
  return (
    <>
      <PageHeader title={content.title} description={content.description} />
      <div className="status-note blue-note resource-note">These are the real Google sources currently in use. Restricted files will open only for Google accounts that already have permission.</div>
      <section className="resource-grid">
        {content.items.map((item) => {
          const Icon = item.kind === 'sheet' ? Sheet : FileText;
          const external = item.kind !== 'internal';
          return (
            <a className="glass-card resource-card" href={item.url} key={item.url} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
              <span className="resource-icon"><Icon size={20} /></span>
              <span><strong>{item.title}</strong><small>{item.description}</small></span>
              <ExternalLink size={16} />
            </a>
          );
        })}
      </section>
    </>
  );
}

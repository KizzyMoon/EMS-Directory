import { BookOpen, ExternalLink, FileHeart, Search, Stethoscope } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';

const references = [
  {
    title: 'Medical Codes',
    category: 'Clinical reference',
    description: 'Open the current MED CODES document from the EMS Google Drive.',
    url: 'https://docs.google.com/document/d/1_64qj93IXBHMhC9oxniPwaE1ROYzmuNQrGsPm8cq5qU/edit',
    icon: FileHeart,
  },
  {
    title: "Cadets' Training Guide",
    category: 'Training',
    description: 'Open the current guide used for EMS cadet training.',
    url: 'https://docs.google.com/document/d/1vqTfoWqwhHayM07EmD5B1nwMgi5_qs_qy58ILpILp5U/edit',
    icon: BookOpen,
  },
  {
    title: 'Icon Guide',
    category: 'Operational reference',
    description: 'Open the current shared icon guide from Google Drive.',
    url: 'https://docs.google.com/document/d/1BI931cPqewp-xqRV7bqmtQXLU4A6Pujn9P3o7zHGkEg/edit',
    icon: BookOpen,
  },
  {
    title: 'MET & DOC Collaboration',
    category: 'Specialist medicine',
    description: 'Open the current shared MET and Doctor collaboration document.',
    url: 'https://docs.google.com/document/d/1nRftmhEQOcqxnpKotANCBDGs9qCmfvWWYFMcQP8z6RE/edit',
    icon: Stethoscope,
  },
] as const;

export function QuickReferencePage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return references;
    return references.filter((reference) => `${reference.title} ${reference.category} ${reference.description}`.toLowerCase().includes(search));
  }, [query]);

  return (
    <>
      <PageHeader
        eyebrow="Second-monitor tools"
        title="Quick Reference"
        description="Search and open the current EMS reference documents from Google Drive."
      />
      <label className="search-box reference-search" htmlFor="reference-search">
        <Search size={18} />
        <input id="reference-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the live EMS references…" />
      </label>
      <div className="reference-grid">
        {filtered.map(({ title, category, description, url, icon: Icon }) => (
          <a className="glass-card reference-card" href={url} target="_blank" rel="noreferrer" key={url}>
            <span className="resource-icon"><Icon size={20} /></span>
            <strong>{title}</strong>
            <small>{category}</small>
            <span>{description}</span>
            <span className="inline-link">Open in Google Docs <ExternalLink size={14} /></span>
          </a>
        ))}
        {!filtered.length ? <section className="glass-card empty-state"><strong>No matching references</strong><p>Try a broader search.</p></section> : null}
      </div>
    </>
  );
}

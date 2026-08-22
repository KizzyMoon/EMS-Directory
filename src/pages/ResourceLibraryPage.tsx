import {
  BookOpen,
  ClipboardCheck,
  ExternalLink,
  FileHeart,
  FileText,
  Search,
  Sheet,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../auth/permissions';
import { PageHeader } from '../components/PageHeader';

const resourceGroups = [
  {
    title: 'Clinical & operational references',
    description: 'Everyday medical guidance and specialist operating references.',
    items: [
      {
        title: 'Medical Codes',
        description: 'Current EMS medical codes and clinical reference.',
        url: 'https://docs.google.com/document/d/1_64qj93IXBHMhC9oxniPwaE1ROYzmuNQrGsPm8cq5qU/edit',
        icon: FileHeart,
        staffOnly: false,
      },
      {
        title: 'Icon Guide',
        description: 'Shared guide to the icons used in EMS systems and records.',
        url: 'https://docs.google.com/document/d/1BI931cPqewp-xqRV7bqmtQXLU4A6Pujn9P3o7zHGkEg/edit',
        icon: BookOpen,
        staffOnly: false,
      },
      {
        title: 'MET & DOC Collaboration',
        description: 'Current MET and Doctor collaboration procedures.',
        url: 'https://docs.google.com/document/d/1nRftmhEQOcqxnpKotANCBDGs9qCmfvWWYFMcQP8z6RE/edit',
        icon: Stethoscope,
        staffOnly: false,
      },
    ],
  },
  {
    title: 'Training & cadets',
    description: 'Guides, bookings, attendance and cadet progression.',
    items: [
      {
        title: "Cadets' Training Guide",
        description: 'Current training guide used by EMS cadets.',
        url: 'https://docs.google.com/document/d/1vqTfoWqwhHayM07EmD5B1nwMgi5_qs_qy58ILpILp5U/edit',
        icon: BookOpen,
        staffOnly: false,
      },
      {
        title: 'Training Attendance Sheet',
        description: 'EU and NA sessions, cadet bookings, FTOs and attendance.',
        url: 'https://docs.google.com/spreadsheets/d/1twcPjyyf3tuwq4L12OhmLz6QkF9_u8I5ai5qn9wAisg/edit',
        icon: Sheet,
        staffOnly: true,
      },
      {
        title: 'Cadet Progress Tracker',
        description: 'Detailed cadet progress, deadlines and training completion records.',
        url: 'https://docs.google.com/spreadsheets/d/1g3XXntoqyA9XMgEcXwq89RyqBUymJCpVbG1vlE4BSPY/edit#gid=1321749468',
        icon: ClipboardCheck,
        staffOnly: true,
      },
    ],
  },
  {
    title: 'Recruitment & assessment',
    description: 'Restricted records used for interviews and probationer administration.',
    items: [
      {
        title: 'EMS Interview Records',
        description: 'Current interview and probationer assessment records.',
        url: 'https://docs.google.com/spreadsheets/d/1ZxxFzXMv2BS9bDO3fJUpNWEYe-0767W-fslO1bbsv78/edit#gid=401572911',
        icon: ShieldCheck,
        staffOnly: true,
      },
    ],
  },
  {
    title: 'Forms & templates',
    description: 'Reusable documents for operational records.',
    items: [
      {
        title: 'EMS Civilian Ride-Along Template',
        description: 'Current Google Docs template for civilian ride-alongs.',
        url: 'https://docs.google.com/document/d/1h_vQqgyyp3pxIhdy1AX5gAbXGSrlHbVUE4mNFuJouWk/edit',
        icon: FileText,
        staffOnly: true,
      },
    ],
  },
] as const;

export function ResourceLibraryPage() {
  const { user } = useAuth();
  const canReadStaffResources = hasPermission(user, 'fto_resources.read');
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const search = query.trim().toLowerCase();
    return resourceGroups.flatMap((group) => {
      const items = group.items.filter((item) => {
        if (item.staffOnly && !canReadStaffResources) return false;
        return !search || `${group.title} ${item.title} ${item.description}`.toLowerCase().includes(search);
      });
      return items.length ? [{ ...group, items }] : [];
    });
  }, [canReadStaffResources, query]);

  return (
    <>
      <PageHeader
        eyebrow="EMS documents"
        title="Resource Library"
        description="Find the current EMS guides, records, sheets and templates in one place."
      />

      <label className="search-box reference-search" htmlFor="resource-search">
        <Search size={18} />
        <input id="resource-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources…" />
      </label>

      <div className="status-note blue-note resource-note">
        Restricted resources are shown only to authorised ranks and still require access through the connected Google account.
      </div>

      <div className="resource-library">
        {groups.map((group) => (
          <section className="resource-library-section" key={group.title}>
            <header>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </header>
            <div className="resource-grid">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <a className="glass-card resource-card" href={item.url} target="_blank" rel="noreferrer" key={item.url}>
                    <span className="resource-icon"><Icon size={20} /></span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                      {item.staffOnly ? <em>Restricted resource</em> : null}
                    </span>
                    <ExternalLink size={16} />
                  </a>
                );
              })}
            </div>
          </section>
        ))}
        {!groups.length ? <section className="glass-card empty-state"><strong>No matching resources</strong><p>Try a broader search.</p></section> : null}
      </div>
    </>
  );
}

import { RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import { getDiscordLinkCandidates, linkDiscordAccount } from '../lib/discordLinkingApi';
import type { EmsMember } from '../types/member';

export function DiscordLinkingPage() {
  const [members, setMembers] = useState<EmsMember[]>([]);
  const [memberLookup, setMemberLookup] = useState('');
  const [discordUserId, setDiscordUserId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedMember = useMemo(() => {
    const lookup = memberLookup.trim().toLowerCase();
    return members.find((member) =>
      member.callsign.toLowerCase() === lookup
      || member.employeeNumber.toLowerCase() === lookup
      || member.name.toLowerCase() === lookup,
    ) ?? null;
  }, [memberLookup, members]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await getDiscordLinkCandidates());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load roster members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    setDiscordUserId(selectedMember?.discordUserId ?? '');
  }, [selectedMember]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedMember) {
      setError('Choose a roster member by callsign or employee number.');
      return;
    }
    if (!/^[0-9]{16,25}$/.test(discordUserId.trim())) {
      setError('Discord user ID must contain 16 to 25 digits.');
      return;
    }

    setSaving(true);
    try {
      const member = await linkDiscordAccount(selectedMember.id, discordUserId.trim(), note);
      setMembers((current) => current.map((item) => item.id === member.id ? member : item));
      setSuccess(`${member.name} is now linked to Discord user ${member.discordUserId}.`);
      setNote('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the Discord link.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Discord ID linking"
        description="Use this while the roster is being completed manually. Store Discord user IDs, not usernames."
      />

      <form className="glass-card form-card" onSubmit={submit}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Manual roster match</p>
            <h2>Link a Discord account</h2>
          </div>
          <ShieldCheck size={18} />
        </div>

        <div className="form-grid">
          <label>
            <span>Member callsign or employee number</span>
            <input
              className="field"
              type="text"
              list="discord-link-members"
              value={memberLookup}
              onChange={(event) => {
                setMemberLookup(event.target.value);
                setSuccess(null);
              }}
              placeholder="M7-01"
              disabled={loading}
              required
            />
            <datalist id="discord-link-members">
              {members.map((member) => (
                <option key={member.id} value={member.callsign || member.employeeNumber || member.name}>
                  {member.name} · {member.employeeNumber}
                </option>
              ))}
            </datalist>
          </label>
          <label>
            <span>Discord user ID</span>
            <input
              className="field"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{16,25}"
              value={discordUserId}
              onChange={(event) => setDiscordUserId(event.target.value)}
              placeholder="123456789012345678"
              required
            />
          </label>
          <label>
            <span>Display note</span>
            <input
              className="field"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Verified in Discord by senior staff"
            />
          </label>
        </div>

        {loading ? <div className="status-note blue-note"><RefreshCw className="spin-icon" size={16} /> Loading roster members…</div> : null}
        {selectedMember ? (
          <div className="status-note blue-note">
            {selectedMember.name} · {selectedMember.callsign} · {selectedMember.discordUserId ? `Currently linked to ${selectedMember.discordName} (${selectedMember.discordUserId})` : 'No Discord account linked'}
          </div>
        ) : null}
        {error ? <div className="status-note red-note">{error}</div> : null}
        {success ? <div className="status-note green-note">{success}</div> : null}

        <button className="primary-button" disabled={loading || saving} type="submit">
          <Save size={16} /> {saving ? 'Saving…' : 'Save link'}
        </button>
      </form>
    </>
  );
}

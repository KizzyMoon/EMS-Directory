export interface GoogleRosterMember {
  rank: string;
  callsign: string;
  name: string;
  employeeNumber: string;
  steamName: string;
  discordName: string;
  timezone: string;
  qualifications: {
    fto: boolean;
    hart: boolean;
    met: boolean;
    doctor: boolean;
  };
}

export interface GoogleTrainingBookings {
  dayOne: Set<string>;
  dayTwo: Set<string>;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

let rosterCache: CacheEntry<GoogleRosterMember[]> | null = null;
let trainingCache: CacheEntry<GoogleTrainingBookings> | null = null;

export function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n') {
      row.push(value.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

async function fetchCsv(url: string) {
  const response = await fetch(url, { headers: { accept: 'text/csv' } });
  if (!response.ok) throw new Error(`Google Sheets request failed: ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/csv')) throw new Error('Google Sheets did not return CSV data');
  return parseCsv(await response.text());
}

function cell(row: string[], index: number) {
  return (row[index] ?? '').trim();
}

function booleanCell(row: string[], index: number) {
  return cell(row, index).toLowerCase() === 'true';
}

export async function readGoogleRoster(url: string, forceRefresh = false) {
  if (!forceRefresh && rosterCache && rosterCache.expiresAt > Date.now()) return rosterCache.value;
  const rows = await fetchCsv(url);
  const headerRow = rows.findIndex((row) => row.includes('Callsign') && row.includes('Employee Number'));
  if (headerRow < 0) throw new Error('Google roster headers were not found');
  const headers = rows[headerRow];
  const column = (name: string) => headers.indexOf(name);
  const indexes = {
    rank: headers.findIndex((value) => value === 'Rank' || value.endsWith(' Rank')),
    callsign: column('Callsign'),
    name: column('Name'),
    employeeNumber: column('Employee Number'),
    steamName: column('Steam Name'),
    discordName: column('Discord ID'),
    timezone: column('Timezone'),
    fto: column('FTO'),
    hart: column('HART'),
    met: column('MET'),
    doctor: column('Doctor'),
  };
  if (Object.values(indexes).some((index) => index < 0)) throw new Error('Google roster columns have changed');

  const roster = rows.slice(headerRow + 1).flatMap((row) => {
    const callsign = cell(row, indexes.callsign);
    const employeeNumber = cell(row, indexes.employeeNumber);
    if (!callsign || !employeeNumber || !/^M\d+-\d+$/i.test(callsign)) return [];
    return [{
      rank: cell(row, indexes.rank),
      callsign,
      name: cell(row, indexes.name),
      employeeNumber,
      steamName: cell(row, indexes.steamName),
      discordName: cell(row, indexes.discordName),
      timezone: cell(row, indexes.timezone),
      qualifications: {
        fto: booleanCell(row, indexes.fto),
        hart: booleanCell(row, indexes.hart),
        met: booleanCell(row, indexes.met),
        doctor: booleanCell(row, indexes.doctor),
      },
    }];
  });
  if (roster.length < 10) throw new Error('Google roster returned too few members');
  rosterCache = { expiresAt: Date.now() + 60_000, value: roster };
  return roster;
}

export async function readGoogleTrainingBookings(url: string, forceRefresh = false) {
  if (!forceRefresh && trainingCache && trainingCache.expiresAt > Date.now()) return trainingCache.value;
  const rows = await fetchCsv(url);
  const inputRow = rows.findIndex((row) => row.some((value) => value.includes('Input Employee # here')));
  if (inputRow < 0) throw new Error('Google training booking columns were not found');
  const bookingColumns = rows[inputRow]
    .map((value, index) => value.includes('Input Employee # here') ? index : -1)
    .filter((index) => index >= 0);
  const bookings: GoogleTrainingBookings = { dayOne: new Set(), dayTwo: new Set() };

  bookingColumns.forEach((column) => {
    const title = rows.slice(0, inputRow)
      .map((row) => cell(row, column))
      .find((value) => /DAY [12]/i.test(value));
    if (!title) return;
    const destination = /DAY 2/i.test(title) ? bookings.dayTwo : bookings.dayOne;
    rows.slice(inputRow + 1).forEach((row) => {
      const employeeNumber = cell(row, column);
      if (/^\d+$/.test(employeeNumber)) destination.add(employeeNumber);
    });
  });
  trainingCache = { expiresAt: Date.now() + 60_000, value: bookings };
  return bookings;
}

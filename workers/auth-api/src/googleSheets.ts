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
  dayOneComplete: Set<string>;
  dayTwoComplete: Set<string>;
}

export interface GoogleTrainingAttendee {
  employeeNumber: string;
  name: string;
  complete: boolean;
}

export interface GoogleTrainingSession {
  id: string;
  type: 'Day 1' | 'Day 2';
  title: string;
  date: string;
  startTime: string;
  timezone: string;
  host: string;
  cadetCapacity: number;
  ftoCapacity: number;
  cadets: GoogleTrainingAttendee[];
  ftos: GoogleTrainingAttendee[];
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

let rosterCache: CacheEntry<GoogleRosterMember[]> | null = null;
let trainingCache: CacheEntry<GoogleTrainingBookings> | null = null;
let trainingSessionsCache: CacheEntry<GoogleTrainingSession[]> | null = null;

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
  const staffRow = rows.findIndex((row) => row.some((value) => value.includes("Supervisors, FTO's & Helpers Sign up Below")));
  if (inputRow < 0 || staffRow <= inputRow) throw new Error('Google training booking columns were not found');
  const bookingColumns = rows[inputRow]
    .map((value, index) => value.includes('Input Employee # here') ? index : -1)
    .filter((index) => index >= 0);
  const bookings: GoogleTrainingBookings = {
    dayOne: new Set(),
    dayTwo: new Set(),
    dayOneComplete: new Set(),
    dayTwoComplete: new Set(),
  };

  bookingColumns.forEach((column) => {
    const title = rows.slice(0, inputRow)
      .map((row) => cell(row, column))
      .find((value) => /DAY [12]/i.test(value));
    if (!title) return;
    const destination = /DAY 2/i.test(title) ? bookings.dayTwo : bookings.dayOne;
    const completionDestination = /DAY 2/i.test(title) ? bookings.dayTwoComplete : bookings.dayOneComplete;
    rows.slice(inputRow + 1, staffRow).forEach((row) => {
      const employeeNumber = cell(row, column);
      if (/^\d+$/.test(employeeNumber)) {
        destination.add(employeeNumber);
        if (booleanCell(row, column + 3)) completionDestination.add(employeeNumber);
      }
    });
  });
  trainingCache = { expiresAt: Date.now() + 60_000, value: bookings };
  return bookings;
}

function parseSheetDate(value: string) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) throw new Error(`Google training date is invalid: ${value}`);
  const [, month, day, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseSheetTime(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*([A-Z]+)?$/i);
  if (!match) throw new Error(`Google training time is invalid: ${value}`);
  const [, rawHour, rawMinute = '00', meridiem, timezone = ''] = match;
  let hour = Number(rawHour) % 12;
  if (meridiem.toLowerCase() === 'pm') hour += 12;
  return { time: `${String(hour).padStart(2, '0')}:${rawMinute}`, timezone: timezone.toUpperCase() };
}

function attendees(rows: string[][], column: number, start: number, end: number) {
  return rows.slice(start, end).flatMap((row) => {
    const employeeNumber = cell(row, column);
    if (!/^\d+$/.test(employeeNumber)) return [];
    return [{ employeeNumber, name: cell(row, column + 1), complete: booleanCell(row, column + 3) }];
  });
}

export async function readGoogleTrainingSessions(url: string, forceRefresh = false) {
  if (!forceRefresh && trainingSessionsCache && trainingSessionsCache.expiresAt > Date.now()) return trainingSessionsCache.value;
  const rows = await fetchCsv(url);
  const inputRow = rows.findIndex((row) => row.some((value) => value.includes('Input Employee # here')));
  const staffRow = rows.findIndex((row) => row.some((value) => value.includes("Supervisors, FTO's & Helpers Sign up Below")));
  if (inputRow < 0 || staffRow <= inputRow) throw new Error('Google training session sections were not found');

  const bookingColumns = rows[inputRow]
    .map((value, index) => value.includes('Input Employee # here') ? index : -1)
    .filter((index) => index >= 0);
  const sessions = bookingColumns.map((column) => {
    const titleCell = rows.slice(0, inputRow)
      .map((row) => cell(row, column))
      .find((value) => /(EU|NA)\s+DAY\s+[12]\s*Training/i.test(value));
    const titleMatch = titleCell?.match(/(EU|NA)\s+DAY\s+([12])\s*Training/i);
    if (!titleMatch) throw new Error('Google training title is invalid');
    const region = titleMatch[1].toUpperCase();
    const day = titleMatch[2];
    const date = parseSheetDate(cell(rows[1], column + 1));
    const parsedTime = parseSheetTime(cell(rows[1], column + 2));
    return {
      id: `google-${region.toLowerCase()}-day-${day}-${date}`,
      type: `Day ${day}` as 'Day 1' | 'Day 2',
      title: `${region} Day ${day} Training`,
      date,
      startTime: parsedTime.time,
      timezone: parsedTime.timezone,
      host: cell(rows[1], column),
      cadetCapacity: staffRow - inputRow - 1,
      ftoCapacity: rows.length - staffRow - 1,
      cadets: attendees(rows, column, inputRow + 1, staffRow),
      ftos: attendees(rows, column, staffRow + 1, rows.length),
    };
  });
  if (!sessions.length) throw new Error('Google training sheet returned no sessions');
  trainingSessionsCache = { expiresAt: Date.now() + 60_000, value: sessions };
  return sessions;
}

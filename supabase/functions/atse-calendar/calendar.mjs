export const TEAM_ID = '941b5001-2422-4ec2-86c0-cc6ac9239e0d';
export const escapeText = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
const stamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
export function fold(line) {
  let result = '', current = '', bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) { result += current + '\r\n'; current = ' '; bytes = 1; }
    current += char; bytes += size;
  }
  return result + current;
}
export function projectGame(row) {
  const time = row.scheduled_start_at && Number.isFinite(Date.parse(row.scheduled_start_at)) ? row.scheduled_start_at : null;
  const date = time ? new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time)) : row.metadata?.official_game_date;
  return {id:row.id, home:row.home.name, away:row.away.name, is_home:row.home_team_id === TEAM_ID,
    date: /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : null, start:time,
    venue: row.venue?.is_active ? [row.venue.name,row.venue.city].filter(Boolean).join(', ') : null,
    status:row.status, home_score:row.home_score, away_score:row.away_score,
    competition:row.competition.name, season:row.competition.season.name, updated_at:row.updated_at};
}
export function toCalendar(games) {
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Styrian Bastards//ATSE Spiele//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:ATSE Graz – Alle Spiele','X-WR-TIMEZONE:Europe/Vienna','REFRESH-INTERVAL;VALUE=DURATION:PT1H','X-PUBLISHED-TTL:PT1H'];
  for (const g of games) {
    if (!g.date) continue;
    const label = ({cancelled:'Abgesagt: ',postponed:'Verschoben: ',suspended:'Unterbrochen: '})[g.status] || '';
    lines.push('BEGIN:VEVENT',`UID:atse-${g.id}@styrian-bastards.at`,`DTSTAMP:${stamp(g.updated_at)}`,`LAST-MODIFIED:${stamp(g.updated_at)}`);
    if (g.start) lines.push(`DTSTART:${stamp(g.start)}`);
    else lines.push(`DTSTART;VALUE=DATE:${g.date.replace(/-/g,'')}`);
    // No invented end time: only the official start (or date) is known.
    lines.push(`SUMMARY:${escapeText(label + g.home + ' – ' + g.away)}`,
      `DESCRIPTION:${escapeText([g.is_home ? 'Heimspiel' : 'Auswärtsspiel',g.competition,!g.start ? 'Beginnzeit offen – vorläufig ganztägig eingetragen.' : 'Spielbeginn laut Gamecenter.','Aktuelle Informationen: https://www.styrian-bastards.at/atse-kalender.html'].filter(Boolean).join('\n'))}`,
      `LOCATION:${escapeText(g.venue || 'Spielort noch offen')}`,
      `STATUS:${g.status === 'cancelled' ? 'CANCELLED' : ['postponed','suspended'].includes(g.status) || !g.start ? 'TENTATIVE' : 'CONFIRMED'}`,
      'URL:https://www.styrian-bastards.at/atse-kalender.html','END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

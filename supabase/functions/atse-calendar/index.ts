import {TEAM_ID, projectGame, toCalendar} from './calendar.mjs';
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'};
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null,{headers});
  if (!['GET','HEAD'].includes(req.method)) return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD, OPTIONS'}});
  try {
    // Server credentials never leave this function. Only published ATSE fixtures and
    // an explicit public projection are returned; no member/helper data is queried.
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      if (offset >= 10000) throw new Error('Calendar safety limit');
      const url = new URL(Deno.env.get('SUPABASE_URL') + '/rest/v1/sports_games');
      url.searchParams.set('select','id,home_team_id,scheduled_start_at,status,home_score,away_score,updated_at,metadata,home:sports_teams!sports_games_home_team_id_fkey!inner(name,is_active),away:sports_teams!sports_games_away_team_id_fkey!inner(name,is_active),venue:sports_venues(name,city,is_active),competition:sports_competitions!inner(name,is_active,season:sports_seasons!inner(name),league:sports_leagues!inner(is_active))');
      url.searchParams.set('or',`(home_team_id.eq.${TEAM_ID},away_team_id.eq.${TEAM_ID})`);
      for (const [key,value] of Object.entries({'publication_state':'eq.published','is_archived':'eq.false','home.is_active':'eq.true','away.is_active':'eq.true','competition.is_active':'eq.true','competition.league.is_active':'eq.true','order':'id.asc','limit':'500','offset':String(offset)})) url.searchParams.set(key,value);
      const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const result = await fetch(url,{headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});
      if (!result.ok) throw new Error('Schedule unavailable');
      const batch = await result.json();
      if (!Array.isArray(batch)) throw new Error('Invalid schedule');
      rows.push(...batch);
      if (batch.length < 500) break;
    }
    const games = rows.map(projectGame).sort((a,b)=>(a.date || '9999').localeCompare(b.date || '9999') || a.id.localeCompare(b.id));
    const json = new URL(req.url).searchParams.get('format') === 'json';
    const body = json ? JSON.stringify({games,refreshed_at:new Date().toISOString()}) : toCalendar(games);
    return new Response(req.method === 'HEAD' ? null : body,{headers:{...headers,'Content-Type':json ? 'application/json; charset=utf-8' : 'text/calendar; charset=utf-8',...(json ? {} : {'Content-Disposition':'inline; filename="atse-graz.ics"'})}});
  } catch {
    // Never return a successful empty calendar on an upstream outage.
    return new Response('Spielplan derzeit nicht verfügbar. Bitte später erneut versuchen.',{status:503,headers:{...headers,'Cache-Control':'no-store','Retry-After':'300'}});
  }
});

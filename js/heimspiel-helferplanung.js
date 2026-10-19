(() => {
  // Public schedule only: production-published events are readable on every public host.
  const API_URL = 'https://yktioliukcrrccrfwxad.supabase.co';
  const state = document.getElementById('state');
  const games = document.getElementById('games');
  const format = new Intl.DateTimeFormat('de-AT', {dateStyle:'full',timeStyle:'short',timeZone:'Europe/Vienna'});
  const dateOnly = new Intl.DateTimeFormat('de-AT', {dateStyle:'full',timeZone:'Europe/Vienna'});
  async function load() {
    try {
      const key = 'sb_publishable__F_cerudLxOwAnlF0GobcA_qWi36mPu';
      const url = API_URL + '/rest/v1/home_game_helper_events?select=id,opponent_name,game_date,puck_drop_at,arrival_minutes_before&publication_state=eq.published&order=game_date.asc';
      const response = await fetch(url, {headers:{apikey:key, Accept: 'application/json'},cache:'no-store'});
      if (!response.ok) throw new Error('HTTP '+response.status+' '+(await response.text()).slice(0,250));
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Ungültige Antwort');
      games.replaceChildren();
      if (!data.length) {state.textContent = 'Derzeit sind keine Heimspiele veröffentlicht.'; return;}
      state.textContent = data.length + ' veröffentlichte Heimspiele';
      let rendered = 0;
      for (const game of data) {
        const puck = game.puck_drop_at ? new Date(game.puck_drop_at) : null;
        const hasTime = puck && Number.isFinite(puck.getTime());
        const day = game.game_date ? new Date(game.game_date + 'T12:00:00+02:00') : null;
        if (!hasTime && (!day || !Number.isFinite(day.getTime()))) continue;
        const mins = game.arrival_minutes_before == null ? 120 : Number(game.arrival_minutes_before);
        const arrival = hasTime ? new Date(puck.getTime() - (Number.isFinite(mins) && mins >= 0 ? mins : 120) * 60000) : null;
        const article = document.createElement('article');
        article.className = 'helper-game';
        const heading = document.createElement('h3');
        heading.textContent = 'ATSE Graz – ' + String(game.opponent_name || 'Heimspiel');
        const time = document.createElement('p');
        time.textContent = hasTime ? 'Spielbeginn: ' + format.format(puck) : 'Spieltag: ' + dateOnly.format(day) + ' · Beginnzeit noch nicht bekannt';
        const meet = document.createElement('p');
        meet.textContent = hasTime ? 'Treffpunkt zum Aufbau: ' + format.format(arrival) : 'Treffpunkt: 2 Stunden vor Spielbeginn (Uhrzeit folgt)';
        article.append(heading,time,meet);
        games.append(article);
        rendered += 1;
      }
      if (!rendered) state.textContent = 'Keine gültigen Heimspieltermine vorhanden.';
      else state.textContent = rendered + ' veröffentlichte Heimspiele';
    } catch (error) {
      state.textContent = 'Heimspiele konnten nicht geladen werden. Bitte Seite aktualisieren oder den Vorstand kontaktieren.';
      console.error('Heimspiel-Helferplanung:',error);
    }
  }
  void load();
})();

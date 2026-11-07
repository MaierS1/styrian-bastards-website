# ATSE public calendar

Homepage and /atse-kalender.html share a responsive monthly calendar, home/away filter, full fixture list and subscription instructions.

Public JSON: https://yktioliukcrrccrfwxad.supabase.co/functions/v1/atse-calendar?format=json
Public iCalendar subscription: https://yktioliukcrrccrfwxad.supabase.co/functions/v1/atse-calendar

The new public read-only Edge Function uses server environment credentials to select only published, unarchived ATSE fixtures with active teams/competitions/leagues, then returns an explicit field projection. No member or helper data is queried. The fixed team UUID prevents callers selecting other data. Reads are paginated and fail closed on upstream errors; outages return 503, never a successful empty feed. No schema changes or GitHub Actions required.

Both formats query the existing Gamecenter records on each uncached request (maximum 5 minute response cache). Website refreshes every 5 minutes while visible and on returning to the tab. The existing official schedule synchronization remains the upstream source. Subscriber polling is controlled by Apple/Google/Outlook; PT1H is a refresh hint, not a delivery guarantee.

Stable UID uses the sports_games UUID; LAST-MODIFIED and DTSTAMP use updated_at. Cancellation uses STATUS:CANCELLED; date-only fixtures use tentative all-day DTSTART with official_game_date. No invented end times. Fully undated games remain in JSON/list but cannot form dated calendar events. Unpublished/archived fixtures leave the snapshot; client handling of removed events depends on subscription support. CRLF, escaping and UTF-8 byte folding are covered by tests.

Validation: node --test tests/*.test.mjs; npm run build; live unauthenticated JSON and ICS checks. Production dataset on 2026-11-07: 20 fixtures, 10 home / 10 away, 11 with date only. No authored match data was modified.

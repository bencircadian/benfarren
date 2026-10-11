# Marathon training tracker

Lives at `/marathon` (unlisted — bookmark it on your phone). The plan comes from
`plan.json` in this folder; your ticks, skips, Thursday moves and notes are saved
through `/api/marathon-log` (the same Upstash Redis the `/music` and `/theory`
pages use), with a copy kept in the browser so it works instantly and offline.

## Loading your plan

Open `marathon/plan.json` and replace everything inside `"sessions": [ ... ]`
with your own sessions, one per line:

```json
{ "week": 1, "day": "Tue", "type": "easy", "minutes": 30, "description": "Optional notes" },
{ "week": 1, "day": "Fri", "type": "tempo", "minutes": 35 },
{ "week": 1, "day": "Sun", "type": "long", "minutes": 50 }
```

- **week**: whole number, counted from `startDate` (week 1 = the Mon–Sun week containing it).
- **day**: `Tue`, `Fri`, `Sun` (any weekday name works; `Tuesday` and `tue` are fine too).
- **type**: any word. `easy`, `recovery`, `long`, `tempo`, `intervals` and `race` get their own colours.
- **minutes**: planned duration.
- **description**: optional.

Every line except the last needs a comma at the end. If the JSON is broken, the
page tells you where. Delete the `_readme` line once your own plan is in, to hide
the "sample plan" notice.

## Changing the start date

Edit `"startDate": "2026-10-12"` near the top of `plan.json` (format `YYYY-MM-DD`).
With a Monday start of 12 Oct 2026, race day (Sun 4 Apr 2027) falls in week 25. If
your plan's last week doesn't match the race week, the page shows a warning.

## The weekday rule

`rules.weekdayCap` in `plan.json` sets the limit: Tue/Fri sessions in weeks 1–6
max 45 minutes. Anything longer is flagged with a warning banner and on its card.

## Previewing a date

Add `?today=2026-12-01` to the URL to see the tracker as it would look on that day.
Logging still saves for real.

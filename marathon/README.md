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

## Apple Watch (via Shortcuts)

`/api/marathon-today` is a plain-text endpoint made for Apple Shortcuts. It uses the
same log as the website, so anything you do on the watch shows up on the page.

| Request | What it does |
| --- | --- |
| `GET  /api/marathon-today` | Next session, anything not logged this week, days to go |
| `POST /api/marathon-today?action=done` | Mark the next session done |
| `POST /api/marathon-today?action=skip` | Skip the next session |
| `POST /api/marathon-today?action=thu` | Move the next Tue/Fri session to Thursday |
| `POST /api/marathon-today?action=undo` | Undo the most recent change |
| `POST /api/marathon-today?action=log-run` | Mark the session due today done (for the workout automation). A Thursday run with nothing moved counts as a missed Tuesday. On other days it does nothing. |

Add `&id=w3-Fri` to act on a specific session instead of the next one.

### 1. "Marathon" shortcut on the watch face

In the Shortcuts app on your iPhone, create a new shortcut called **Marathon**:

1. **Get Contents of URL**: `https://benfarren.co.uk/api/marathon-today`
2. **Choose from Menu**: set the prompt to the *Contents of URL* variable, with options
   **Done**, **Skip**, **Move to Thu**, **Undo**.
3. Under each option add **Get Contents of URL** with Method **POST** and the URL
   ending `?action=done`, `?action=skip`, `?action=thu` or `?action=undo`,
   followed by **Show Result** (or **Show Notification**) with *Contents of URL*.
4. Open the shortcut's details (ⓘ) and turn on **Show on Apple Watch**.

On the watch, long-press the watch face → **Edit** → **Complications** → pick
**Shortcuts** → **Marathon**. Tap it to see your next run and log it in one tap.

### 2. Log runs automatically when a workout ends

Shortcuts → **Automation** → **+** → **Apple Watch Workout** → **Ends**, type
**Running** → **Run Immediately**. Add:

1. **Get Contents of URL**: `https://benfarren.co.uk/api/marathon-today?action=log-run`, Method **POST**
2. **Show Notification**: *Contents of URL*

If you start a workout by accident, use **Undo** from the Marathon shortcut.

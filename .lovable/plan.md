

## Plan: Remove All Demo Data

### What changes
Remove `demoData.ts` entirely and update the 3 files that import from it. Pages will show empty/loading states when the backend is offline instead of fake data.

### Files

**Delete**: `src/racing/demoData.ts`

**`src/pages/AnalysisPage.tsx`**
- Remove import of `DEMO_ANALYSIS`, `DEMO_COACHING`, `TELEM_DATA`
- Instead of falling back to demo data, show a "No data available" state when API returns nothing
- Remove `isDemo` logic and "DEMO" labels
- `analysis` and `coaching` become nullable — render empty state if null

**`src/pages/LapHistoryPage.tsx`**
- Remove import of `DEMO_LAPS`
- On error or no data, show empty state ("No laps recorded yet — connect your backend") instead of demo laps
- Remove "DEMO DATA (backend offline)" indicator, replace with "Backend offline" message

**`src/pages/HomePage.tsx`**
- Remove "View Example Analysis" button (navigates with `{ demo: true }`)
- Keep only "LIVE MODE" and "Lap History" buttons

**`src/pages/UploadLapPage.tsx`**
- Remove "Load Demo Data" button that navigates with `{ demo: true }`

### Empty states
Each page will show a clean "no data" message when the backend is unreachable or returns no results, styled consistently with the existing design (dark card, muted text, icon).


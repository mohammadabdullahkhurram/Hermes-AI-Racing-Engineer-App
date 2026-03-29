

## Plan: Home Page & NavBar Changes

### Changes

**1. NavBar (`src/racing/NavBar.tsx`)**
- Remove the logo block (the "RE" icon + "AI RACE ENGINEER" text, lines 20-25)
- Move nav links to the right by removing `flex: 1` from the links container and adding `marginLeft: "auto"`
- Remove the "CONNECTED" indicator (lines 37-40)

**2. HomePage (`src/pages/HomePage.tsx`)**
- Add a "Lap History" button to the main CTA button row (line 38-42), styled consistently with the existing outline buttons, navigating to `"history"`

### Files Modified
- `src/racing/NavBar.tsx`
- `src/pages/HomePage.tsx`


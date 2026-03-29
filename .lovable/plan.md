

## Plan: Center NavBar Links + Driver Profile Icon on Right

### Changes to `src/racing/NavBar.tsx`

1. **Remove "Driver Profile" from the center links array** — it moves to the right side.

2. **Layout the navbar as three sections** using flexbox:
   - **Left**: "AI RACE ENGINEER" text (clickable, navigates home)
   - **Center**: Home, Live, Lap History, Upload Lap links (centered with `flex: 1` + `justifyContent: "center"`)
   - **Right**: A user/driver icon button for Driver Profile (using an inline SVG circle-user icon since we use inline styles throughout)

3. **Driver Profile icon**: Render a small SVG user icon (circle with head silhouette) styled with `C.teal` when active, `C.muted` otherwise. Clicking navigates to `"profile"`.

### Files Modified
- `src/racing/NavBar.tsx`


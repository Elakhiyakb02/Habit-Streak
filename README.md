# Don't Break the Chain — habit streak tracker

A small, installable web app (PWA) for tracking daily habits as a streak.
React + Vite + Tailwind. No backend — your data lives on your device via
`localStorage`, with a Backup/Restore button so you never lose it.

---

## 1. Run it on your computer

```bash
npm install
npm run dev
```

Open the printed `localhost` URL. Edits hot-reload instantly.

---

## 2. Publish it (free, ~5 minutes)

You can't deploy from inside this folder alone — a host needs *your* account.
Pick one of the two paths below. **Netlify or Vercel are easiest** (no base-path
fiddling).

### Option A — Netlify, drag-and-drop (fastest, no git)
1. Run `npm run build`. This creates a `dist/` folder.
2. Go to https://app.netlify.com/drop and **drag the `dist` folder** onto the page.
3. You get a live URL immediately. Done.
   - To update later: rebuild and drag the new `dist` again (or connect git, below).

### Option B — GitHub + Netlify/Vercel (best for ongoing updates)
1. Create a new repo on GitHub and push this folder:
   ```bash
   git init && git add . && git commit -m "first version"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. In Netlify (or Vercel) → **Add new site → Import from Git** → pick the repo.
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Every `git push` from now on **auto-deploys an update**. That's your update flow.

> **GitHub Pages instead?** It serves from a subpath, so open `vite.config.js`
> and set `base: "/<your-repo-name>/"` before building. Netlify/Vercel don't need this.

---

## 3. Install it as an app on your phone

Open the live URL in your phone browser, then:
- **iPhone (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** menu → *Install app* / *Add to Home screen*.

It then opens fullscreen like a native app, works offline, and **auto-updates**
the next time you open it after you redeploy (handled by the service worker —
`registerType: "autoUpdate"`).

---

## 4. Adding features later

The code is structured so changes stay small:

- **Add or change a habit** → edit the `CORE` array in `src/App.jsx`. The
  checklist, scoring, and chain grid all derive from it automatically.
- **Change the "chain holds" rule** → edit `HOLD_THRESHOLD` in `src/App.jsx`
  (currently 3 of 4 — your 80% rule).
- **Cloud sync across devices later** → the app only talks to storage through
  `src/lib/storage.js`. Swap the four method bodies (`get/set/remove` + import/export)
  to call a backend like Supabase or Firebase, and nothing else needs to change.

After any change: commit and push (Option B) or rebuild and re-drag (Option A).
Users on the installed app pick up the new version automatically.

---

## Notes / limitations
- Data is per-browser/per-device. Use **Backup** regularly (downloads a JSON file);
  **Restore** reads it back — also how you'd move data to a new phone until you add sync.
- Clearing browser data wipes the app's storage, so keep a backup.

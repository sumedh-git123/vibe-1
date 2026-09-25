# CLAUDE.md

Project notes and handoff for future sessions. Read this first.

## Current status

**The project is changing direction.** The repo holds a finished "Glacier" landing page. The user has asked to scrap it and build a new marketing site for **BidMate**, using the **10k-websites** skill in `.claude/skills/10k-websites/SKILL.md`. That new site has not been started yet. It is blocked on information from the user (see "What's left to do").

- Working branch: `claude/glacier-landing-hero-nopr04`. All work goes here, and no pull request has been opened.
- `main` holds only the initial `.gitignore` commit.

## Commands

```
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b && vite build
npm run lint     # eslint .
npm run preview  # serve the production build
```

## Stack

- Vite 8 + React 19 + TypeScript (~5.9)
- Tailwind CSS v4 through the `@tailwindcss/vite` plugin. CSS is pulled in with `@import "tailwindcss";` in `src/index.css`. There is no `tailwind.config.js`.
- `framer-motion` for all animation
- Google Fonts (Playfair Display, Inter) loaded by `<link>` tags in `index.html`
- ESLint 9 flat config (`eslint.config.js`) with react-hooks and react-refresh plugins

## What's been built: the Glacier landing page

This was built from a detailed one-shot prompt that gave the exact source of every file. The code matches that spec literally. `npm run build` and `npm run lint` both pass. It has **not** been checked visually in a browser.

| File | Contents |
| --- | --- |
| `index.html` | Title "Glacier", favicon, Google Fonts links |
| `src/index.css` | Tailwind import plus base resets (black background, Inter, antialiasing) |
| `src/main.tsx`, `src/App.tsx` | Render `<Navbar />` then `<Hero />` |
| `src/components/Navbar.tsx` | Fixed floating glass "icon dock": four icon buttons (home, tasks, calendar, goals) with a sliding active highlight that uses a framer-motion `layoutId` |
| `src/components/Hero.tsx` | Full-screen hero with a background video, dark overlays, the "GLACIER / PRESENTS" brand lockup, the "FROZEN / IN TIME" Playfair headline, an italic subtitle, an oval "Enter Exhibit" button, and a footer bar (social icons, privacy/terms links, "Scroll to navigate") |
| `public/favicon.svg` | Placeholder ice-gem icon (the spec allowed any placeholder) |

Files added beyond the spec, as standard Vite React-TS scaffolding: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, and `node_modules` / `dist` entries in `.gitignore`.

## Decisions made

- **The project lives at the repo root**, not in a `glacier/` subfolder, because the repo was empty apart from `.gitignore`.
- **The spec was followed exactly.** Inline `style` props, the `borderRadius: '50%'` ellipse button and the overlay opacity values are all intentional. Don't "clean them up" while Glacier still exists.
- **The Glacier hero video was never added.** `public/hero.mp4` is missing because the environment's network policy blocked the video's host (`pub-1e5b4001b36b47e28e6a2fb775966a79.r2.dev`). The user allowed the domain, but the running session was still blocked. The change most likely only applies to new sessions. Now that the project is moving to BidMate, the video is probably no longer needed.
- **Glacier is being replaced by BidMate.** The user said "scratch this whole thing." The BidMate site goes on this same branch.
- **BidMate follows the 10k-websites skill.** The user chose the skill over the current stack. The skill requires one `index.html` plus an `assets/` folder in plain HTML, CSS and vanilla JS, with no framework, no build step and no npm. So the whole Vite/React/Tailwind setup described above (`src/`, `package.json`, the tsconfig and eslint files) is removed when the BidMate build starts. The "Commands" and "Stack" sections then stop applying and should be rewritten.

## The BidMate brief (from the user)

- Build a website for **BidMate**.
- Use https://hermes-agent.nousresearch.com/ as the reference. Copy its **interactive style** and its overall **visual appeal**. The user wants the site to be "beautiful" and "attractive to the eyes" in the way that site is.
- The site does **not** need to match the reference's color palette or details. What matters is the polish, the interactivity and the overall attractiveness.

## The website skill: 10k-websites

The user uploaded this skill through GitHub as `.claude/skills/your-skill-name/Website Skill #1`. At their request it was moved to `.claude/skills/10k-websites/SKILL.md`, the path Claude Code loads project skills from. **Read the whole file before starting BidMate work.** It governs the build: phases, gates and quality bar.

In short, it builds a cinematic, scroll-driven site. An AI-generated hero video plays forward and backward as the visitor scrolls, and the page settles into a real website with one call to action. The pipeline is fixed at three tools:
- **Claude Code** builds the site.
- **Higgsfield** (MCP connector) generates every image and video, which costs the user credits. The skill requires stating costs before spending.
- **Hostinger** (MCP connector) hosts and deploys, connected only in Phase 10.

It runs in 11 phases: setup scan, design conversation, customer research, depth tier, design package and storyboard, hero generation with a mandatory video gate, asset processing with ffmpeg, build, self-test with a copy-review gate, going live, and polish.

**Gaps found when setting it up:**
- **The `references/` folder is missing.** The skill relies on six files it says to read at specific points: `prompt-laws.md`, `design-package.md`, `scrub-pipeline.md`, `ffmpeg-recipes.md`, `deploy.md` and `troubleshooting.md`. Only `SKILL.md` was uploaded. Ask the user to add them to `.claude/skills/10k-websites/references/`, or confirm going ahead without them.
- **Tools in this environment**, not yet verified with a real call:
  - Higgsfield connector tools appear in the session's tool list.
  - No Hostinger tools were seen.
  - Node.js 22 and Python 3.11 are installed.
  - `ffmpeg` is **not** on the PATH. A Playwright build exists at `/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux`, but it may lack the encoders the skill's recipes need.
- **This is a cloud session, not the desktop setup the skill assumes.** Its steps about winget/brew installs, double-clicking `index.html` and clicking through Claude Code's connector menu need adapting here.

## What's left to do

### Blocked: needs input from the user

1. **What BidMate is.** Nothing is known yet. The following questions were put to the user:
   - What the product does and who it's for
   - The main call to action (sign up, waitlist, book a demo, download)
   - Any existing brand assets: logo, colors, tagline, feature list. If there are none, write placeholder copy and choose a visual direction.
2. **Access to the reference site.** `hermes-agent.nousresearch.com` is blocked by the network policy for both `curl` and `WebFetch`, so it has never been seen. The two options put to the user:
   - Add the domain under **Network access** in the environment settings, then start a **new** session. Changes did not reach the already-running session last time.
   - Or send screenshots of the parts they like, and name the interactions they want (hover effects, animated text, a live terminal, scroll-triggered motion, and so on).

   Do not guess what the reference looks like. Wait for access or screenshots.
3. **The skill's missing `references/` files** (see above).

Note that the skill's Phase 2 conversation asks for most of item 1 anyway. Collect it there, as clickable questions, one at a time.

### Once unblocked

4. Run the skill from Phase 1: scan the tools, report a ✓/✗ checklist, verify Higgsfield with a balance call.
5. Remove the Glacier project entirely: `src/`, `package.json`, `package-lock.json`, the tsconfig and eslint files, `vite.config.ts`, `index.html` and `public/`.
6. Follow the skill's phases to design, generate and build the BidMate site as plain `index.html` plus `assets/`. Keep raw and review media out of the deploy folder, as the skill requires.
7. Check it in a real browser before showing it. Chromium is pre-installed at `/opt/pw-browsers/chromium`. Follow the skill's Phase 9 self-test and copy-review gate.
8. Commit and push to `claude/glacier-landing-hero-nopr04`. Deploying to Hostinger happens only when the user says they're ready (Phase 10).
9. Open a pull request into `main` **only if the user asks** for one.

## Environment notes

- The user sometimes commits straight to the branch on GitHub. Fetch before pushing, and rebase or merge their commits in; never force-push over them.
- Outbound network is restricted by the environment's policy. The npm registry works; arbitrary hosts may return `CONNECT tunnel failed, response 403`. When that happens, ask the user to allow the host, which may need a new session to take effect.

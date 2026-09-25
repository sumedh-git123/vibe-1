# CLAUDE.md

Project notes and handoff for future sessions. Read this first.

## Current status

**The project is changing direction.** The repo holds a finished "Glacier" landing page. The user has asked to scrap it and build a new marketing site for **BidMate**. That new site has not been started yet. It is blocked on information from the user (see "What's left to do").

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
- **Glacier is being replaced by BidMate.** The user said "scratch this whole thing." Plan: replace the Glacier code on this same branch and keep the Vite + React + Tailwind v4 + framer-motion stack, unless the user asks for something else.

## The BidMate brief (from the user)

- Build a website for **BidMate**.
- Use https://hermes-agent.nousresearch.com/ as the reference. Copy its **interactive style** and its overall **visual appeal**. The user wants the site to be "beautiful" and "attractive to the eyes" in the way that site is.
- The site does **not** need to match the reference's color palette or details. What matters is the polish, the interactivity and the overall attractiveness.

## Website skill added by the user

The user uploaded a skill through GitHub, in commit "Create Website Skill #1", at `.claude/skills/your-skill-name/Website Skill #1`. It is a copy of the **10k-websites** skill: a cinematic, scroll-driven site where an AI-generated hero video scrubs as the visitor scrolls. It prescribes plain HTML/CSS/JS with no build step, Higgsfield for images and video, and Hostinger for deploy.

- **Claude Code won't load it as it stands.** A project skill must live at `.claude/skills/<skill-name>/SKILL.md`, and this file has neither that name nor a `.md` extension. Something like `.claude/skills/10k-websites/SKILL.md` would work. Rename it only if the user wants it active.
- **It conflicts with the current stack.** The skill calls for plain HTML with no build step; this repo is Vite + React. Ask the user which one BidMate should follow before building.

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
3. **Whether to use the uploaded website skill** (see above), and so whether to keep Vite + React or switch to its plain-HTML, Higgsfield and Hostinger pipeline.

### Once unblocked

4. Remove the Glacier-specific code and assets: the `Hero`/`Navbar` components, the Glacier title, fonts and favicon.
5. Design and build the BidMate site in the reference's interactive style.
6. Check it in a real browser before pushing. Chromium is pre-installed at `/opt/pw-browsers/chromium`; take screenshots at desktop and mobile widths.
7. Run `npm run build` and `npm run lint`, commit, and push to `claude/glacier-landing-hero-nopr04`.
8. Open a pull request into `main` **only if the user asks** for one.

## Environment notes

- The user sometimes commits straight to the branch on GitHub. Fetch before pushing, and rebase or merge their commits in; never force-push over them.
- Outbound network is restricted by the environment's policy. The npm registry works; arbitrary hosts may return `CONNECT tunnel failed, response 403`. When that happens, ask the user to allow the host, which may need a new session to take effect.

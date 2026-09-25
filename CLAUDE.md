# CLAUDE.md

Project notes and handoff for future sessions. Read this first.

## Current status

**Building the BidMate marketing site with the 10k-websites skill.** Glacier has been deleted (its React/Vite files are gone from the branch). Branch: `claude/glacier-landing-hero-nopr04`, no PR.

Progress through the skill:
- Phase 1 done: Higgsfield connected (Starter plan, 280 credits at start). ffmpeg: the system has none with web encoders, so `pip install imageio-ffmpeg` and symlink its binary to `~/.local/bin/ffmpeg` (has libx264, libwebp, vp9). Node 22 present. The skill's `references/` folder is still missing; going ahead without it, user informed.
- Phase 2 answers: CTA **Book a demo**. Feeling **precise and calm**. No assets: design a wordmark, generate the hero, draw product UI as in-page illustrations. Real product, generated imagery (disclosure question not yet asked).
- Phase 3 research done (Mike Holt forum, Capterra/Quotr reviews): fear of what gets missed, "you are still responsible", tools choke on bad scans and odd symbols, no time to recount on bid day.
- Concept chosen: **"The sheet comes alive"**, Tier 1 single 6s shot. Full plan and verbatim copy in `design/design-package.md` (not deployed).
- Phase 6 done: start frame (2.75 credits) inspected and approved. Hero video made with **Kling 3.0 Standard** (9 credits; Kling Pro is locked on the Starter plan). The user passed the video gate. It is 720p, lights one copper circuit run, and doesn't fully rest at the end; the user accepted that. About 268 credits left. Job ids in `design/assets.md`; raw files in `review/` (gitignored).
- Phase 7 done: `site/assets/media/hero.mp4` (H.264, keyframe every 2 frames, faststart) plus `hero.webm` (VP9) for browsers without H.264 (including Playwright's Chromium). `hero-poster.webp` is shown while the film loads. `hero-end.webp` is the phone hero and the faded backdrop behind the demo section. `og.jpg` is 1200x630.
- Phase 8 build: `site/index.html`, `site/assets/css/style.css`, `site/assets/js/main.js`, `site/assets/favicon.svg`. `main.js` picks MP4 or WebM with `canPlayType`, fetches it as a Blob behind a loading ring, and scrubs it with lerped, gated seeks. If the film fails, `html.no-film` hides the still and the JS-drawn blueprint (copper circuits that light with scroll) scrubs instead. Also: interactive "Try the review" bench, copper thread down the page, dust canvas.
- Phase 9 self-test passed: desktop scrub at 0/35/62/95%, flick test, the bench flow, the form, 375/390/768/1024 widths, reduced motion, video-missing fallback, no page errors. Copy gate passes.
- Test harness: `npm i playwright-core@1.56` in the scratchpad, launch `/opt/pw-browsers/chromium` with `--ignore-certificate-errors`, and use `waitUntil: 'load'` (networkidle hangs).
- Revision 1 applied (see `design/design-package.md`): outcome headline, sourced stats in the problem section, boxed FAQ, film plays from 641px wide.
- Private preview artifact: https://claude.ai/artifact/2aaLn4AfMSdZ6oWnqAqWCq (built from `site/` with the html/head/body wrapper stripped).

**Open before launch (Phase 10):** where the demo form sends requests (it only shows a thank-you now), whether the footer should say the imagery is generated, the real domain (og:url/og:image still point at example.com), and connecting Hostinger (not connected; no Hostinger tools yet).

## Commands

No build step. Preview: `cd site && npx http-server -p 8080` (or `python3 -m http.server`).

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

## Environment notes

- The user sometimes commits straight to the branch on GitHub. Fetch before pushing, and rebase or merge their commits in; never force-push over them.
- Outbound network is restricted by the environment's policy. The npm registry works; arbitrary hosts may return `CONNECT tunnel failed, response 403`. When that happens, ask the user to allow the host, which may need a new session to take effect.

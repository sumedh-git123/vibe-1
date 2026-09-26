# CLAUDE.md

Project notes and handoff for future sessions. Read this first.

## Current status

**Building the BidMate marketing site with the 10k-websites skill.** Glacier has been deleted (its React/Vite files are gone from the branch). Branch: `claude/glacier-landing-hero-nopr04`, no PR.

Progress through the skill:
- Phase 1 done: Higgsfield connected (Starter plan, 280 credits at start). ffmpeg: the system has none with web encoders, so `pip install imageio-ffmpeg` and symlink its binary to `~/.local/bin/ffmpeg` (has libx264, libwebp, vp9). Node 22 present. The skill's `references/` folder is still missing; going ahead without it, user informed.
- Phase 2 answers: CTA **Book a demo**. Feeling **precise and calm**. No assets: design a wordmark, generate the hero, draw product UI as in-page illustrations. Real product, generated imagery (disclosure question not yet asked).
- Phase 3 research done (Mike Holt forum, Capterra/Quotr reviews): fear of what gets missed, "you are still responsible", tools choke on bad scans and odd symbols, no time to recount on bid day.
- Concept chosen: **"The sheet comes alive"**, Tier 1 single 6s shot. Full plan and verbatim copy in `design/design-package.md` (not deployed).
- Phase 6 done: start frame (2.75 credits) inspected and approved. Hero video made with **Kling 3.0 Standard** (9 credits; Kling Pro is locked on the Starter plan). The user passed the video gate. It is 720p, lights one copper circuit run, and doesn't fully rest at the end; the user accepted that. About 268 credits left (267.77 after the upscale). Job ids in `design/assets.md`; raw files in `review/` (gitignored).
- Phase 7/8, revision 2 (user: "video isn't there" and "integrate it into the entire website"): the film is now an **image sequence**, not a video. `site/assets/film/d/` and `site/assets/film/m/` (current counts and sizes under Revision 3). `main.js` draws them onto a fixed full-screen canvas (`.film` inside `.env`) behind the **whole page**. The hero plays 64% of the shot and the rest of the page plays the remaining 36%, with a slow camera push (scale and drift) and a veil that dims behind reading sections and opens up at the demo. Frames load coarse-to-fine (every 16th, then 8th, and so on) behind a loading ring. Panels use backdrop blur so the film reads through them. The MP4/WebM files were removed; `review/hero-raw.mp4` is the source. Why: the Blob video likely failed inside the artifact preview and on phones; images work everywhere, including file://. Phones now get the scrolling film too (a deliberate deviation from the skill's "phones get a still"). Reduced motion rests on the last frame with the static hero layout. If frame 1 fails, `html.no-film` shows the JS-drawn blueprint, which scrubs instead.
- Phase 8 build files: `site/index.html`, `site/assets/css/style.css`, `site/assets/js/main.js`, `site/assets/favicon.svg`, `site/assets/media/og.jpg`. Also: interactive "Try the review" bench, copper thread down the page, dust canvas.
- Phase 9 self-test passed: desktop scrub at 0/35/62/95%, flick test, the bench flow, the form, 375/390/768/1024 widths, reduced motion, video-missing fallback, no page errors. Copy gate passes.
- Test harness: `npm i playwright-core@1.56` in the scratchpad, launch `/opt/pw-browsers/chromium` with `--ignore-certificate-errors`, and use `waitUntil: 'load'` (networkidle hangs).
- Revision 1 applied (see `design/design-package.md`): outcome headline, sourced stats in the problem section, boxed FAQ, film plays from 641px wide.
- Revision 3 (user: sharper and smoother film, better transitions, bigger headers, bold high-contrast problem, more interaction):
  - The film was upscaled with Higgsfield `upscale_video` (bytedance, 2k, 60fps, preset aigc; 0.48 credits). The source is `review/hero-2k60.mp4`. Frames were re-extracted: `film/d` has 150 frames at 1920x1080 25fps (7.9 MB); `film/m` has 75 frames at 1024x576 (1.9 MB). The canvas cross-blends neighbouring frames (float frame index), so scrubbing is smooth.
  - Type scale up: eyebrows 14px, `.display` up to 96px, hero h1 up to 116px, band lines up to 64px. Body text is brighter (`--paper-dim` .8).
  - New colors `--bad #FF6B57` (problem) and `--good #5EE0A0` (solved). `strong`, `strong.bad`, `.hl-bad`. Stat numbers are red.
  - Transitions: headings split into words (`.w`) that rise and unblur. Hero bands do this word by word as you scroll and lift away blurred. Section reveals use a blurred fade-up instead of the clip mask.
  - Problem section: "Six cents on the dollar. One missed count takes it." (second line red) and a bolded lede. The Today/With BidMate lists were replaced by the **bid-day widget** (`[data-bidday]`): a Counted by hand / With BidMate switch, four example missed items ($21,600 on a $1.2M job with a $72,000 profit), per-item Approve/Undo, Approve all, and an animated profit number and bar. Labeled as example numbers.
- Private preview artifact: https://claude.ai/artifact/2aaLn4AfMSdZ6oWnqAqWCq (built from `site/` with the html/head/body wrapper stripped).

**Decided:** the demo form posts to **Formspree form `xdekwjey`** (`data-endpoint="https://formspree.io/f/xdekwjey"` on the `<form>` in `site/index.html`, plus a hidden `_subject`). Tested with mocked responses: a 200 shows the thank-you, and a failure shows a retry message. No real submission has been sent from here. The artifact preview build blanks `data-endpoint` (the artifact sandbox blocks outside requests), so the preview form is demo-only. No AI-imagery note in the footer. The user said **not yet** to going live and wants to keep polishing.

**Open before launch (Phase 10):** one real test submission once the site is live (Formspree asks to confirm the first one by email), the real domain (og:url/og:image still point at example.com), and connecting Hostinger (not connected; no Hostinger tools yet).

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

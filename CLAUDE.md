# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static single-page portfolio website for Ben Farren (Director of Mathematics). No build process, no framework - vanilla HTML with Tailwind CSS via CDN.

## Development

**Local testing:**
```bash
python -m http.server 8000
# Then visit http://localhost:8000
```

**Deployment:** Automatic via Vercel on push to main branch.

## Architecture

Everything lives in `index.html` (single-file architecture):
- Tailwind CSS loaded via CDN with custom configuration embedded in `<script>` tag
- Google Fonts: Crimson Pro (headlines), Inter (body), JetBrains Mono (code)
- Material Symbols icons

**Custom Tailwind colors defined in the embedded config:**
- `academic-blue` (#0f172a) - primary
- `academic-green` (#166534) - secondary
- `paper-bg` (#f8fafc) - background
- `accent-teal` (#0d9488) - highlights
- `engram-purple` (#6366f1) - project accent

**Page sections (in order):**
- Navigation (sticky header)
- Hero/About (#about)
- Projects (#projects) - showcases ed-tech tools
- Approach (#approach)
- Beyond Teaching (#beyond)
- Contact (#contact)
- Footer

## Design Patterns

- Graph paper background aesthetic (`.graph-paper` utility) reflects educator identity
- Problem/Solution framework for project descriptions
- Responsive design using `lg:` breakpoints throughout

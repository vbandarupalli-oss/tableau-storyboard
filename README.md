# Tableau Dashboard Storyboard Extension

Transforms any Tableau dashboard into a plain-English narrative storyboard — built for business consumers who want to understand their data without needing to explore it themselves.

## What it does

One click on any dashboard generates:
- A **headline** — the single most important thing the data reveals
- **Context** — what you're looking at and whether it's good or bad
- **Key findings** — 3–6 causally-framed insights with actual numbers
- **So what** — what this means for the reader specifically
- **Q&A** — 5 questions a consumer would ask, with data-grounded answers
- **What to watch** — forward-looking signals from the data

## Setup (5 minutes)

### Step 1 — Fork or clone this repo

```bash
git clone https://github.com/vbandarupalli-oss/tableau-storyboard.git
cd tableau-storyboard
```

Or just fork it directly on GitHub.

### Step 2 — Enable GitHub Pages

1. Go to your repo on GitHub
2. Settings → Pages
3. Source: **Deploy from a branch**
4. Branch: **main** / **(root)**
5. Click Save

Your extension will be live at:
`https://vbandarupalli-oss.github.io/tableau-storyboard/`

Wait ~2 minutes for the first deploy. Then verify it loads at that URL.

### Step 3 — Load the extension in Tableau Cloud

1. Open any dashboard in Tableau Cloud
2. In the dashboard, go to the **Objects** panel (bottom left of edit mode)
3. Drag an **Extension** object onto the dashboard
4. In the dialog, click **Access Local Extensions** (or "Choose Extension")
5. Upload the `storyboard.trex` file from this repo
6. Accept the permissions dialog — the extension needs **Full Data** access to read worksheet data
7. The Storyboard panel will appear on your dashboard

### Step 4 — Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. API Keys → Create Key
3. Copy the key (starts with `sk-ant-`)
4. Paste it into the extension's API key field

Your key is only used in your browser session. It's saved in Tableau's extension settings for convenience so you don't have to re-enter it each time.

### Step 5 — Generate a story

Click **Generate Story**. The extension will:
1. Read all worksheet data from your dashboard
2. Collect active filter state
3. Send to Claude (claude-sonnet-4) for narrative generation
4. Render the storyboard in a full-screen overlay

Takes ~15–20 seconds depending on dashboard complexity.

---

## Customisation

### Change the Claude model
In `index.html`, find this line near the top of the script:
```js
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
```
You can change to `claude-opus-4-20250514` for richer narratives (slower, more expensive) or `claude-haiku-4-5-20251001` for faster, cheaper generation.

### Change max rows per worksheet
```js
const MAX_ROWS_PER_SHEET = 200;
```
Increase for more data context, decrease for faster generation. 200 rows is a good balance for most dashboards.

### Customise the narrative structure
The prompt is in the `buildPrompt()` function. You can adjust the JSON schema, add company-specific context, change the tone, or add additional sections. The prompt instructs Claude to return structured JSON which the extension then renders.

### Add your company branding
The storyboard header uses Tableau's colour palette. To add your own branding, edit the CSS variables at the top of `index.html`:
```css
:root {
  --navy: #003666;   /* header background */
  --blue: #1473E6;   /* accent colour */
  --orange: #E86427; /* logo accent */
}
```

---

## Architecture

```
Tableau Dashboard
    │
    ▼ Extensions API (getSummaryDataAsync, getFiltersAsync)
index.html (browser)
    │
    ▼ fetch() to api.anthropic.com/v1/messages
Claude claude-sonnet-4
    │
    ▼ JSON narrative response
Storyboard renderer (pure HTML/CSS)
```

No backend required. Everything runs in the browser. The Anthropic API call is made directly from the extension using the `anthropic-dangerous-direct-browser-api-access` header (required for browser-side API calls).

---

## Security notes

- The extension requests **Full Data** permission — required to call `getSummaryDataAsync()`
- Your Anthropic API key is stored in Tableau's extension settings (scoped to your Tableau session) for convenience — it is never sent anywhere except Anthropic's API
- For production use, consider routing the Claude API call through a backend proxy so the API key never touches the browser
- All data access is governed by Tableau's existing row-level security — the extension can only read what the current user can see

---

## Troubleshooting

**"Could not connect to Tableau Extensions API"**
Make sure you're loading this as a `.trex` extension inside a Tableau dashboard, not opening `index.html` directly in a browser.

**"Invalid API key"**
Your key should start with `sk-ant-api03-`. Get one at console.anthropic.com.

**"Claude returned invalid JSON"**
Rare — retry. If it happens consistently, the dashboard data may be too large. Lower `MAX_ROWS_PER_SHEET`.

**Extension not loading in Tableau Cloud**
- Verify GitHub Pages is enabled and the URL loads correctly
- Check the URL in `storyboard.trex` matches your GitHub Pages URL exactly
- Tableau Cloud requires HTTPS — GitHub Pages provides this automatically

**CORS error in browser console**
The Anthropic API allows browser-side calls when the `anthropic-dangerous-direct-browser-api-access` header is set. If you see CORS errors, check that header is present in `callClaude()`.

---

## Files

```
tableau-storyboard/
├── index.html        ← Extension UI, Tableau API integration, Claude call, storyboard renderer
├── storyboard.trex   ← Tableau extension manifest
└── README.md         ← This file
```

---

## Built with

- [Tableau Extensions API](https://tableau.github.io/extensions-api/) — dashboard data access
- [Anthropic Claude API](https://docs.anthropic.com) — narrative generation
- Vanilla HTML/CSS/JS — no framework dependencies

---

*Built as a concept extension. For production use, add error handling, a backend proxy for API key security, and Tableau Connected Apps authentication.*

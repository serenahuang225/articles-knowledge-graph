# Article Clipper — Personal Knowledge Graph

A public personal knowledge graph for clipping web articles, attaching your own thoughts, and exploring connections visually — similar to Obsidian, but built as a web app.

Anyone can browse the graph and read notes. Only you can add content, protected by a simple admin secret.

## What it does

1. **Clip articles from the web** — Use a browser bookmarklet on any page to capture the URL and title, then add thoughts and tags in a small popup form.
2. **Scrape readable content** — Saved articles are parsed server-side with Mozilla Readability so the full article text is stored in the graph.
3. **Explore visually** — The home page renders an interactive force-directed graph of Articles, Thoughts, and Tags. Click a node to read its content and jump to related nodes in the sidebar.

## Tech stack

- **Next.js** (App Router, TypeScript)
- **Tailwind CSS** + Lucide React icons
- **Neo4j AuraDB** via `neo4j-driver`
- **react-force-graph-2d** for the network visualization
- **@mozilla/readability** + **jsdom** for article extraction

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Knowledge graph dashboard (60/40 split layout)
│   ├── clip/page.tsx         # Hidden clip form (opened by bookmarklet)
│   └── api/
│       ├── graph/route.ts    # GET — public graph data for ForceGraph2D
│       └── save/route.ts     # POST — protected article save endpoint
├── components/
│   ├── GraphCanvas.tsx       # Force graph canvas
│   └── ReaderSidebar.tsx     # Node detail panel with backlinks
└── lib/
    ├── neo4j.ts              # AuraDB driver singleton
    ├── scraper.ts            # Readability-based article extraction
    ├── auth.ts               # ADMIN_SECRET verification
    ├── bookmarklet.ts        # Bookmarklet href builder
    └── types.ts              # Shared TypeScript types
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the `frontend/` directory:

```env
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password
ADMIN_SECRET=your-admin-secret-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Variable | Description |
|---|---|
| `NEO4J_URI` | Neo4j AuraDB connection URI |
| `NEO4J_USERNAME` | Neo4j username (usually `neo4j`) |
| `NEO4J_PASSWORD` | Neo4j password |
| `ADMIN_SECRET` | Token required to save articles via `/api/save` |
| `NEXT_PUBLIC_APP_URL` | Public origin used by the bookmarklet (set to your deployed URL in production) |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the knowledge graph.

## Bookmarklet setup

The bookmarklet captures `window.location.href` and `window.document.title` from any page and opens a popup to `/clip?url=…&title=…`.

1. Set `NEXT_PUBLIC_APP_URL` to your hosted app origin.
2. Copy the bookmarklet string from `src/lib/bookmarklet.ts` (`BOOKMARKLET_HREF`), or build one with `buildBookmarkletHref('https://your-domain.com')`.
3. Create a new browser bookmark and paste the `javascript:…` string as the URL.
4. Drag it to your bookmarks bar. Click it on any webpage to clip.

Readable source and setup notes are in `public/bookmarklet.js`.

## API routes

### `GET /api/graph` (public)

Returns graph data formatted for `react-force-graph-2d`:

```json
{
  "nodes": [{ "id", "label", "title", "type", "text?", "content?", "url?", "name?" }],
  "links": [{ "source", "target" }]
}
```

Node types: `Article`, `Thought`, `Tag`.

### `POST /api/save` (protected)

Requires `x-admin-secret` header or `adminSecret` in the JSON body.

```json
{
  "url": "https://example.com/article",
  "thoughts": "My personal notes…",
  "tags": ["ai", "productivity"],
  "adminSecret": "your-token"
}
```

Creates or merges `Article`, `Thought`, and `Tag` nodes in Neo4j with `HAS_THOUGHT` and `TAGGED_WITH` relationships.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

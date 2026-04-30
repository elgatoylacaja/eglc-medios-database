# EGLC Medios Database

A data pipeline and web interface for analyzing the Argentine YouTube media ecosystem, built for [El Gato y La Caja](https://elgatoylacaja.com).

The project tracks a curated list of YouTube channels, fetches their videos and comments, stores everything in PostgreSQL, and exposes a Next.js app to browse the data and visualize a network graph of channels connected by shared commenters.

## What it does

**Data ingestion** (scripts):
1. Reads a list of channel handles from a Google Sheet
2. Fetches channel metadata, videos, and comments via the YouTube Data API v3 and `yt-dlp`
3. Saves raw data as JSON in `scripts/json/channels/`
4. Loads JSON into PostgreSQL via Prisma
5. Exports per-year `nodes.tsv` / `edges.tsv` files (channels as nodes, shared-commenter count as edge weight)
6. Runs graph analysis to compute centrality metrics, PageRank, and Louvain community detection

**Web app** (`src/app`):
- `/channels` — list all tracked channels
- `/channels/[handle]` — channel detail: videos with date range filter and search, downloadable as TSV
- `/nota` — interactive network graph of the media ecosystem (Sigma.js + graphology)

## Data model

```
Channel → Video → Comment ← Author
```

- `Channel`: YouTube channel metadata and aggregate stats
- `Video`: per-video metadata, view/like/comment counts
- `Comment`: individual top-level comments with author reference
- `Author`: unique commenter identity across channels

## Prerequisites

- Node.js 20+
- PostgreSQL
- A [YouTube Data API v3 key](https://developers.google.com/youtube/v3/getting-started)
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) installed and on `$PATH` (used to fetch comments)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create a `.env` file at the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
YOUTUBE_API_KEY="your_youtube_api_key"
```

### 3. Run database migrations and generate the client

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start the web app

```bash
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Running the data pipeline

All scripts are run from the project root with `ts-node`.

### Step 1 — Fetch channel + video + comment data

Reads channel handles from the Google Sheet and fetches data for any not yet downloaded:

```bash
pnpm data:fetch
```

To fetch a single channel by handle:

```bash
pnpm data:fetch -- --handle @somehandle
```

Output is saved to `scripts/json/channels/<handle>.json`. Logs go to `scripts/logs/`.

### Step 2 — Load JSON into the database

Once JSON files are present in `scripts/json/channels/`, seed the database:

```bash
npx prisma db seed
```

This runs `prisma/seed.ts`, which reads every `<handle>.json` file and upserts channels, videos, and comments into PostgreSQL. If a channel's data was too large to fit in a single file, it also looks for per-chunk video files under `scripts/json/videos/<handle>/`.

### Step 3 — Export nodes and edges per year

Reads from the DB and writes TSV files to `scripts/exports/`:

```bash
pnpm data:export
```

### Step 4 — Graph analysis

Computes centrality metrics and community detection, updates node TSVs:

```bash
pnpm data:analyze
```

### Optional — Download thumbnails

```bash
pnpm data:thumbnails
```

## Project structure

```
├── prisma/             Prisma schema and migrations
├── scripts/
│   ├── 0. common.ts   Shared constants (year ranges, column names)
│   ├── 1. script-queue.ts  Fetch YouTube data → JSON
│   ├── 2. nodes-edges.ts   DB → TSV export
│   ├── 3. graph-analysis.ts  Graph metrics
│   ├── db/utils.ts     Prisma upsert helpers
│   ├── json/           Raw fetched data (gitignored)
│   └── exports/        TSV outputs for graph tools
└── src/
    ├── app/            Next.js App Router pages
    ├── components/     Shared UI components
    └── lib/            Prisma client, YouTube API wrapper, utilities
```

## Tech stack

- **Next.js** — web app
- **Prisma** + **PostgreSQL** — data storage
- **YouTube Data API v3** + **yt-dlp** — data sources
- **Sigma.js** + **graphology** — network graph visualization
- **D3** — scales and layout helpers
- **Tailwind CSS** — styling
- **Winston** — script logging

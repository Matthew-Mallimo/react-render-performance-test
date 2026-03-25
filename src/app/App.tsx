import React from "react";

type MetricCard = {
  label: string;
  value: string;
  trend: string;
};

type FeedItem = {
  id: number;
  title: string;
  body: string;
  tags: string[];
};

const metrics: MetricCard[] = [
  { label: "Concurrent requests", value: "128", trend: "+16%" },
  { label: "Median render", value: "42 ms", trend: "-8%" },
  { label: "p99 render", value: "188 ms", trend: "-3%" },
  { label: "Server throughput", value: "4.2k rps", trend: "+11%" }
];

const feed: FeedItem[] = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  title: `Render group ${index + 1}`,
  body:
    "Synthetic content for SSR benchmarking. The goal is to exercise component trees, list rendering, string interpolation, and repeated layout structures.",
  tags: [`batch-${(index % 4) + 1}`, `lane-${(index % 3) + 1}`, "ssr"]
}));

export function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fastify React SSR Benchmark</title>
        <style>{styles}</style>
      </head>
      <body>
        <div className="shell">
          <header className="hero">
            <div>
              <p className="eyebrow">React 19 SSR benchmark</p>
              <h1>Measure `renderToString` against `renderToPipeableStream`.</h1>
              <p className="lede">
                This page intentionally renders a moderately sized React tree so
                the server has real work to do during each request.
              </p>
            </div>
            <div className="hero-panel">
              <span className="pill">Fastify</span>
              <span className="pill">React 19</span>
              <span className="pill">TypeScript</span>
            </div>
          </header>

          <main className="grid">
            <section className="panel">
              <h2>Snapshot</h2>
              <div className="metric-grid">
                {metrics.map((metric) => (
                  <article className="metric-card" key={metric.label}>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <em>{metric.trend}</em>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Render workload</h2>
              <div className="feed">
                {feed.map((item) => (
                  <article className="feed-item" key={item.id}>
                    <div className="feed-header">
                      <h3>{item.title}</h3>
                      <span>#{item.id}</span>
                    </div>
                    <p>{item.body}</p>
                    <div className="tag-row">
                      {item.tags.map((tag) => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>
        </div>
      </body>
    </html>
  );
}

const styles = `
  :root {
    color-scheme: light;
    --bg: #f4efe8;
    --ink: #1f2328;
    --panel: rgba(255, 255, 255, 0.82);
    --line: rgba(31, 35, 40, 0.1);
    --accent: #b7410e;
    --muted: #5f6b76;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: "Iowan Old Style", "Palatino Linotype", serif;
    background:
      radial-gradient(circle at top left, rgba(183, 65, 14, 0.16), transparent 24rem),
      linear-gradient(180deg, #f8f2eb 0%, var(--bg) 100%);
    color: var(--ink);
  }

  .shell {
    width: min(1120px, calc(100vw - 2rem));
    margin: 0 auto;
    padding: 2rem 0 4rem;
  }

  .hero {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
    align-items: end;
    margin-bottom: 1.5rem;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--accent);
    font-size: 0.75rem;
    margin: 0 0 0.75rem;
  }

  h1, h2, h3, p {
    margin-top: 0;
  }

  h1 {
    font-size: clamp(2.4rem, 5vw, 4.6rem);
    line-height: 0.94;
    max-width: 10ch;
    margin-bottom: 1rem;
  }

  .lede {
    max-width: 56ch;
    color: var(--muted);
    line-height: 1.5;
  }

  .hero-panel,
  .panel {
    background: var(--panel);
    backdrop-filter: blur(12px);
    border: 1px solid var(--line);
    border-radius: 24px;
    box-shadow: 0 18px 70px rgba(52, 41, 31, 0.08);
  }

  .hero-panel {
    min-height: 100%;
    padding: 1.25rem;
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-content: start;
  }

  .pill,
  .tag {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
    background: rgba(183, 65, 14, 0.08);
    color: var(--accent);
    font-size: 0.84rem;
  }

  .grid {
    display: grid;
    gap: 1.5rem;
  }

  .panel {
    padding: 1.5rem;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  .metric-card,
  .feed-item {
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.74);
  }

  .metric-card {
    padding: 1rem;
  }

  .metric-card span,
  .feed-item p,
  .feed-header span {
    color: var(--muted);
  }

  .metric-card strong {
    display: block;
    font-size: 1.8rem;
    margin: 0.45rem 0 0.25rem;
  }

  .feed {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .feed-item {
    padding: 1rem;
  }

  .feed-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: baseline;
  }

  .feed-header h3 {
    margin-bottom: 0.25rem;
  }

  .feed-item p {
    line-height: 1.5;
  }

  .tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  @media (max-width: 900px) {
    .hero,
    .metric-grid,
    .feed {
      grid-template-columns: 1fr;
    }
  }
`;

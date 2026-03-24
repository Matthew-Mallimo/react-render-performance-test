# React SSR Performance Test

This repo benchmarks React 19 server rendering with Fastify and Express across two endpoints:

- `/render/string` uses `renderToString`
- `/render/stream` uses `renderToPipeableStream`

## Scripts

- `npm run dev`: start the Fastify server with `tsx`
- `npm run dev:express`: start the Express server with `tsx`
- `npm run build`: compile TypeScript to `dist`
- `npm run start`: run the compiled Fastify server
- `npm run start:express`: run the Express server
- `npm run benchmark`: start a local Fastify server and compare both renderers with `autocannon`
- `npm run benchmark:string`: benchmark `renderToString`
- `npm run benchmark:stream`: benchmark `renderToPipeableStream`
- `npm run benchmark:express`: start a local Express server and compare both renderers
- `npm run benchmark:express:string`: benchmark `renderToString` on Express
- `npm run benchmark:express:stream`: benchmark `renderToPipeableStream` on Express
- `npm run benchmark:hosted`: benchmark an already running server at `BENCHMARK_HOST`
- `npm run cpu-profile:string`: capture a CPU profile for Fastify `renderToString`
- `npm run cpu-profile:stream`: capture a CPU profile for Fastify `renderToPipeableStream`
- `npm run cpu-profile:express:string`: capture a CPU profile for Express `renderToString`
- `npm run cpu-profile:express:stream`: capture a CPU profile for Express `renderToPipeableStream`
- `npm run cpu-profile:all`: capture CPU profiles for all Fastify/Express renderer combinations
- `npm run flamegraph:string`: generate a flame graph for the string renderer
- `npm run flamegraph:stream`: generate a flame graph for the streaming renderer
- `npm run flamegraph:express:string`: generate a flame graph for the Express string renderer
- `npm run flamegraph:express:stream`: generate a flame graph for the Express streaming renderer
- `npm run flamegraph:all`: generate flame graphs for all Fastify/Express renderer combinations

## Quick start

```bash
npm run benchmark
```

Benchmark results are written to `benchmarks/`.

If you want to benchmark an already running server instead:

```bash
BENCHMARK_HOST=http://127.0.0.1:3000 npm run benchmark:hosted
```

The local benchmark scripts start their own server on port `3200` by default. Override with `PORT=3300` if needed.

Express local benchmark scripts use port `3201` by default.

## CPU Profiles

Run any of the following to capture raw `.cpuprofile` files:

```bash
npm run cpu-profile:string
npm run cpu-profile:stream
npm run cpu-profile:express:string
npm run cpu-profile:express:stream
npm run cpu-profile:all
```

CPU profiles are written under `profiles/fastify/*/cpu` and `profiles/express/*/cpu`.

## Flame graphs

Run either script below while no other process is using the profiling port:

```bash
npm run flamegraph:string
npm run flamegraph:stream
npm run flamegraph:express:string
npm run flamegraph:express:stream
npm run flamegraph:all
```

Profiles are written under `profiles/fastify/*` and `profiles/express/*`.

import autocannon, { type Result } from "autocannon";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

type Renderer = "string" | "stream";

const host = process.env.BENCHMARK_HOST ?? "http://127.0.0.1:3000";
const connections = Number(process.env.CONNECTIONS ?? 50);
const duration = Number(process.env.DURATION ?? 15);
const pipelining = Number(process.env.PIPELINING ?? 1);
const renderers = parseRenderers(process.argv.slice(2));

async function main() {
  await assertServerReachable();
  const results: Result[] = [];

  for (const renderer of renderers) {
    const result = await runBenchmark(renderer);
    assertBenchmarkSucceeded(renderer, result);
    results.push(result);
  }

  await persistResults(results);
}

function parseRenderers(args: string[]): Renderer[] {
  if (args.length === 0 || args.includes("compare")) {
    return ["string", "stream"];
  }

  return args.includes("stream") ? ["stream"] : ["string"];
}

function runBenchmark(renderer: Renderer) {
  const url = `${host}/render/${renderer}`;
  console.log(
    `Benchmarking ${renderer} at ${url} with ${connections} connections for ${duration}s`
  );

  return new Promise<Result>((resolve, reject) => {
    const instance = autocannon(
      {
        url,
        connections,
        duration,
        pipelining
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        console.log(formatSummary(renderer, result));
        resolve(result);
      }
    );

    autocannon.track(instance, {
      renderProgressBar: true
    });
  });
}

function formatSummary(renderer: Renderer, result: Result) {
  return [
    "",
    `=== ${renderer.toUpperCase()} ===`,
    `errors: ${result.errors}`,
    `2xx responses: ${result["2xx"]}`,
    `requests/sec avg: ${result.requests.average.toFixed(2)}`,
    `latency p50: ${result.latency.p50.toFixed(2)} ms`,
    `latency p99: ${result.latency.p99.toFixed(2)} ms`,
    `throughput avg: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MiB/s`
  ].join("\n");
}

async function persistResults(results: Result[]) {
  await mkdir(join(process.cwd(), "benchmarks"), { recursive: true });

  const outputPath = join(
    process.cwd(),
    "benchmarks",
    `benchmark-${Date.now()}.json`
  );

  await writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`Saved benchmark results to ${outputPath}`);
}

async function assertServerReachable() {
  const response = await fetch(`${host}/health`).catch(() => null);

  if (!response?.ok) {
    throw new Error(
      `Benchmark target is not reachable at ${host}. Start the server first or use npm run benchmark which now autostarts it.`
    );
  }
}

function assertBenchmarkSucceeded(renderer: Renderer, result: Result) {
  if (result.errors === 0 && result["2xx"] > 0 && result.requests.average > 0) {
    return;
  }

  throw new Error(
    [
      `Benchmark for ${renderer} did not complete successfully.`,
      `target: ${result.url}`,
      `errors: ${result.errors}`,
      `2xx responses: ${result["2xx"]}`,
      `requests avg: ${result.requests.average}`
    ].join("\n")
  );
}

void main();

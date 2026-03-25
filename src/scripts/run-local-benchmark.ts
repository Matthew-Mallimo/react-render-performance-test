import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const rendererArg = process.argv[2] ?? "compare";
const serverKind = process.env.SERVER_KIND ?? "fastify";
const serverEntry =
  serverKind === "express" ? "src/express-server.ts" : "src/server.ts";
const port = Number(
  process.env.PORT ?? (serverKind === "express" ? 3201 : 3200)
);
const benchmarkHost = `http://127.0.0.1:${port}`;

async function main() {
  const server = spawn("npx", ["tsx", serverEntry], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      FASTIFY_LOGGER: "false"
    },
    stdio: "inherit"
  });

  try {
    await waitForHealthcheck();
    await runBenchmark();
  } finally {
    server.kill("SIGINT");
    await onceExited(server);
  }
}

async function waitForHealthcheck() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await fetch(`${benchmarkHost}/health`).catch(() => null);
    if (response?.ok) {
      return;
    }

    await delay(250);
  }

  throw new Error(`Local server did not become healthy at ${benchmarkHost}`);
}

async function runBenchmark() {
  const benchmark = spawn("npx", ["tsx", "src/scripts/benchmark.ts", rendererArg], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BENCHMARK_HOST: benchmarkHost
    },
    stdio: "inherit"
  });

  await onceExited(benchmark);
}

function onceExited(child: ReturnType<typeof spawn>) {
  return new Promise<void>((resolve, reject) => {
    child.once("exit", (code) => {
      if (code === 0 || code === null || code === 130) {
        resolve();
        return;
      }

      reject(new Error(`Process exited with code ${code}`));
    });
    child.once("error", reject);
  });
}

void main();

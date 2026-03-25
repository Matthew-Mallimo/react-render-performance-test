import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

type Renderer = "string" | "stream";

const renderer = (process.argv[2] as Renderer | undefined) ?? "string";
const serverKind = process.env.SERVER_KIND ?? "fastify";
const serverEntry =
  serverKind === "express" ? "src/express-server.ts" : "src/server.ts";
const port = Number(
  process.env.PORT ?? (serverKind === "express" ? 3111 : 3110)
);
const duration = Number(process.env.PROFILE_DURATION ?? 20);
const connections = Number(process.env.PROFILE_CONNECTIONS ?? 40);
const profileDir = join(process.cwd(), "profiles", serverKind, renderer, "cpu");

async function main() {
  await mkdir(profileDir, { recursive: true });

  const server = spawn(
    "node",
    [
      `--cpu-prof`,
      `--cpu-prof-dir=${profileDir}`,
      "--import",
      "tsx",
      serverEntry
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        FASTIFY_LOGGER: "false"
      },
      stdio: "inherit"
    }
  );

  try {
    await waitForHealthcheck();
    await runLoad();
  } finally {
    server.kill("SIGTERM");
    await onceExited(server);
  }

  await delay(500);
  const profilePath = await findLatestCpuProfile();
  console.log(`CPU profile written to ${profilePath}`);
}

async function waitForHealthcheck() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:${port}/health`).catch(
      () => null
    );

    if (response?.ok) {
      return;
    }

    await delay(250);
  }

  throw new Error(`Server did not become healthy at http://127.0.0.1:${port}`);
}

async function runLoad() {
  const load = spawn(
    "npx",
    [
      "autocannon",
      `http://127.0.0.1:${port}/render/${renderer}`,
      "-c",
      String(connections),
      "-d",
      String(duration)
    ],
    {
      cwd: process.cwd(),
      stdio: "inherit"
    }
  );

  await onceExited(load);
}

async function findLatestCpuProfile() {
  const entries = await readdir(profileDir);
  const candidates = entries
    .filter((entry) => entry.endsWith(".cpuprofile"))
    .sort();

  const latest = candidates.at(-1);
  if (!latest) {
    throw new Error(`No .cpuprofile file found in ${profileDir}`);
  }

  return join(profileDir, latest);
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

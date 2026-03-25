import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";

type Renderer = "string" | "stream";

const renderer = (process.argv[2] as Renderer | undefined) ?? "string";
const serverKind = process.env.SERVER_KIND ?? "fastify";
const serverEntry =
  serverKind === "express" ? "src/express-server.ts" : "src/server.ts";
const port = Number(
  process.env.PORT ?? (serverKind === "express" ? 3101 : 3100)
);
const duration = Number(process.env.PROFILE_DURATION ?? 20);
const connections = Number(process.env.PROFILE_CONNECTIONS ?? 40);
const profileDir = join(process.cwd(), "profiles", serverKind, renderer);

async function main() {
  await mkdir(profileDir, { recursive: true });

  const onPortCommand = [
    "npx",
    "autocannon",
    `http://127.0.0.1:$PORT/render/${renderer}`,
    `-c`,
    String(connections),
    `-d`,
    String(duration)
  ].join(" ");

  const profiler = spawn(
    "npx",
    [
      "0x",
      "--output-dir",
      profileDir,
      "--title",
      `react-ssr-${serverKind}-${renderer}`,
      "--on-port",
      onPortCommand,
      "--",
      "node",
      "--import",
      "tsx",
      serverEntry
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port)
      },
      stdio: "inherit"
    }
  );

  await onceExited(profiler);

  console.log(`Flamegraph written under ${profileDir}`);
}

function onceExited(child: ReturnType<typeof spawn>) {
  return new Promise<void>((resolve, reject) => {
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Profiler exited with code ${code ?? "unknown"}`));
    });
    child.once("error", reject);
  });
}

void main();

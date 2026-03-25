import { spawn } from "node:child_process";

type ProfileMode = "cpu-profile" | "flamegraph";
type Variant =
  | "string"
  | "stream"
  | "express:string"
  | "express:stream";

const mode = (process.argv[2] as ProfileMode | undefined) ?? "cpu-profile";

const variants: Variant[] = [
  "string",
  "stream",
  "express:string",
  "express:stream"
];

async function main() {
  for (const variant of variants) {
    const script = `${mode}:${variant}`;
    console.log(`\n=== Running ${script} ===`);
    await runScript(script);
  }
}

function runScript(script: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("npm", ["run", script], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit"
    });

    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${script} exited with code ${code ?? "unknown"}`));
    });

    child.once("error", reject);
  });
}

void main();

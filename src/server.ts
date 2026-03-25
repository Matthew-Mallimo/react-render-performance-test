import Fastify from "fastify";
import React from "react";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { performance } from "node:perf_hooks";
import { PassThrough } from "node:stream";
import { App } from "./app/App.js";

const port = Number(process.env.PORT ?? 3000);
const loggerEnabled = process.env.FASTIFY_LOGGER === "true";

const app = Fastify({ logger: loggerEnabled });
let shuttingDown = false;

app.get("/health", async () => ({ ok: true }));

app.get("/", async (_request, reply) => {
  reply.redirect("/render/string");
});

app.get("/render/string", async (_request, reply) => {
  const startedAt = performance.now();
  const html = "<!DOCTYPE html>" + renderToString(React.createElement(App));
  const durationMs = performance.now() - startedAt;

  reply
    .header("content-type", "text/html; charset=utf-8")
    .header("x-renderer", "renderToString")
    .header("x-render-duration-ms", durationMs.toFixed(2));

  return reply.send(html);
});

app.get("/render/stream", async (_request, reply) => {
  const startedAt = performance.now();
  return new Promise<void>((resolve, reject) => {
    const body = new PassThrough();
    let didError = false;

    const { pipe, abort } = renderToPipeableStream(React.createElement(App), {
      onShellReady() {
        reply
          .code(didError ? 500 : 200)
          .header("content-type", "text/html; charset=utf-8")
          .header("x-renderer", "renderToPipeableStream")
          .header("x-shell-ready-ms", (performance.now() - startedAt).toFixed(2))
          .send(body);

        body.write("<!DOCTYPE html>");
        pipe(body);
        resolve();
      },
      onShellError(error) {
        reject(error);
      },
      onError(error) {
        didError = true;
        app.log.error(error);
      }
    });

    body.on("close", () => abort());
  });
});

async function start() {
  try {
    await app.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error({ error, signal }, "Failed to close Fastify server");
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void start();

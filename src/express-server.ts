import express from "express";
import React from "react";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { performance } from "node:perf_hooks";
import { PassThrough } from "node:stream";
import { App } from "./app/App.js";

const port = Number(process.env.PORT ?? 3001);
const app = express();
let shuttingDown = false;

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/", (_request, response) => {
  response.redirect("/render/string");
});

app.get("/render/string", (_request, response) => {
  const startedAt = performance.now();
  const html = "<!DOCTYPE html>" + renderToString(React.createElement(App));
  const durationMs = performance.now() - startedAt;

  response
    .status(200)
    .type("html")
    .setHeader("x-renderer", "renderToString")
    .setHeader("x-render-duration-ms", durationMs.toFixed(2))
    .send(html);
});

app.get("/render/stream", (_request, response) => {
  const startedAt = performance.now();
  const body = new PassThrough();
  let didError = false;

  const { pipe, abort } = renderToPipeableStream(React.createElement(App), {
    onShellReady() {
      response
        .status(didError ? 500 : 200)
        .type("html")
        .setHeader("x-renderer", "renderToPipeableStream")
        .setHeader("x-shell-ready-ms", (performance.now() - startedAt).toFixed(2));

      body.write("<!DOCTYPE html>");
      body.pipe(response);
      pipe(body);
    },
    onShellError(error) {
      response.status(500).json({
        error: "Failed to render stream",
        detail: error instanceof Error ? error.message : String(error)
      });
    },
    onError(error) {
      didError = true;
      console.error(error);
    }
  });

  response.on("close", () => {
    abort();
  });
});

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Express server listening at http://127.0.0.1:${port}`);
});

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
      return;
    }

    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

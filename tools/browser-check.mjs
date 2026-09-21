// Dependency-free browser check: serves the site, launches a Chromium build,
// runs the page drivers over the DevTools Protocol, and reports pass/fail.
//
//   node tools/browser-check.mjs
//   CHROME="/path/to/Chrome" node tools/browser-check.mjs
//
// Needs Node 22+ and any Chromium build (the release-channel Chrome app is
// fine). The page drivers are plain scripts evaluated inside the page, so they
// exercise the real DOM rather than a test-only shim.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium"
  ];
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
  if (fs.existsSync(cache)) {
    for (const entry of fs.readdirSync(cache)) {
      if (!entry.startsWith("chromium")) continue;
      const arch = fs.readdirSync(path.join(cache, entry)).find((name) => name.startsWith("chrome-mac-"));
      if (!arch) continue;
      const app = path.join(cache, entry, arch, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
      if (fs.existsSync(app)) candidates.unshift(app);
    }
  }
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function serve() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
    if (!target.startsWith(root) || !fs.existsSync(target)) {
      if (url.pathname === "/favicon.ico") {
        res.writeHead(204).end();
        return;
      }
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(target)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(fs.readFileSync(target));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

async function connect(port, url, driverFile, label, scheme) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  const pending = new Map();
  const problems = [];
  let id = 0;
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id);
      pending.delete(message.id);
      message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      problems.push("exception: " + (message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text));
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      problems.push("console error: " + message.params.entry.text + " (" + (message.params.entry.url || "") + ")");
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    pending.set(next, { resolve, reject });
    ws.send(JSON.stringify({ id: next, method, params }));
  });

  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setEmulatedMedia", { features: [
    { name: "prefers-reduced-motion", value: "reduce" },
    { name: "prefers-color-scheme", value: scheme || "light" }
  ] });
  await send("Page.navigate", { url });
  for (let i = 0; i < 60; i++) {
    const ready = await send("Runtime.evaluate", { expression: "!!(window.QZ && window.QZ.state && window.QZ.state.screen)", returnByValue: true });
    if (ready.result.value) break;
    await sleep(150);
  }
  await sleep(400);

  const outcome = await send("Runtime.evaluate", {
    expression: fs.readFileSync(driverFile, "utf8"),
    awaitPromise: true,
    returnByValue: true
  });
  ws.close();

  if (outcome.exceptionDetails) {
    return { label, failures: 1, total: 1, results: [{ name: "driver ran to completion", pass: false, detail: outcome.exceptionDetails.exception?.description || outcome.exceptionDetails.text }], problems };
  }
  const report = outcome.result.value;
  return { label, failures: report.failures.length, total: report.total, results: report.results, problems, typeTally: report.typeTally, score: report.score };
}

const chrome = findChrome();
if (!chrome) {
  console.log("No Chromium build found. Set CHROME=/path/to/browser and retry.");
  process.exit(2);
}

const { server, port: sitePort } = await serve();
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "qz-profile-"));
const debugPort = 9500 + Math.floor(Math.random() * 400);
const browser = spawn(chrome, [
  "--headless=new",
  "--remote-debugging-port=" + debugPort,
  "--user-data-dir=" + profile,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "about:blank"
], { stdio: "ignore" });

async function waitForCdp() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) return true;
    } catch (error) {
      // browser still starting
    }
    await sleep(250);
  }
  return false;
}

if (!await waitForCdp()) {
  console.log("Chromium did not expose a debugging port");
  browser.kill();
  server.close();
  process.exit(2);
}

const base = `http://127.0.0.1:${sitePort}/`;
const runs = [
  { label: "full flow", url: base, driver: path.join(root, "tools/page-flow.js") },
  { label: "matching drag", url: base + "?deck=both&seed=drag52", driver: path.join(root, "tools/page-matching.js") },
  { label: "dark mode", url: base + "?deck=network&seed=darkpass", driver: path.join(root, "tools/page-dark.js"), scheme: "dark" }
];

let failed = 0;
for (const run of runs) {
  const result = await connect(debugPort, run.url, run.driver, run.label, run.scheme);
  console.log(`\n${run.label}: ${result.total - result.failures}/${result.total} checks passed`);
  for (const entry of result.results) {
    if (entry.pass) continue;
    console.log("  FAIL " + entry.name + (entry.detail ? " -> " + entry.detail : ""));
  }
  if (result.typeTally) console.log("  types: " + JSON.stringify(result.typeTally));
  if (result.problems.length) {
    console.log("  page problems: " + result.problems.join(" | "));
  }
  failed += result.failures + result.problems.length;
}

browser.kill();
server.close();
console.log(failed === 0 ? "\nbrowser check: PASS" : `\nbrowser check: ${failed} failures`);
process.exit(failed === 0 ? 0 : 1);
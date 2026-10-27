// Shared helper: run the proforma CLI (npm: proforma-mcp) from the kit's scripts.
//
// Resolution order: PROFORMA_BIN (a native binary or bin/proforma.js), a global
// npm install of proforma-mcp, a native `proforma` on PATH, then a private npm
// install of the pinned version in ~/.cache/proforma-mcp/<version>.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const PROFORMA_MCP_VERSION = "0.2.0";

function resolveCli() {
  const asCmd = (file) => (file.endsWith(".js") ? { cmd: process.execPath, pre: [file] } : { cmd: file, pre: [] });
  const env = process.env.PROFORMA_BIN || process.env.PROFORMA_BINARY;
  if (env && fs.existsSync(env)) return asCmd(env);
  const roots = [];
  if (process.env.APPDATA) roots.push(path.join(process.env.APPDATA, "npm", "node_modules"));
  roots.push(path.join(path.dirname(process.execPath), "node_modules"));
  roots.push(path.join(path.dirname(process.execPath), "..", "lib", "node_modules"));
  if (process.env.npm_config_prefix) {
    roots.push(path.join(process.env.npm_config_prefix, "node_modules"));
    roots.push(path.join(process.env.npm_config_prefix, "lib", "node_modules"));
  }
  for (const r of roots) {
    const js = path.join(r, "proforma-mcp", "bin", "proforma.js");
    if (fs.existsSync(js) && supportsExport(asCmd(js))) return asCmd(js);
  }
  const exe = process.platform === "win32" ? "proforma.exe" : "proforma";
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    const f = dir && path.join(dir, exe);
    if (f && fs.existsSync(f) && fs.statSync(f).isFile() && supportsExport(asCmd(f))) return asCmd(f);
  }
  const cache = path.join(os.homedir(), ".cache", "proforma-mcp", PROFORMA_MCP_VERSION);
  const js = path.join(cache, "node_modules", "proforma-mcp", "bin", "proforma.js");
  // a cached install without its platform binary (optional dependency skipped) is useless: reinstall
  if (fs.existsSync(js) && !supportsExport(asCmd(js))) fs.rmSync(cache, { recursive: true, force: true });
  if (!fs.existsSync(js)) {
    console.error(`installing proforma-mcp@${PROFORMA_MCP_VERSION} into ${cache}`);
    fs.mkdirSync(cache, { recursive: true });
    // npm is npm.cmd on Windows and needs a shell, which does not quote arguments: quote the path
    const win = process.platform === "win32";
    const r = spawnSync("npm", ["install", "--no-save", "--prefix", win ? `"${cache}"` : cache, `proforma-mcp@${PROFORMA_MCP_VERSION}`], {
      stdio: ["ignore", 2, 2], // keep stdout for the caller
      shell: win,
    });
    if (r.status !== 0 || !fs.existsSync(js) || !supportsExport(asCmd(js))) {
      fs.rmSync(cache, { recursive: true, force: true });
      throw new Error(`could not install a working proforma-mcp@${PROFORMA_MCP_VERSION} for ${process.platform}-${process.arch}; set PROFORMA_BIN`);
    }
  }
  return asCmd(js);
}

// Older installs (< 0.2.0) have no `export` command; skip them.
function supportsExport(cli) {
  const r = spawnSync(cli.cmd, [...cli.pre, "export", "--help"], { encoding: "utf8" });
  return r.status === 0;
}

let CLI = null;

/** Run `proforma <args>`; returns {status, stdout, stderr}. */
export function proforma(args) {
  CLI = CLI || resolveCli();
  const r = spawnSync(CLI.cmd, [...CLI.pre, ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.error) throw new Error(`failed to run proforma: ${r.error.message}`);
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

/** The guideline as the proforma-export/1 JSON model. */
export function exportGuideline(file) {
  const r = proforma(["export", "--file", file]);
  if (r.status !== 0) throw new Error((r.stderr || r.stdout).trim() || `proforma export failed on ${file}`);
  return JSON.parse(r.stdout);
}

/** Lint diagnostics as an array of {severity, code, message, component?, line?}. */
export function lintGuideline(file) {
  const r = proforma(["lint", "--file", file, "--format", "json"]);
  try {
    const v = JSON.parse(r.stdout);
    return Array.isArray(v) ? v : v.diagnostics || [];
  } catch {
    return [{ severity: "error", code: "lint", message: (r.stdout + r.stderr).trim() || "lint failed" }];
  }
}

/** Values of a repeatable metaprops key: `key`, `key.1`, `key.2`, ... */
export function metaValues(metaprops, key) {
  return Object.entries(metaprops || {})
    .filter(([k]) => k === key || new RegExp(`^${key.replace(/\./g, "\\.")}\\.\\d+$`).test(k))
    .sort(([a], [b]) => (parseInt(a.split(".").pop(), 10) || 0) - (parseInt(b.split(".").pop(), 10) || 0))
    .map(([, v]) => v);
}

/** A value as a PROforma single-quoted text atom. */
export function pfText(s) {
  return "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

// Composer (Java 8 on Windows) reads a .pf file as windows-1252, and the CLI keeps that
// encoding only while every character fits; one character outside it turns the whole file
// into UTF-8, which Composer then misreads. So:
// - plain text attributes get the usual typographic characters outside windows-1252 spelled in ASCII;
// - metaprops values get every non-ASCII character as a \uXXXX escape, as Composer's own
//   Java-properties writer does (the tools decode it back).
const CP1252_EXTRA = new Set([..."€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ"]);
export const inCp1252 = (ch) => ch.codePointAt(0) < 0x80 || (ch.codePointAt(0) >= 0xa0 && ch.codePointAt(0) <= 0xff) || CP1252_EXTRA.has(ch);
const ASCII_FOR = { "≥": ">=", "≤": "<=", "≠": "!=", "→": "->", "←": "<-", "≈": "~", "−": "-", "‑": "-", " ": " ", " ": " ", " ": " " };
export function cp1252Text(s, where = "text") {
  return [...String(s)].map((ch) => {
    if (inCp1252(ch) && ch !== " ") return ch;
    if (ASCII_FOR[ch] !== undefined) return ASCII_FOR[ch];
    throw new Error(`${where}: character ${JSON.stringify(ch)} (U+${ch.codePointAt(0).toString(16).toUpperCase()}) does not fit Composer's windows-1252 encoding; spell it in ASCII`);
  }).join("");
}
// (the pattern has no u flag, so it matches UTF-16 units: an astral character becomes its
// surrogate pair, as java.util.Properties writes it)
export function escapeMetapropValue(s) {
  return String(s).replace(/[^\x00-\x7f]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"));
}

/** Set one attribute (caption, description, procedure, ...) to a text value through the CLI. */
export function setAttribute(file, selector, attribute, value) {
  const text = attribute === "metaprops" ? String(value) : cp1252Text(value, `${selector} ${attribute}`);
  const r = proforma(["set", "--file", file, "--selector", selector, "--attribute", attribute, "--value", pfText(text)]);
  if (r.status !== 0) throw new Error(`proforma set ${selector} ${attribute}: ${(r.stderr || r.stdout).trim()}`);
}

/** Replace the whole metaprops map of an element ({key: value}); keys keep the given order until `format` sorts them. */
export function setMetaprops(file, selector, map) {
  const lines = Object.entries(map).map(([k, v]) => {
    const value = String(v).replace(/\r?\n/g, " ").trim();
    if (!value) throw new Error(`${selector}: empty metaprops value for ${k}`);
    return `${k}=${escapeMetapropValue(value)}`;
  });
  setAttribute(file, selector, "metaprops", lines.join("\n") + "\n");
}

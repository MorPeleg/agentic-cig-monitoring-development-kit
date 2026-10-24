#!/usr/bin/env node
// owl2pf.mjs: export a PROforma CIG ABox (OWL functional syntax, built on
// cig/proforma.owl) to an executable PROforma 1.9 guideline (.pf).
//
// Input: OWL functional syntax (what the owl MCP server writes) or RDF/XML.
//
// Usage:
//   node owl2pf.mjs <ontology.owl> [--out <file.pf>] [--root <PlanName>]
//                   [--mermaid <file.mmd|file.md>] [--report <file.json>]
//
// The OWL file stays the source of truth: the .pf is a derived artifact.
// The export is deterministic: the same OWL always gives the same .pf.
// Free-text PROforma_Condition strings that do not type-check as PROforma
// expressions are not written as expressions. Each one is kept in the task's
// metaprops (owl.precondition, owl.recommendation, ...) and listed in the
// report under "needs_formalization".
//
// The proforma CLI (npm: proforma-mcp) is resolved from, in order: PROFORMA_BIN
// (a native binary or bin/proforma.js), a global npm install of proforma-mcp,
// a native `proforma` binary on PATH, and finally a private npm install
// of the pinned version (in ~/.cache/proforma-mcp).

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROFORMA_MCP_VERSION = "0.1.0";
const PF = "http://www.owl-ontologies.com/Ontology1779030093.owl#";

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = { input: null, out: null, root: null, mermaid: null, report: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) die(`missing value for ${a}`);
      return argv[++i];
    };
    if (a === "--out") opts.out = next();
    else if (a === "--root") opts.root = next();
    else if (a === "--mermaid") opts.mermaid = next();
    else if (a === "--report") opts.report = next();
    else if (a === "-h" || a === "--help") {
      console.log(
        "usage: node owl2pf.mjs <ontology.owl> [--out file.pf] [--root PlanName] [--mermaid file.mmd] [--report file.json]"
      );
      process.exit(0);
    } else if (a.startsWith("--")) die(`unknown option ${a}`);
    else if (!opts.input) opts.input = a;
    else die(`unexpected argument ${a}`);
  }
  if (!opts.input) die("missing <ontology.owl>");
  if (!opts.out) opts.out = opts.input.replace(/\.(owl|ofn)$/i, "") + ".pf";
  return opts;
}

function die(msg, code = 2) {
  console.error(`owl2pf: ${msg}`);
  process.exit(code);
}

// ------------------------------------------------- OWL functional syntax

function tokenize(text) {
  const toks = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (/\s/.test(c)) {
      i++;
    } else if (c === "#") {
      while (i < n && text[i] !== "\n") i++;
    } else if (c === "(" || c === ")") {
      toks.push({ t: c });
      i++;
    } else if (c === "<") {
      const j = text.indexOf(">", i);
      if (j < 0) die("unterminated IRI");
      toks.push({ t: "iri", v: text.slice(i + 1, j) });
      i = j + 1;
    } else if (c === '"') {
      let v = "";
      i++;
      while (i < n && text[i] !== '"') {
        if (text[i] === "\\" && i + 1 < n) {
          v += text[i + 1];
          i += 2;
        } else v += text[i++];
      }
      i++;
      let lang = null;
      let dt = null;
      if (text[i] === "@") {
        const m = /^@[A-Za-z0-9-]+/.exec(text.slice(i));
        lang = m[0].slice(1);
        i += m[0].length;
      } else if (text.startsWith("^^", i)) {
        i += 2;
        if (text[i] === "<") {
          const j = text.indexOf(">", i);
          dt = text.slice(i + 1, j);
          i = j + 1;
        } else {
          const m = /^[^\s()]+/.exec(text.slice(i));
          dt = m[0];
          i += m[0].length;
        }
      }
      toks.push({ t: "lit", v, lang, dt });
    } else {
      const m = /^[^\s()<>"]+/.exec(text.slice(i));
      toks.push({ t: "name", v: m[0] });
      i += m[0].length;
    }
  }
  return toks;
}

// Returns a list of nodes: {head, args} for calls, or tokens for atoms.
function parseOfn(text) {
  const toks = tokenize(text);
  let p = 0;
  function node() {
    const tok = toks[p++];
    if (tok.t === "name" && toks[p] && toks[p].t === "(") {
      p++;
      const args = [];
      while (p < toks.length && toks[p].t !== ")") args.push(node());
      p++;
      return { head: tok.v, args };
    }
    return tok;
  }
  const out = [];
  while (p < toks.length) out.push(node());
  return out;
}

const RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const OWL = "http://www.w3.org/2002/07/owl#";

// Both readers produce triples: [subject, predicate, object, isLiteral].
function ofnTriples(text, file) {
  const nodes = parseOfn(text);
  const prefixes = {};
  let ontology = null;
  for (const nd of nodes) {
    if (nd.head === "Prefix") {
      const decl = nd.args[0].v; // "pf:="
      prefixes[decl.replace(/:=$/, "")] = nd.args[1].v;
    } else if (nd.head === "Ontology") ontology = nd;
  }
  if (!ontology) die(`${file}: no Ontology(...) block found`);
  const expand = (tok) => {
    if (tok.t === "iri") return tok.v;
    if (tok.t !== "name") return null;
    const k = tok.v.indexOf(":");
    if (k >= 0 && prefixes[tok.v.slice(0, k)] !== undefined) return prefixes[tok.v.slice(0, k)] + tok.v.slice(k + 1);
    return tok.v; // bare local name (owl-mcp writes these without a prefix)
  };
  const triples = [];
  let header = 0;
  let ontIri = null;
  for (const a of ontology.args) {
    if (!a.head) {
      if (a.t === "iri" && header === 0) {
        ontIri = a.v;
        triples.push([a.v, RDF + "type", OWL + "Ontology", false]);
      } else if (a.t === "iri" && header === 1) triples.push([ontIri, OWL + "versionIRI", a.v, false]);
      header++;
      continue;
    }
    header = 2;
    const args = a.args.filter((x) => x.head !== "Annotation");
    if (a.head === "ClassAssertion") {
      const cls = expand(args[0]);
      const ind = expand(args[1]);
      if (cls && ind) triples.push([ind, RDF + "type", cls, false]);
    } else if (a.head === "ObjectPropertyAssertion") {
      triples.push([expand(args[1]), expand(args[0]), expand(args[2]), false]);
    } else if (a.head === "DataPropertyAssertion" && args[2]?.t === "lit") {
      triples.push([expand(args[1]), expand(args[0]), args[2].v, true]);
    } else if (a.head === "AnnotationAssertion") {
      const lit = args[2].t === "lit";
      triples.push([expand(args[1]), expand(args[0]), lit ? args[2].v : expand(args[2]), lit]);
    }
  }
  return triples;
}

// Minimal RDF/XML reader (striped syntax, as written by Protege and the OWL API).
function rdfXmlTriples(text, file) {
  const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  for (const m of text.matchAll(/<!ENTITY\s+(\S+)\s+(["'])([\s\S]*?)\2\s*>/g)) entities[m[1]] = m[3];
  const decode = (s) =>
    s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z_][\w.-]*);/g, (all, e) => {
      if (e[0] === "#") return String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return entities[e] ?? all;
    });
  // element tree
  const root = { name: "#root", attrs: {}, children: [], text: "" };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<![^>]*(?:\[[\s\S]*?\])?\s*>|<\?[\s\S]*?\?>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(text))) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) top.text += m[1];
    else if (m[2]) stack.pop();
    else if (m[3]) {
      const attrs = {};
      for (const a of m[4].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]] = decode(a[2] ?? a[3]);
      const el = { name: m[3], attrs, children: [], text: "" };
      top.children.push(el);
      if (!m[5]) stack.push(el);
    } else if (m[6] !== undefined) top.text += decode(m[6]);
  }
  const rdfRoot = root.children.find((e) => /(^|:)RDF$/.test(e.name));
  if (!rdfRoot) die(`${file}: no rdf:RDF element`);

  const triples = [];
  let blank = 0;
  const resolve = (ref, base) => {
    if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(ref)) return ref;
    const b = base.replace(/#.*$/, "");
    if (ref === "") return b;
    if (ref.startsWith("#")) return b + ref;
    return b.replace(/[^/]*$/, "") + ref;
  };
  const scope = (el, parent) => {
    const ns = { ...parent.ns };
    for (const [k, v] of Object.entries(el.attrs)) {
      if (k === "xmlns") ns[""] = v;
      else if (k.startsWith("xmlns:")) ns[k.slice(6)] = v;
    }
    const base = el.attrs["xml:base"] ? resolve(el.attrs["xml:base"], parent.base || "") : parent.base;
    const lang = el.attrs["xml:lang"] ?? parent.lang;
    return { ns, base, lang };
  };
  const qname = (name, ctx) => {
    const k = name.indexOf(":");
    const prefix = k < 0 ? "" : name.slice(0, k);
    const local = k < 0 ? name : name.slice(k + 1);
    return (ctx.ns[prefix] ?? "") + local;
  };
  const isSyntax = (k) => k.startsWith("xmlns") || k.startsWith("xml:") || /^rdf:(about|ID|nodeID|resource|datatype|parseType)$/.test(k);

  function nodeElement(el, parentCtx) {
    const ctx = scope(el, parentCtx);
    const a = el.attrs;
    let subj;
    if (a["rdf:about"] !== undefined) subj = resolve(a["rdf:about"], ctx.base);
    else if (a["rdf:ID"] !== undefined) subj = resolve("#" + a["rdf:ID"], ctx.base);
    else if (a["rdf:nodeID"] !== undefined) subj = "_:" + a["rdf:nodeID"];
    else subj = `_:b${++blank}`;
    const type = qname(el.name, ctx);
    if (type !== RDF + "Description") triples.push([subj, RDF + "type", type, false]);
    for (const [k, v] of Object.entries(a)) if (!isSyntax(k)) triples.push([subj, qname(k, ctx), v, true]);
    for (const p of el.children) propertyElement(p, subj, ctx);
    return subj;
  }
  function propertyElement(el, subj, parentCtx) {
    const ctx = scope(el, parentCtx);
    const pred = qname(el.name, ctx);
    const a = el.attrs;
    if (a["rdf:resource"] !== undefined) triples.push([subj, pred, resolve(a["rdf:resource"], ctx.base), false]);
    else if (a["rdf:nodeID"] !== undefined) triples.push([subj, pred, "_:" + a["rdf:nodeID"], false]);
    else if (a["rdf:parseType"] === "Resource") {
      const b = `_:b${++blank}`;
      triples.push([subj, pred, b, false]);
      for (const p of el.children) propertyElement(p, b, ctx);
    } else if (el.children.length) {
      for (const c of el.children) triples.push([subj, pred, nodeElement(c, ctx), false]);
    } else triples.push([subj, pred, el.text.trim(), true]);
  }
  const ctx0 = scope(rdfRoot, { ns: {}, base: "", lang: null });
  for (const el of rdfRoot.children) nodeElement(el, ctx0);
  return triples;
}

function loadOwl(file) {
  const text = fs.readFileSync(file, "utf8");
  const triples = /^\s*(<\?xml|<rdf:RDF|<!DOCTYPE)/.test(text) ? rdfXmlTriples(text, file) : ofnTriples(text, file);
  const g = {
    iri: null,
    versionIri: null,
    types: new Map(), // individual -> Set(PROforma class local name)
    obj: new Map(), // individual -> Map(prop -> [individual])
    data: new Map(), // individual -> Map(prop -> [string])
    ann: new Map(), // subject -> Map(prop -> [string])
    order: [], // individuals in order of first appearance
  };
  const seen = new Set();
  const touch = (s) => {
    if (!seen.has(s)) {
      seen.add(s);
      g.order.push(s);
    }
  };
  const push = (map, s, p, v) => {
    if (!map.has(s)) map.set(s, new Map());
    const m = map.get(s);
    if (!m.has(p)) m.set(p, []);
    m.get(p).push(v);
  };
  const pfLocal = (iri) => (iri && iri.startsWith(PF) ? iri.slice(PF.length) : null);
  for (const [s, p, o, lit] of triples) {
    if (!s || !p) continue;
    if (p === RDF + "type" && o === OWL + "Ontology") {
      if (!g.iri) g.iri = s;
    } else if (p === OWL + "versionIRI") g.versionIri = o;
    else if (p === RDF + "type") {
      const cls = pfLocal(o);
      if (!cls) continue;
      touch(s);
      if (!g.types.has(s)) g.types.set(s, new Set());
      g.types.get(s).add(cls);
    } else if (pfLocal(p)) {
      touch(s);
      if (lit) push(g.data, s, pfLocal(p), o);
      else {
        touch(o);
        push(g.obj, s, pfLocal(p), o);
      }
    } else push(g.ann, s, p, o);
  }
  return g;
}

// ------------------------------------------------------------ helpers

const KEYWORDS = new Set(
  (
    "abort action and argument argument_name attributes autonomous candidate caption choice_mode component " +
    "context cycle_repeat cycle_until data data_definition decision default_value derivation description " +
    "dynamic end engine_version enquiry false_value for function function_trigger goal group in " +
    "include ltwh mandatory mandatory_validation metadata metaprops not number_of_cycles optional or " +
    "param_value parameters plan postcondition precondition preselect_candidates priority procedure range " +
    "recommendation schedule_constraint source support_mode task_definition terminal terminate title " +
    "trigger true_value type unit version wait_condition warning_condition"
  ).split(" ")
);

function localName(iri) {
  const m = /[#/:]([^#/:]*)$/.exec(iri);
  return m && m[1] ? m[1] : iri;
}

function sanitizeName(raw) {
  let s = String(raw).trim().replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  if (!s) s = "unnamed";
  if (/^[0-9]/.test(s)) s = "n_" + s;
  return s;
}

const atom = (s) => "'" + String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
const oneLine = (s) => String(s).replace(/\s*[\r\n]+\s*/g, " ").trim();

// Java .properties escaping, as Composer stores metaprops.
function propKey(k) {
  return k.replace(/[\\=: #!]/g, (c) => "\\" + c);
}
function propValue(v) {
  return oneLine(v)
    .replace(/\\/g, "\\\\")
    .replace(/^ /, "\\ ");
}

// The kit's metaprops grammar is `key=value; key=value` on one line, with
// `source` repeatable. Split only at "; " followed by a key.
function parseKitMetaprops(s) {
  const text = oneLine(s);
  const parts = text.split(/;\s+(?=[A-Za-z_][A-Za-z0-9_.]*\s*=)/);
  const pairs = [];
  for (const part of parts) {
    const m = /^([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*([\s\S]*)$/.exec(part.trim());
    if (!m) return null;
    pairs.push([m[1], m[2].replace(/;\s*$/, "")]);
  }
  return pairs;
}

// ----------------------------------------------------- proforma CLI resolution

function resolveCli() {
  const asCmd = (file) =>
    file.endsWith(".js") ? { cmd: process.execPath, pre: [file] } : { cmd: file, pre: [] };
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
    if (fs.existsSync(js)) return asCmd(js);
  }
  const exe = process.platform === "win32" ? "proforma.exe" : "proforma";
  for (const dir of (process.env.PATH || "").split(path.delimiter)) {
    const f = path.join(dir, exe);
    if (dir && fs.existsSync(f) && fs.statSync(f).isFile()) {
      // Skip npm's shell shim on unix: it is a symlink to proforma.js, which also works.
      return asCmd(f);
    }
  }
  const cache = path.join(os.homedir(), ".cache", "proforma-mcp", PROFORMA_MCP_VERSION);
  const js = path.join(cache, "node_modules", "proforma-mcp", "bin", "proforma.js");
  if (!fs.existsSync(js)) {
    console.error(`owl2pf: installing proforma-mcp@${PROFORMA_MCP_VERSION} into ${cache}`);
    fs.mkdirSync(cache, { recursive: true });
    const r = spawnSync("npm", ["install", "--no-save", "--prefix", cache, `proforma-mcp@${PROFORMA_MCP_VERSION}`], {
      stdio: ["ignore", 2, 2], // keep stdout for the summary
      shell: process.platform === "win32", // npm is npm.cmd on Windows; the arguments are constants
    });
    if (r.status !== 0 || !fs.existsSync(js)) die("could not install proforma-mcp; set PROFORMA_BIN");
  }
  return asCmd(js);
}

let CLI = null;
function proforma(args) {
  CLI = CLI || resolveCli();
  const r = spawnSync(CLI.cmd, [...CLI.pre, ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.error) die(`failed to run proforma: ${r.error.message}`);
  return { status: r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

// ------------------------------------------------------------- conversion

function convert(g, opts) {
  const report = {
    input: opts.input,
    output: opts.out,
    root: null,
    counts: {},
    needs_formalization: [],
    kept_as_text: [],
    atoms_compared: [],
    warnings: [],
    lint: null,
  };
  const warn = (msg) => {
    if (!report.warnings.includes(msg)) report.warnings.push(msg);
  };
  const is = (ind, cls) => g.types.get(ind)?.has(cls);
  const d1 = (s, p) => g.data.get(s)?.get(p)?.[0];
  const dAll = (s, p) => g.data.get(s)?.get(p) || [];
  const o1 = (s, p) => g.obj.get(s)?.get(p)?.[0];
  const oAll = (s, p) => g.obj.get(s)?.get(p) || [];
  const ofKind = (cls) => g.order.filter((x) => is(x, cls));
  for (const s of g.order) {
    for (const [p, vals] of g.data.get(s) || []) {
      if (vals.length > 1 && !["metaprops", "author"].includes(p)) {
        warn(`${localName(s)} has ${vals.length} pf:${p} values; the first is used`);
      }
    }
  }

  // ---- names (pf:name when it is a valid identifier, else the IRI local name)
  const used = new Map(); // lowercased name -> individual (PROforma names are case-insensitive)
  const nameOf = new Map();
  const assignName = (ind) => {
    if (nameOf.has(ind)) return nameOf.get(ind);
    const pfName = d1(ind, "name");
    let base = sanitizeName(pfName && /^[A-Za-z_][A-Za-z0-9_]*$/.test(pfName) ? pfName : localName(ind));
    let nm = base;
    for (let k = 2; used.has(nm.toLowerCase()) && used.get(nm.toLowerCase()) !== ind; k++) nm = `${base}_${k}`;
    if (nm !== base) warn(`name clash: ${localName(ind)} renamed to ${nm}`);
    used.set(nm.toLowerCase(), ind);
    nameOf.set(ind, nm);
    return nm;
  };

  const TASK_KINDS = ["Plan", "Decision", "Enquiry", "Action"];
  const kindOf = (ind) => TASK_KINDS.find((k) => is(ind, k)) || (is(ind, "Task") ? "Action" : null);
  const tasks = g.order.filter((x) => kindOf(x));
  const dataItems = ofKind("Data");

  // ---- plan hierarchy and root
  const childPlans = new Map();
  const referenced = new Set();
  for (const p of tasks.filter((t) => kindOf(t) === "Plan")) {
    for (const c of oAll(p, "components")) {
      const t = o1(c, "taskref");
      if (t) referenced.add(t);
    }
  }
  const roots = tasks.filter((t) => kindOf(t) === "Plan" && !referenced.has(t));
  let root;
  if (opts.root) {
    root = tasks.find((t) => kindOf(t) === "Plan" && (localName(t) === opts.root || d1(t, "name") === opts.root));
    if (!root) die(`--root ${opts.root}: no such pf:Plan`);
  } else if (roots.length === 1) root = roots[0];
  else if (roots.length === 0) die("no root plan: every pf:Plan is the taskref of some component (cycle?)");
  else {
    const size = (p, seen = new Set()) => {
      if (seen.has(p)) return 0;
      seen.add(p);
      return oAll(p, "components").reduce((n, c) => {
        const t = o1(c, "taskref");
        return n + 1 + (t && kindOf(t) === "Plan" ? size(t, seen) : 0);
      }, 0);
    };
    root = [...roots].sort((a, b) => size(b) - size(a) || localName(a).localeCompare(localName(b)))[0];
    warn(
      `${roots.length} plan roots (${roots.map(localName).join(", ")}); exporting ${localName(root)}. Use --root to choose another.`
    );
  }

  // ---- walk from the root (reachable task definitions only)
  const reach = [];
  const reachSet = new Set();
  const visit = (t, stack) => {
    if (stack.includes(t)) die(`plan cycle: ${[...stack, t].map(localName).join(" -> ")}`);
    if (reachSet.has(t)) return;
    reachSet.add(t);
    reach.push(t);
    if (kindOf(t) !== "Plan") return;
    for (const c of oAll(t, "components")) {
      const sub = o1(c, "taskref");
      if (!sub) warn(`component ${localName(c)} has no pf:taskref; skipped`);
      else if (!kindOf(sub)) warn(`component ${localName(c)} refers to ${localName(sub)}, which is not a pf:Task; skipped`);
      else visit(sub, [...stack, t]);
    }
  };
  visit(root, []);
  for (const t of tasks) {
    if (!reachSet.has(t)) warn(`${kindOf(t)} ${localName(t)} is not reachable from ${localName(root)}; not exported`);
  }
  report.root = assignName(root);
  reach.forEach(assignName);

  // ---- data items used by the exported tasks (sources + any declared Data)
  for (const d of dataItems) assignName(d);
  const candidates = new Set();
  for (const t of reach.filter((x) => kindOf(x) === "Decision")) {
    for (const c of oAll(t, "candidates")) candidates.add(assignName(c));
  }

  // ---- expressions: collect, translate, infer data types
  const translate = (s) =>
    oneLine(s)
      .replace(/&&/g, " and ")
      .replace(/\|\|/g, " or ")
      .replace(/!=/g, "<>")
      .replace(/==/g, "=")
      .replace(/\b(?:AND|And)\b/g, "and")
      .replace(/\b(?:OR|Or)\b/g, "or")
      .replace(/\b(?:NOT|Not)\s*\(/g, "not(") // negation is a function in PROforma
      .replace(/\b(?:TRUE|True)\b/g, "true")
      .replace(/\b(?:FALSE|False)\b/g, "false")
      .replace(/\s+/g, " ");
  const condText = (c) => d1(c, "string_representation") ?? d1(c, "value") ?? d1(c, "caption");
  const exprs = []; // {key, owner, slot, text, expr, assertion}
  const addExpr = (owner, slot, cond, assertion = false) => {
    if (!cond) return null;
    const text = condText(cond);
    if (text === undefined) {
      warn(`${localName(cond)} (pf:${slot} of ${localName(owner)}) has no string_representation`);
      return null;
    }
    const e = { owner, slot, cond, text, expr: translate(text), assertion, ok: false };
    exprs.push(e);
    return e;
  };

  const dataByName = new Map(dataItems.map((d) => [assignName(d), d]));
  const typeOf = new Map();
  const numericRe = (nm) =>
    new RegExp(`(?:\\b${nm}\\s*(?:>=|<=|<>|=|<|>)\\s*-?\\d|-?\\d[\\d.]*\\s*(?:>=|<=|<>|=|<|>)\\s*${nm}\\b)`);
  const boolRe = (nm) => new RegExp(`\\b${nm}\\s*(?:=|<>)\\s*(?:true|false)\\b`);

  // ---- emit
  const extraProps = new Map(); // owner -> [[k, v]] added to the individual's metaprops
  const addExtra = (owner, k, v) => {
    if (!extraProps.has(owner)) extraProps.set(owner, []);
    extraProps.get(owner).push([k, v]);
  };
  const L = [];
  const meta = ofKind("Metadata")[0];
  // Ontology annotations; owl-mcp may leave the header anonymous, so fall back to
  // the annotated subject that is not an individual.
  const ontSubject =
    g.iri && g.ann.has(g.iri) ? g.iri : [...g.ann.keys()].find((s) => !g.types.has(s) && /^[a-z]+:\/\//i.test(s));
  const ontIri = g.iri || ontSubject || null;
  const label = g.ann.get(ontSubject)?.get("http://www.w3.org/2000/01/rdf-schema#label")?.[0];
  const comment = g.ann.get(ontSubject)?.get("http://www.w3.org/2000/01/rdf-schema#comment")?.[0];
  const title = (meta && d1(meta, "title")) || label || d1(root, "caption") || report.root;
  const version = (meta && d1(meta, "version")) || (g.versionIri ? localName(g.versionIri) : null);
  const desc = (meta && (d1(meta, "desc") || d1(meta, "description"))) || comment;
  L.push("engine_version :: '1.9' ;", "");
  L.push(`metadata  :: ${atom(report.root)} ;`);
  L.push(`     title :: ${atom(oneLine(title))} ;`);
  if (meta) for (const a of dAll(meta, "author")) L.push(`     author :: ${atom(oneLine(a))} ;`);
  if (version) L.push(`     version :: ${atom(oneLine(version))} ;`);
  if (desc) L.push(`     desc :: ${atom(oneLine(desc))} ;`);
  if (meta && d1(meta, "cdate")) L.push(`     cdate :: ${atom(d1(meta, "cdate"))} ;`);
  if (meta && d1(meta, "mdate")) L.push(`     mdate :: ${atom(d1(meta, "mdate"))} ;`);
  L.push("end metadata.", "");
  // Composer stores the guideline-level metaprops on the root plan, so the
  // ontology IRIs go there too.
  if (ontIri) addExtra(root, "owl.ontology", ontIri);
  if (g.versionIri) addExtra(root, "owl.versionIRI", g.versionIri);
  L.push("metaprops :: '' ;", "");

  // metaprops for an individual: its kit metaprops + its goal + OWL provenance
  function metapropsOf(ind) {
    const pairs = [];
    for (const raw of dAll(ind, "metaprops")) {
      const kit = parseKitMetaprops(raw);
      if (kit) pairs.push(...kit);
      else pairs.push(["owl.metaprops", raw]);
    }
    const goal = o1(ind, "goal");
    if (goal) {
      pairs.push(["goal.iri", goal]);
      for (const p of ["verb", "noun_phrase", "caption", "evidence_grade", "ID", "lifestatus_cycle"]) {
        const v = d1(goal, p);
        if (v !== undefined) pairs.push([`goal.${p}`, v]);
      }
      const parent = o1(goal, "parent");
      if (parent) pairs.push(["goal.parent", parent]);
    }
    for (const p of ["trigger", "cycle", "priority"]) {
      const v = d1(ind, p);
      if (v !== undefined && !(p === "priority" && is(ind, "Candidate"))) pairs.push([`owl.${p}`, v]);
    }
    pairs.push(...(extraProps.get(ind) || []));
    pairs.push(["owl.iri", ind]);
    // repeated keys (e.g. source) become key.1, key.2, ...
    const counts = new Map();
    for (const [k] of pairs) counts.set(k, (counts.get(k) || 0) + 1);
    const idx = new Map();
    return pairs.map(([k, v]) => {
      if (counts.get(k) === 1) return [k, v];
      const n = (idx.get(k) || 0) + 1;
      idx.set(k, n);
      return [`${k}.${n}`, v];
    });
  }
  function propsAtom(pairs) {
    return atom(pairs.map(([k, v]) => `${propKey(k)}=${propValue(v)}`).join("\n"));
  }

  // Build blocks lazily so expression checks can decide what is written.
  const generic = (ind, indent) => {
    const out = [];
    const cap = d1(ind, "caption");
    const des = d1(ind, "description");
    if (cap !== undefined) out.push(`${indent}caption :: ${atom(oneLine(cap))} ;`);
    if (des !== undefined) out.push(`${indent}description :: ${atom(oneLine(des))} ;`);
    out.push(`${indent}metaprops :: ${propsAtom(metapropsOf(ind))} ;`);
    return out;
  };

  // register expressions
  const exprOf = new Map(); // `${owner}|${slot}` -> expr record
  const reg = (owner, slot, cond, assertion) => {
    const e = addExpr(owner, slot, cond, assertion);
    if (e) exprOf.set(`${owner}|${slot}`, e);
  };
  for (const t of reach) {
    reg(t, "precondition", o1(t, "precondition"));
    reg(t, "postcondition", o1(t, "postcondition"), true);
    if (kindOf(t) === "Plan") {
      reg(t, "terminate", o1(t, "terminate"));
      reg(t, "abort", o1(t, "ObjectProperty_28"));
    }
    if (kindOf(t) === "Decision") {
      for (const c of oAll(t, "candidates")) {
        reg(c, "recommendation", o1(c, "recommendation"));
        for (const a of oAll(c, "arguments")) reg(a, "argument", o1(a, "proforma_condition"));
      }
    }
  }
  for (const d of dataItems) reg(d, "derivation", o1(d, "derivation"));

  // infer data types from how the expressions use them
  for (const [nm, d] of dataByName) {
    const uses = exprs.map((e) => e.expr);
    const def = d1(d, "defaulty_value");
    if (uses.some((x) => numericRe(nm).test(x)) || (def !== undefined && /^-?\d+(\.\d+)?$/.test(def))) {
      typeOf.set(nm, "real");
    } else if (uses.some((x) => boolRe(nm).test(x))) typeOf.set(nm, "boolean");
    else typeOf.set(nm, "text");
  }

  function emitAll(includeExpr) {
    const out = [...L];
    const exprLine = (owner, slot, indent, kw = slot) => {
      const e = exprOf.get(`${owner}|${slot}`);
      if (!e || !includeExpr(e)) return [];
      return [`${indent}${kw} ::${e.expr};`];
    };
    for (const t of reach) {
      const kind = kindOf(t).toLowerCase();
      const nm = assignName(t);
      out.push(`${kind}  :: ${atom(nm)} ;`);
      out.push(...generic(t, "     "));
      out.push(...exprLine(t, "precondition", "     "));
      out.push(...exprLine(t, "postcondition", "     "));
      if (kind === "plan") {
        out.push(...exprLine(t, "terminate", "     "));
        out.push(...exprLine(t, "abort", "     "));
        out.push(...componentLines(t));
      } else if (kind === "enquiry") {
        for (const s of oAll(t, "sources")) {
          const d = o1(s, "sref");
          if (!d) {
            warn(`source ${localName(s)} of ${nm} has no pf:sref; skipped`);
            continue;
          }
          out.push(`     source :: ${atom(assignName(d))} ;`);
          out.push(`          data_definition :: ${atom(assignName(d))} ;`);
        }
      } else if (kind === "decision") {
        const cm = d1(t, "choice_mode");
        const sm = d1(t, "support_mode");
        if (cm) out.push(`     choice_mode :: ${/multi/i.test(cm) ? "multiple" : "single"} ;`);
        if (sm) out.push(`     support_mode :: ${/num/i.test(sm) ? "numeric" : "symbolic"} ;`);
        for (const s of oAll(t, "sources")) {
          const d = o1(s, "sref");
          if (d) {
            out.push(`     source :: ${atom(assignName(d))} ;`);
            out.push(`          data_definition :: ${atom(assignName(d))} ;`);
          }
        }
        for (const c of oAll(t, "candidates")) {
          out.push(`     candidate :: ${atom(assignName(c))} ;`);
          out.push(...generic(c, "          "));
          for (const a of oAll(c, "arguments")) {
            const e = exprOf.get(`${a}|argument`);
            if (!e || !includeExpr(e)) continue;
            const sup = oneLine(d1(a, "support") || "for");
            const support = /^-?\d+(\.\d+)?$/.test(sup) ? sup : sup.toLowerCase();
            out.push(`          argument :: ${support},${e.expr} attributes`);
            out.push(`               argument_name :: ${atom(assignName(a))} ;`);
            out.push(...generic(a, "               "));
            out.push("          end attributes", "          ;");
          }
          const rec = exprOf.get(`${c}|recommendation`);
          out.push(`          recommendation ::${rec && includeExpr(rec) ? rec.expr : "netsupport() > 0"};`);
          const pr = d1(c, "priority");
          if (pr !== undefined && /^\d+$/.test(pr)) out.push(`          priority :: ${pr} ;`);
        }
      }
      out.push(`end ${kind}.`, "");
    }
    for (const d of dataItems) {
      const nm = assignName(d);
      out.push(`data  :: ${atom(nm)} ;`);
      out.push(`     type :: ${typeOf.get(nm)} ;`);
      out.push(...generic(d, "     "));
      const unit = d1(d, "unit");
      if (unit !== undefined) out.push(`     unit :: ${atom(oneLine(unit))} ;`);
      const def = d1(d, "defaulty_value");
      if (def !== undefined) {
        out.push(`     default_value :: ${typeOf.get(nm) === "real" ? def : JSON.stringify(oneLine(def))} ;`);
      }
      out.push(...exprLine(d, "derivation", "     "));
      out.push("end data.", "");
    }
    return out.join("\n");
  }

  function componentLines(plan) {
    const comps = oAll(plan, "components").filter((c) => {
      const t = o1(c, "taskref");
      return t && kindOf(t);
    });
    const compName = new Map();
    const taken = new Set();
    for (const c of comps) {
      let nm = assignName(o1(c, "taskref"));
      const base = nm;
      for (let k = 2; taken.has(nm.toLowerCase()); k++) nm = `${base}_${k}`;
      taken.add(nm.toLowerCase());
      compName.set(c, nm);
    }
    // sibling scheduling: conref names a Task; find the sibling component running it
    const deps = new Map();
    for (const c of comps) {
      const list = [];
      for (const sc of oAll(c, "scheduled_constraints")) {
        const target = o1(sc, "conref");
        const sib = comps.find((x) => o1(x, "taskref") === target && x !== c);
        if (sib) list.push(sib);
        else warn(`schedule constraint ${localName(sc)} in ${assignName(plan)}: ${target ? localName(target) : "?"} is not a sibling component; skipped`);
      }
      deps.set(c, list);
    }
    // layout: level = longest path from a component with no predecessors
    const level = new Map();
    const lv = (c, stack = []) => {
      if (level.has(c)) return level.get(c);
      if (stack.includes(c)) die(`scheduling cycle in plan ${assignName(plan)}`);
      const v = Math.max(-1, ...deps.get(c).map((d) => lv(d, [...stack, c]))) + 1;
      level.set(c, v);
      return v;
    };
    comps.forEach((c) => lv(c));
    const col = new Map();
    const perLevel = new Map();
    for (const c of comps) {
      const l = level.get(c);
      col.set(c, perLevel.get(l) || 0);
      perLevel.set(l, (perLevel.get(l) || 0) + 1);
    }
    const out = [];
    for (const c of comps) {
      out.push(`     component :: ${atom(compName.get(c))} ;`);
      out.push(`          task_definition :: ${atom(assignName(o1(c, "taskref")))} ;`);
      for (const d of deps.get(c)) out.push(`          schedule_constraint :: completed(${atom(compName.get(d))}) ;`);
      const cyc = d1(c, "number_of_cycles");
      if (cyc !== undefined && /^\d+$/.test(cyc)) out.push(`          number_of_cycles :: ${cyc} ;`);
      out.push(`          ltwh :: ${40 + col.get(c) * 200},${40 + level.get(c) * 100},0,0;`);
      const cap = d1(c, "caption");
      if (cap !== undefined) out.push(`          caption :: ${atom(oneLine(cap))} ;`);
    }
    return out;
  }

  // ---- check expressions against a skeleton without expressions
  const skeleton = emitAll(() => false);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "owl2pf-"));
  const skelFile = path.join(tmp, "skeleton.pf");
  fs.writeFileSync(skelFile, skeleton);
  for (const e of exprs) {
    const args = ["check-expression", "--file", skelFile, "--expression", e.expr];
    if (e.assertion) args.push("--assertion");
    const r = proforma(args);
    let reason = null;
    if (r.status !== 0) reason = (r.stderr || r.stdout).trim().replace(/^error:\s*/, "");
    else {
      let res;
      try {
        res = JSON.parse(r.stdout);
      } catch {
        reason = "unreadable check-expression output";
      }
      if (res) {
        const bad = (res.diagnostics || []).filter((d) => d.severity === "error" || d.severity === "warning");
        if (bad.length) reason = bad.map((d) => `${d.code}: ${d.message}`).join("; ");
        else if (!e.assertion && e.slot !== "derivation" && res.type !== "truth_value") {
          reason = `not a condition (type ${res.type})`;
        } else {
          // a bare word is a text literal; accept it only where it is compared against
          for (const ref of res.references || []) {
            if (!/text literal/.test(ref.resolves_to) || candidates.has(ref.name)) continue;
            const nm = ref.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const all = (e.expr.match(new RegExp(`(?<![\\w'])'?${nm}'?(?![\\w'])`, "g")) || []).length;
            const cmp = (e.expr.match(new RegExp(`(?:<>|<=|>=|=|<|>)\\s*'?${nm}'?(?![\\w'])`, "g")) || []).length;
            if (all !== cmp) {
              reason = `'${ref.name}' is not a data item, task or candidate`;
              break;
            }
            const boolAtom = /^(true|false)$/.test(ref.name);
            if (!boolAtom) report.atoms_compared.push({ where: `${localName(e.owner)}.${e.slot}`, atom: ref.name });
          }
        }
      }
    }
    if (reason) {
      e.ok = false;
      // A free-text recommendation describes the candidate; PROforma's default
      // recommendation (netsupport() > 0) already applies, so it is only noted.
      (e.slot === "recommendation" ? report.kept_as_text : report.needs_formalization).push({
        owner: localName(e.owner),
        slot: e.slot,
        condition: localName(e.cond),
        text: e.text,
        tried: e.expr,
        reason,
      });
      addExtra(e.owner, `owl.${e.slot}`, e.text);
      if (e.slot === "argument") addExtra(e.owner, "owl.argument.support", d1(e.owner, "support") || "for");
    } else e.ok = true;
  }
  fs.rmSync(tmp, { recursive: true, force: true });

  // failed arguments are kept on the candidate so the decision still documents them
  for (const e of exprs.filter((x) => x.slot === "argument" && !x.ok)) {
    const cand = g.order.find((c) => oAll(c, "arguments").includes(e.owner));
    if (cand) addExtra(cand, `owl.argument.${assignName(e.owner)}`, `${d1(e.owner, "support") || "for"}: ${e.text}`);
  }

  const text = emitAll((e) => e.ok);
  report.counts = {
    plans: reach.filter((t) => kindOf(t) === "Plan").length,
    actions: reach.filter((t) => kindOf(t) === "Action").length,
    enquiries: reach.filter((t) => kindOf(t) === "Enquiry").length,
    decisions: reach.filter((t) => kindOf(t) === "Decision").length,
    data_items: dataItems.length,
    expressions: exprs.length,
    expressions_exported: exprs.filter((e) => e.ok).length,
  };
  return { text, report };
}

// -------------------------------------------------------------------- main

const opts = parseArgs(process.argv.slice(2));
const g = loadOwl(opts.input);
const { text, report } = convert(g, opts);
fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
fs.writeFileSync(opts.out, text);

// Canonical Composer layout, then lint.
const fmt = proforma(["format", "--file", opts.out]);
if (fmt.status !== 0) {
  console.error(fmt.stdout + fmt.stderr);
  die(`proforma format failed on ${opts.out}`);
}
const lint = proforma(["lint", "--file", opts.out, "--format", "json"]);
try {
  report.lint = JSON.parse(lint.stdout);
} catch {
  report.lint = { raw: (lint.stdout + lint.stderr).trim() };
}
if (opts.mermaid) {
  const m = proforma(["mermaid", "--file", opts.out, "--output", opts.mermaid]);
  if (m.status !== 0) report.warnings.push(`mermaid export failed: ${(m.stderr || m.stdout).trim()}`);
}
if (opts.report) fs.writeFileSync(opts.report, JSON.stringify(report, null, 2) + "\n");

// Human-readable summary.
const c = report.counts;
const diags = Array.isArray(report.lint) ? report.lint : Array.isArray(report.lint?.diagnostics) ? report.lint.diagnostics : [];
const errors = diags.filter((d) => d.severity === "error");
const warnings = diags.filter((d) => d.severity === "warning");
console.log(`wrote ${opts.out} (root plan ${report.root})`);
console.log(
  `  ${c.plans} plans, ${c.actions} actions, ${c.enquiries} enquiries, ${c.decisions} decisions, ${c.data_items} data items`
);
console.log(`  expressions: ${c.expressions_exported}/${c.expressions} exported as PROforma`);
if (report.needs_formalization.length) {
  console.log(`\nneeds formalization (${report.needs_formalization.length}); kept in metaprops as owl.<slot>:`);
  for (const n of report.needs_formalization) {
    console.log(`  - ${n.owner}.${n.slot}: "${n.text}"\n      ${n.reason}`);
  }
}
if (report.kept_as_text.length) {
  console.log("\nkept as text (PROforma default recommendation netsupport() > 0 applies):");
  for (const n of report.kept_as_text) console.log(`  - ${n.owner}.${n.slot}: "${n.text}"`);
}
if (report.atoms_compared.length) {
  console.log("\ncompared against bare words (text atoms); check that these values are intended:");
  for (const a of report.atoms_compared) console.log(`  - ${a.where}: ${a.atom}`);
}
if (report.warnings.length) {
  console.log("\nwarnings:");
  for (const w of report.warnings) console.log(`  - ${w}`);
}
console.log(`\nlint: ${errors.length} error(s), ${warnings.length} warning(s)`);
for (const d of [...errors, ...warnings]) console.log(`  ${d.severity} ${d.code}: ${d.message}${d.component ? ` [${d.component}]` : ""}${d.line ? ` line ${d.line}` : ""}`);
process.exit(errors.length ? 1 : 0);

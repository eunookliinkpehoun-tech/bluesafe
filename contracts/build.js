// Compile Tirelire contracts with solc-js and write ABI/bytecode artifacts to ./out
// Usage: node build.js
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const ROOT = __dirname;
const sources = {};
for (const f of fs.readdirSync(path.join(ROOT, "src"))) {
  if (f.endsWith(".sol")) sources[`src/${f}`] = { content: fs.readFileSync(path.join(ROOT, "src", f), "utf8") };
}

function findImports(p) {
  const candidates = [path.join(ROOT, "node_modules", p), path.join(ROOT, p)];
  for (const c of candidates) if (fs.existsSync(c)) return { contents: fs.readFileSync(c, "utf8") };
  return { error: "not found " + p };
}

const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 200 },
    evmVersion: "cancun",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
  },
};

const out = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
let failed = false;
for (const e of out.errors || []) {
  console.log(e.severity, e.formattedMessage);
  if (e.severity === "error") failed = true;
}
if (failed) process.exit(1);
fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
for (const [file, contracts] of Object.entries(out.contracts)) {
  if (!file.startsWith("src/")) continue;
  for (const [name, data] of Object.entries(contracts)) {
    const art = { abi: data.abi, bytecode: "0x" + data.evm.bytecode.object };
    fs.writeFileSync(path.join(ROOT, "out", `${name}.json`), JSON.stringify(art));
    console.log(name, "runtime bytes:", data.evm.deployedBytecode.object.length / 2);
  }
}

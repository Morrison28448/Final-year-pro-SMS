const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
function walk(d) {
  let r = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) r = r.concat(walk(p));
    else if (e.name.endsWith(".js")) r.push(p);
  }
  return r;
}
const root = path.join(__dirname, "src");
const files = walk(root);
const failed = [];
for (const f of files) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) failed.push({ file: f, err: (r.stderr || r.stdout || "").trim() });
}
if (!failed.length) console.log("SYNTAX_OK " + files.length);
else {
  console.log("FAILED " + failed.length);
  for (const x of failed) console.log("---\n" + x.file + "\n" + x.err);
}

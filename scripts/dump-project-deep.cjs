const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.cwd();
const EXCLUDE_DIR = new Set(["node_modules",".git","dist","build",".next",".vercel","out",".cache",".expo",".turbo"]);

function sha1(buf){return crypto.createHash("sha1").update(buf).digest("hex");}

function walk(dir, treeLines=[], files=[], prefix=""){
  let entries;
  try{ entries = fs.readdirSync(dir,{withFileTypes:true}); } catch{ return {treeLines,files}; }
  entries = entries.filter(e => e.name !== ".DS_Store");
  entries.sort((a,b)=> (a.isDirectory()&&!b.isDirectory())?-1:(!a.isDirectory()&&b.isDirectory())?1:a.name.localeCompare(b.name));
  const last = entries.length - 1;
  entries.forEach((e,i)=>{
    if (EXCLUDE_DIR.has(e.name)) return;
    const full = path.join(dir, e.name);
    const rel  = path.relative(ROOT, full);
    const branch = prefix + (i===last ? " " : " ");
    if (e.isDirectory()){
      treeLines.push(branch + e.name + "/");
      walk(full, treeLines, files, prefix + (i===last ? "    " : "│   "));
    } else {
      treeLines.push(branch + e.name);
      files.push(rel.replace(/\\/g,"/"));
    }
  });
  return {treeLines, files};
}

function fileInfo(absPath){
  let stat;
  try{ stat = fs.statSync(absPath); } catch{ return null; }
  if (!stat.isFile()) return null;
  const MAX_HASH_BYTES = 1_000_000;
  let buf = Buffer.alloc(0);
  try{
    const fd = fs.openSync(absPath, "r");
    const size = Math.min(MAX_HASH_BYTES, stat.size);
    if (size>0){ buf = Buffer.alloc(size); fs.readSync(fd, buf, 0, size, 0); }
    fs.closeSync(fd);
  } catch {}
  const ext = path.extname(absPath).toLowerCase();
  return {
    path: path.relative(ROOT, absPath).replace(/\\/g,"/"),
    size: stat.size,
    mtime: stat.mtime.toISOString(),
    ext,
    sha1_preview: sha1(buf)
  };
}

(function main(){
  console.log(" Scanning project");
  const { treeLines, files } = walk(ROOT, [], []);
  const treeHeader = (path.basename(ROOT) || ".") + "/\n";
  fs.writeFileSync(path.join(ROOT,"tree.txt"), treeHeader + treeLines.join("\n"), "utf8");
  console.log(" tree.txt");

  const sortedFiles = files.slice().sort((a,b)=> a.localeCompare(b,"en"));
  fs.writeFileSync(path.join(ROOT,"files.txt"), sortedFiles.join("\n"), "utf8");
  console.log(` files.txt (${sortedFiles.length} files)`);

  const details = [];
  for (const rel of sortedFiles){
    const abs = path.join(ROOT, rel);
    const info = fileInfo(abs);
    if (info) details.push(info);
  }

  const manifest = {
    root: path.basename(ROOT) || ".",
    generated_at: new Date().toISOString(),
    totals: { files: details.length, bytes: details.reduce((s,f)=>s+f.size,0) },
    by_extension: (()=>{ const map={}; for(const f of details) map[f.ext]=(map[f.ext]||0)+1; return Object.fromEntries(Object.entries(map).sort((a,b)=>b[1]-a[1])); })(),
    files: details
  };

  fs.writeFileSync(path.join(ROOT,"project-manifest.json"), JSON.stringify(manifest,null,2), "utf8");
  console.log(" project-manifest.json");
  console.log("\nDone. Send me tree.txt + files.txt + project-manifest.json ");
})();

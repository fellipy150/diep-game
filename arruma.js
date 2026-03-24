const id="git-forense-mathutils"
const { execSync } = require("child_process");

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

// pega TODOS os commits (mais recentes primeiro)
const commits = run("git rev-list --all").split("\n");

let found = null;

for (const commit of commits) {
  try {
    // lista todos os arquivos daquele commit
    const files = run(`git ls-tree -r --name-only ${commit}`).split("\n");

    const match = files.find(f =>
      f.toLowerCase().includes("mathutils.js")
    );

    if (match) {
      found = { commit, path: match };
      break;
    }
  } catch (e) {
    // ignora commits problemáticos
  }
}

if (!found) {
  console.log("Arquivo não encontrado no histórico 😢");
  process.exit(1);
}

console.log("Encontrado:", found);

// pega conteúdo do arquivo
const content = run(`git show ${found.commit}:${found.path}`);

// copia pro clipboard (Termux)
execSync("termux-clipboard-set", { input: content });

console.log("Conteúdo copiado pro clipboard 📋");

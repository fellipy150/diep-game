import fs from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url"; // Necessário para descobrir o caminho deste script

// ================= CONFIGURAÇÃO =================
// Captura o caminho absoluto deste próprio script para que ele não modifique a si mesmo
const THIS_SCRIPT = fileURLToPath(import.meta.url);

const args = process.argv.slice(2);
const CURRENT_DIR = process.cwd();
const PROJECT_ROOT = args[0] ? path.resolve(args[0]) : CURRENT_DIR;

const IGNORE_DIRS = new Set(["node_modules", ".git", ".vscode", "dist", "build", "coverage"]);

// Regex para capturar Exports (ESM e CommonJS simples)
const REGEX_EXPORT_CONST = /export\s+(?:const|var|let|function|class)\s+([a-zA-Z0-9_$]+)/g;
const REGEX_EXPORT_DEFAULT = /export\s+default\s+(?:class|function)?\s*([a-zA-Z0-9_$]+)/g;
const REGEX_EXPORT_NAMED = /export\s*\{([^}]+)\}/g;
const REGEX_MODULE_EXPORTS = /module\.exports\s*=\s*\{?([^}]+)\}?/g;

// Regex para capturar Imports
const REGEX_IMPORT_FULL = /(?:import\s+([\s\S]*?)\s+from\s+|require\(\s*)["']([^"']+)["']/g;

const GLOBAL_EXPORTS = new Map();

const stats = {
  fixed: 0,
  conflicts: [],
  notFound: [],
  scanned: 0,
  skippedSelf: false
};

function isIgnored(fullPath) {
  const parts = fullPath.split(path.sep);
  return parts.some(p => IGNORE_DIRS.has(p));
}

async function walk(dir) {
  let files = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isSymbolicLink() || isIgnored(fullPath)) continue;

      if (entry.isDirectory()) {
        files = files.concat(await walk(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        // Já filtramos o próprio script aqui também, por segurança
        if (fullPath === THIS_SCRIPT) {
          stats.skippedSelf = true;
          continue;
        }
        files.push(fullPath);
      }
    }
  } catch (err) {
    // Ignora erros de permissão
  }
  return files;
}

async function indexFileExports(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    
    let match;
    while ((match = REGEX_EXPORT_CONST.exec(content)) !== null) {
      addToIndex(match[1], filePath);
    }

    while ((match = REGEX_EXPORT_DEFAULT.exec(content)) !== null) {
      addToIndex(match[1], filePath);
    }

    while ((match = REGEX_EXPORT_NAMED.exec(content)) !== null) {
      const inside = match[1];
      const parts = inside.split(",").map(s => s.trim());
      parts.forEach(p => {
        const name = p.split(" as ")[1] || p; 
        addToIndex(name.trim(), filePath);
      });
    }

  } catch (err) {
    console.error(`Erro lendo ${filePath}:`, err.message);
  }
}

function addToIndex(symbolName, filePath) {
  if (!symbolName) return;
  if (!GLOBAL_EXPORTS.has(symbolName)) {
    GLOBAL_EXPORTS.set(symbolName, []);
  }
  const list = GLOBAL_EXPORTS.get(symbolName);
  if (!list.includes(filePath)) {
    list.push(filePath);
  }
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveCurrentImport(fromFile, importPath) {
  if (!importPath.startsWith(".")) return "EXTERNAL"; 
  
  const base = path.dirname(fromFile);
  // Adiciona verificação explícita com e sem .js
  const extensions = ["", ".js", "/index.js"];
  
  for (const ext of extensions) {
    const attempt = path.resolve(base, importPath + ext);
    if (await fileExists(attempt)) return attempt;
  }
  
  return null; 
}

function extractImportedSymbols(importClause) {
  if (!importClause) return []; 
  
  const symbols = [];
  const clean = importClause.replace(/\s+/g, " ");

  const namedMatch = /\{([^}]+)\}/.exec(clean);
  if (namedMatch) {
    const parts = namedMatch[1].split(",");
    parts.forEach(p => {
      const pair = p.trim().split(" as ");
      symbols.push(pair[0].trim());
    });
  }

  const defaultPart = clean.replace(/\{[^}]+\}/, "").replace(/,/g, "").trim();
  if (defaultPart && defaultPart.length > 0) {
    symbols.push(defaultPart);
  }

  return symbols.filter(s => s.length > 0);
}

function getRelativeImport(fromFile, targetFile) {
  let rel = path.relative(path.dirname(fromFile), targetFile);
  if (!rel.startsWith(".")) rel = "./" + rel;
  
  // Converte barras do Windows para barras normais da Web
  rel = rel.split(path.sep).join("/");
  
  // REGRA PARA WEB: Força a inclusão da extensão .js 
  if (!rel.endsWith(".js")) {
    rel += ".js";
  }
  
  return rel;
}

async function fixImports() {
  console.log(`🔍 Escaneando projeto em: ${PROJECT_ROOT}`);
  const allFiles = await walk(PROJECT_ROOT);
  stats.scanned = allFiles.length;
  console.log(`📂 Arquivos encontrados: ${stats.scanned}`);
  if (stats.skippedSelf) {
    console.log(`🛡️ O próprio script (${path.basename(THIS_SCRIPT)}) foi ignorado com sucesso.`);
  }

  console.log("📖 Indexando exportações (criando mapa de símbolos)...");
  for (const file of allFiles) {
    await indexFileExports(file);
  }
  console.log(`🧠 Símbolos conhecidos: ${GLOBAL_EXPORTS.size}`);

  console.log("🛠 Verificando imports quebrados...");
  
  for (const file of allFiles) {
    // Redundância de segurança: garante que não vamos editar o próprio arquivo
    if (file === THIS_SCRIPT) continue;

    let content = await fs.readFile(file, "utf8");
    let fileChanged = false;
    
    REGEX_IMPORT_FULL.lastIndex = 0;
    
    let matches = [];
    let m;
    while ((m = REGEX_IMPORT_FULL.exec(content)) !== null) {
      matches.push({
        fullMatch: m[0],
        importClause: m[1], 
        importPath: m[2],   
        index: m.index
      });
    }

    for (const item of matches) {
      const { fullMatch, importClause, importPath } = item;

      // 1. Verifica se o import funciona (no contexto da web, ele precisa ter a extensão)
      // Se não tem extensão, vamos forçar a reescrita mesmo que o arquivo exista (resolução do Node).
      const needsWebExtensionFix = importPath.startsWith(".") && !importPath.endsWith(".js");
      const status = await resolveCurrentImport(file, importPath);
      
      if (status !== null && !needsWebExtensionFix) continue; 

      // 3. Estratégia A: Buscar pelos símbolos importados
      const symbolsNeeded = extractImportedSymbols(importClause);
      let bestCandidate = null;

      if (symbolsNeeded.length > 0) {
        const symbol = symbolsNeeded[0];
        const candidates = GLOBAL_EXPORTS.get(symbol);

        if (candidates && candidates.length === 1) {
          bestCandidate = candidates[0];
        } else if (candidates && candidates.length > 1) {
          stats.conflicts.push({ file, symbol, candidates });
          continue; 
        }
      }

      // 4. Estratégia B: Se falhar símbolo, tenta buscar pelo nome do arquivo (filename) antigo
      if (!bestCandidate) {
        // Adiciona .js se já não tiver, para buscar o arquivo real
        const cleanName = importPath.replace(/\.js$/, "");
        const oldBasename = path.basename(cleanName) + ".js";
        
        const foundByName = allFiles.filter(f => path.basename(f) === oldBasename);
        
        if (foundByName.length === 1) {
          bestCandidate = foundByName[0];
        } else if (foundByName.length > 1) {
           stats.conflicts.push({ file, symbol: oldBasename, candidates: foundByName });
        }
      }

      // 5. Aplica a correção se tivermos um candidato (ou se já sabemos o caminho correto e só falta o .js)
      if (bestCandidate || (status !== null && needsWebExtensionFix)) {
        
        const targetFile = bestCandidate || status; // Usa o candidato ou o status resolvido
        if (targetFile === file) continue; // Evita importar a si mesmo

        const newPath = getRelativeImport(file, targetFile);
        
        if (content.includes(fullMatch)) {
            const newStatement = fullMatch.replace(importPath, newPath);
            content = content.replace(fullMatch, newStatement);
            fileChanged = true;
            stats.fixed++;
            console.log(`✅ Corrigido: ${path.basename(file)}`);
            console.log(`   🔴 ${importPath}`);
            console.log(`   🟢 ${newPath} ${bestCandidate ? "(via busca)" : "(adicionada extensão Web)"}`);
        }
      } else {
        if (!stats.notFound.find(n => n.path === importPath)) {
            stats.notFound.push({ file, path: importPath });
        }
      }
    }

    if (fileChanged) {
      await fs.writeFile(file, content, "utf8");
    }
  }

  printReport();
}

function printReport() {
  console.log("\n========================================");
  console.log("📊 RELATÓRIO FINAL");
  console.log("========================================");
  console.log(`📂 Arquivos escaneados: ${stats.scanned}`);
  console.log(`✨ Imports corrigidos:  ${stats.fixed}`);
  
  if (stats.conflicts.length > 0) {
    console.log(`\n⚠️  CONFLITOS (Não alterados - ${stats.conflicts.length}):`);
    console.log("O script achou múltiplos arquivos para o mesmo import. Resolva manualmente:");
    stats.conflicts.forEach(c => {
      console.log(`\n📄 No arquivo: ${path.relative(PROJECT_ROOT, c.file)}`);
      console.log(`   Buscando por: "${c.symbol}"`);
      console.log(`   Encontrado em:`);
      c.candidates.forEach(cand => console.log(`     - ${path.relative(PROJECT_ROOT, cand)}`));
    });
  }

  if (stats.notFound.length > 0) {
    console.log(`\n❌ NÃO ENCONTRADO (${stats.notFound.length}):`);
    console.log("O script não achou nenhum arquivo exportando este nome nem com este nome de arquivo.");
    stats.notFound.forEach(nf => {
      console.log(`   Em ${path.basename(nf.file)}: Import "${nf.path}"`);
    });
  }
  
  console.log("\n========================================");
}

fixImports().catch(console.error);

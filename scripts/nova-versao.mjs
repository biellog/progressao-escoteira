#!/usr/bin/env node
/*
  Publica uma nova versão do aplicativo.
  Uso:  node scripts/nova-versao.mjs 1.1.0 "Novidade 1" "Novidade 2"
  Depois: git add -A && git commit -m "v1.1.0" && git push
  Quem estiver com o app aberto/instalado recebe o aviso "Nova versão disponível".
*/
import { readFileSync, writeFileSync } from 'node:fs';

const [versao, ...novidades] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(versao || '') || !novidades.length) {
  console.error('Uso: node scripts/nova-versao.mjs 1.1.0 "Novidade 1" "Novidade 2"');
  process.exit(1);
}
const data = new Date().toISOString().slice(0, 10);
const info = { versao, data, novidades };

writeFileSync('app/version.json', JSON.stringify(info, null, 2) + '\n');

const sw = readFileSync('app/sw.js', 'utf8').replace(/const VERSAO = '[^']*';/, `const VERSAO = '${versao}';`);
writeFileSync('app/sw.js', sw);

let hist = [];
try { hist = JSON.parse(readFileSync('changelog.json', 'utf8')); } catch {}
hist = [info, ...hist.filter((v) => v.versao !== versao)];
writeFileSync('changelog.json', JSON.stringify(hist, null, 2) + '\n');

console.log(`✔ Versão ${versao} preparada. Agora faça commit e push para publicar.`);

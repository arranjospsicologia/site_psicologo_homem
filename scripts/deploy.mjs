// Publica o site: confere e gera localmente, registra as mudanças no git e
// envia para a branch main. O GitHub Actions (.github/workflows/publicar.yml)
// faz a publicação no GitHub Pages a partir do push.
//
// Uso:
//   npm run deploy                         mensagem automática com data e hora
//   npm run deploy -- "Corrige o rodapé"   mensagem própria
//   npm run deploy -- --rapido             pula a verificação local (check + build)
import { execSync, spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const rapido = args.includes('--rapido');
const mensagemPropria = args.filter((a) => a !== '--rapido').join(' ').trim();

function git(comando) {
  return execSync(`git ${comando}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function rodar(comando) {
  const r = spawnSync(comando, { stdio: 'inherit', shell: true });
  return r.status === 0;
}

function parar(mensagem) {
  console.error(`\n✗ ${mensagem}\n`);
  process.exit(1);
}

// 1. Repositório e branch
try {
  git('rev-parse --is-inside-work-tree');
} catch {
  parar('Esta pasta ainda não é um repositório git. Veja a seção "Publicação" em .github/README.md.');
}

let remoto;
try {
  remoto = git('remote get-url origin');
} catch {
  parar('O repositório não tem o remoto "origin". Rode: git remote add origin https://github.com/USUARIO/psicologo-homem.git');
}

const branch = git('rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  parar(`Você está na branch "${branch}". O site só é publicado a partir da "main" (git switch main).`);
}

// 2. Há algo para publicar?
const pendentesLocais = git('status --porcelain');
let commitsNaoEnviados = 0;
try {
  commitsNaoEnviados = Number(git('rev-list --count origin/main..HEAD'));
} catch {
  // origin/main ainda não existe (primeiro envio): tudo é novo.
  try {
    commitsNaoEnviados = Number(git('rev-list --count HEAD'));
  } catch {
    commitsNaoEnviados = 0; // repositório sem nenhum commit
  }
}

if (!pendentesLocais && commitsNaoEnviados === 0) {
  console.log('\n✓ Nada para publicar: o site no GitHub já está igual a esta pasta.\n');
  process.exit(0);
}

// 3. Verificação local, para não enviar algo quebrado
if (rapido) {
  console.log('\n→ Verificação local pulada (--rapido).');
} else {
  console.log('\n→ Conferindo e gerando o site localmente…\n');
  if (!rodar('npm run check')) parar('A verificação (npm run check) falhou. Nada foi enviado.');
  if (!rodar('npm run build')) parar('O build (npm run build) falhou. Nada foi enviado.');
}

// 4. Commit
if (pendentesLocais) {
  const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const mensagem = mensagemPropria || `Atualiza o site (${agora})`;
  console.log('\n→ Arquivos alterados:\n');
  console.log(git('status --short'));
  git('add -A');
  const r = spawnSync('git', ['commit', '-m', mensagem], { stdio: 'inherit' });
  if (r.status !== 0) parar('Não foi possível registrar o commit.');
}

// 5. Traz mudanças feitas direto no GitHub (se houver) e envia
const temRemotoMain = spawnSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', 'main'], {
  stdio: 'ignore',
}).status === 0;

if (temRemotoMain) {
  console.log('\n→ Sincronizando com o GitHub…');
  if (!rodar('git pull --rebase origin main')) {
    parar('Conflito ao sincronizar com o GitHub. Resolva os conflitos, rode "git rebase --continue" e depois npm run deploy de novo.');
  }
}

console.log('\n→ Enviando para o GitHub…\n');
if (!rodar('git push -u origin main')) parar('O envio (git push) falhou. Nada foi publicado.');

// 6. Links úteis
const m = remoto.match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/);
console.log('\n✓ Enviado. O GitHub Actions vai publicar em 1–2 minutos.');
if (m) {
  const [, dono, repo] = m;
  console.log(`  Acompanhar: https://github.com/${dono}/${repo}/actions`);
  console.log(`  Site:       https://${dono.toLowerCase()}.github.io/${repo}/ (ou o domínio próprio, se configurado)`);
}
console.log('');

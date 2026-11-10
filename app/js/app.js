import { CONFIG } from './config.js';
import { db, ErroApp, LIMITE_ARQUIVO_MB, MAX_ARQUIVOS } from './db.js';
import { EIXOS, ACOLHIDA, ACOLHIDA_ITENS, NUM_EXTENSO, itemVisivel, statusBloco, resumoGeral,
  tipoEnvio, itemPorId, ITENS_COM_ENVIO, ESPECIALIDADES, INSIGNIAS } from './data.js';
import { iniciarAtualizacoes, aplicarAtualizacao, verificarAgora, infoVersao, pedirPermissaoNotificacao } from './update.js';

/* ------------------------------------------------------------ utilidades */
const $ = (s, el = document) => el.querySelector(s);
const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hoje = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso local
const iniciais = (n) => (n || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
const fmtData = (d) => (d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '');

function toast(msg, tipo = '') {
  const t = document.createElement('div');
  t.className = `toast ${tipo}`; t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3800);
}
function erro(e) { console.error(e); toast(e instanceof ErroApp ? e.message : (e?.message || 'Algo deu errado.'), 'erro'); }

function modal(html, aoAbrir) {
  const d = $('#modal');
  d.innerHTML = html;
  d.showModal();
  d.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => d.close()));
  aoAbrir?.(d);
  return d;
}
function confirmar(titulo, texto, rotulo = 'Confirmar', perigo = false) {
  return new Promise((ok) => {
    const d = modal(`<h3>${h(titulo)}</h3><p class="muted">${h(texto)}</p>
      <div class="acoes"><button class="btn" data-fechar>Cancelar</button><button class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" id="m-ok">${h(rotulo)}</button></div>`);
    let r = false;
    $('#m-ok', d).onclick = () => { r = true; d.close(); };
    d.addEventListener('close', () => ok(r), { once: true });
  });
}
async function copiar(txt) {
  try { await navigator.clipboard.writeText(txt); toast('Copiado!', 'ok'); } catch { toast(txt); }
}

/* --------------------------------------------------------- preferências */
const prefs = (() => { try { return JSON.parse(localStorage.getItem('pe_prefs')) || {}; } catch { return {}; } })();
function salvarPrefs() { localStorage.setItem('pe_prefs', JSON.stringify(prefs)); }
function aplicarPrefs() {
  document.documentElement.dataset.theme = prefs.tema || 'dark';
  if (prefs.fonte) document.documentElement.dataset.fonte = prefs.fonte; else delete document.documentElement.dataset.fonte;
  $('meta[name="theme-color"]').content = prefs.tema === 'light' ? '#f3f5f8' : '#0d1117';
}

/* ---------------------------------------------------------------- estado */
const S = {
  eu: null,
  view: 'progresso',
  filtro: 'todos',
  abertos: new Set(),
  meuProgresso: {},
  monitor: { patrulhaId: null, alvo: null, progresso: {} },
  envios: {},            // item_id → envio mais recente (da pessoa cuja progressão está na tela)
  proprio: true,         // a progressão na tela é a do usuário logado?
  pendentes: 0,          // envios aguardando minha avaliação
  filtroAval: 'pendente',
};
const ehAvaliador = () => S.eu?.ehMonitor || S.eu?.papel === 'chefe';

const VIEWS = {
  progresso: { titulo: 'Minha Progressão', ico: '📘', render: viewProgresso },
  monitor:   { titulo: 'Painel do Monitor', ico: '🧑‍🤝‍🧑', render: viewMonitor, se: () => S.eu.ehMonitor || S.eu.papel === 'chefe' },
  especialidades: { titulo: 'Especialidades', ico: '🎖️', render: (el) => viewEnvios(el, 'especialidade') },
  insignias: { titulo: 'Insígnias', ico: '🏅', render: (el) => viewEnvios(el, 'insignia') },
  avaliacoes: { titulo: 'Avaliações', ico: '✅', render: viewAvaliacoes, se: ehAvaliador },
  patrulhas: { titulo: 'Patrulhas', ico: '🏕️', render: viewPatrulhas, se: () => S.eu.papel === 'chefe' },
  conta:     { titulo: 'Minha Conta', ico: '👤', render: viewConta },
  config:    { titulo: 'Configurações', ico: '⚙️', render: viewConfig },
};

function mostrar(id) {
  ['tela-carregando', 'tela-auth', 'tela-pin', 'shell'].forEach((t) => { $('#' + t).hidden = t !== id; });
}

/* =================================================================== AUTH */
function iniciarAuth() {
  const abas = { entrar: $('#aba-entrar'), cadastrar: $('#aba-cadastrar') };
  const trocar = (qual) => {
    Object.entries(abas).forEach(([k, b]) => b.setAttribute('aria-selected', String(k === qual)));
    $('#form-entrar').hidden = qual !== 'entrar';
    $('#form-cadastrar').hidden = qual !== 'cadastrar';
    msgAuth('');
  };
  abas.entrar.onclick = () => trocar('entrar');
  abas.cadastrar.onclick = () => trocar('cadastrar');

  $('#form-entrar').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), b = e.submitter; b.disabled = true;
    try { S.eu = await db.entrar(f.get('email'), f.get('senha')); e.target.reset(); await entrarNoApp(); }
    catch (err) { msgAuth(err.message, 'erro'); }
    finally { b.disabled = false; }
  };
  $('#form-cadastrar').onsubmit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), b = e.submitter; b.disabled = true;
    try {
      const r = await db.cadastrar(f);
      if (r?.confirmarEmail) { trocar('entrar'); msgAuth('Conta criada! Confirme o e-mail que enviamos e depois entre.', 'ok'); return; }
      S.eu = r; e.target.reset(); await entrarNoApp();
      toast(`Bem-vindo(a), ${S.eu.nome.split(' ')[0]}!`, 'ok');
    } catch (err) { msgAuth(err.message, 'erro'); }
    finally { b.disabled = false; }
  };
  const selo = db.modo === 'nuvem' ? '☁️ Sincronizado na nuvem' : '📱 Modo local (dados neste aparelho)';
  $('#selo-modo').textContent = selo;
  $('#selo-modo-topo').textContent = db.modo === 'nuvem' ? '☁️ Nuvem' : '📱 Local';
}
function msgAuth(t, tipo = '') { const m = $('#auth-msg'); m.hidden = !t; m.className = `aviso ${tipo}`; m.textContent = t; }

/* ==================================================================== PIN */
const PIN_CHAVE = 'pe_pin';
async function hashPin(pin) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pin:' + pin));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
}
function temPin() { return !!localStorage.getItem(PIN_CHAVE); }
function pedirPin() {
  return new Promise((resolver) => {
    mostrar('tela-pin');
    let digitado = '', tentativas = 0;
    const desenhar = () => { $('#pin-pontos').innerHTML = Array.from({ length: 4 }, (_, i) => `<i class="${i < digitado.length ? 'on' : ''}"></i>`).join(''); };
    $('#teclado').innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
      .map((k) => (k ? `<button type="button" data-k="${k}" aria-label="${k === '⌫' ? 'Apagar' : k}">${k}</button>` : '<span></span>')).join('');
    desenhar();
    const tecla = async (k) => {
      if (k === '⌫') digitado = digitado.slice(0, -1);
      else if (digitado.length < 4) digitado += k;
      desenhar();
      if (digitado.length === 4) {
        if ((await hashPin(digitado)) === localStorage.getItem(PIN_CHAVE)) { document.removeEventListener('keydown', teclado); resolver(true); }
        else { tentativas++; digitado = ''; desenhar(); $('#pin-msg').textContent = `PIN incorreto (${tentativas}). Tente de novo.`; }
      }
    };
    const teclado = (e) => { if (/^\d$/.test(e.key)) tecla(e.key); if (e.key === 'Backspace') tecla('⌫'); };
    document.addEventListener('keydown', teclado);
    $('#teclado').onclick = (e) => { const k = e.target.closest('button')?.dataset.k; if (k) tecla(k); };
    $('#pin-esqueci').onclick = async () => {
      document.removeEventListener('keydown', teclado);
      localStorage.removeItem(PIN_CHAVE); pararNotificacoes(); await db.sair(); S.eu = null; mostrar('tela-auth'); resolver(false);
    };
  });
}
let escondidoEm = 0;
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden') escondidoEm = Date.now();
  else if (S.eu && temPin() && escondidoEm && Date.now() - escondidoEm > 5 * 60 * 1000) {
    if (await pedirPin()) mostrar('shell');
  }
});

/* ================================================================= SHELL */
async function entrarNoApp() {
  if (temPin() && !(await pedirPin())) return;
  mostrar('shell');
  desenharSidebar();
  if (S.eu.papel === 'chefe' && S.view === 'progresso') S.view = 'patrulhas';
  const v = VIEWS[S.view]; if (v.se && !v.se()) S.view = 'progresso';
  await irPara(S.view);
  iniciarNotificacoes();
}

function papelTexto(p) {
  if (p.papel === 'chefe') return '<span class="badge chefe">Chefe</span>';
  if (p.ehMonitor) return '<span class="badge monitor">Monitor</span>';
  return '<span class="badge">Escoteiro</span>';
}

function desenharSidebar() {
  $('#cartao-usuario').innerHTML = `<div class="avatar">${h(iniciais(S.eu.nome))}</div>
    <div><b>${h(S.eu.nome)}</b><small>${papelTexto(S.eu)}</small></div>`;
  const item = (id, badge = 0) => `<button data-view="${id}" ${S.view === id ? 'aria-current="page"' : ''}><span class="ico">${VIEWS[id].ico}</span>${VIEWS[id].titulo}${badge ? `<span class="nav-badge" aria-label="${badge} pendentes">${badge}</span>` : ''}</button>`;
  const pode = (id) => !VIEWS[id].se || VIEWS[id].se();
  $('#nav').innerHTML = `
    <div class="nav-titulo">Progressão</div>
    ${item('progresso')}${item('especialidades')}${item('insignias')}
    ${pode('monitor') ? `<div class="nav-titulo">${S.eu.papel === 'chefe' ? 'Chefia' : 'Monitor'}</div>${item('monitor')}${item('avaliacoes', S.pendentes)}` : ''}
    ${pode('patrulhas') ? item('patrulhas') : ''}
    <div class="nav-titulo">Ajustes</div>
    ${item('conta')}${item('config')}`;
}

async function irPara(view) {
  S.view = view;
  $('#titulo-view').textContent = VIEWS[view].titulo;
  $('#shell').classList.remove('menu-aberto');
  desenharSidebar();
  // troca o elemento #view por um novo para não acumular eventos entre telas
  const velho = $('#view'); const el = velho.cloneNode(false); velho.replaceWith(el);
  el.innerHTML = '<div class="carregando"><div class="spinner"></div></div>';
  try { await VIEWS[view].render(el); } catch (e) { erro(e); el.innerHTML = `<div class="card vazio"><span class="grande">⚠️</span>${h(e.message)}</div>`; }
  window.scrollTo(0, 0);
}

/* ================================================== RENDER DE PROGRESSÃO */
const NOME_TIPO = { especialidade: 'especialidade', insignia: 'insígnia', ambos: 'especialidade ou insígnia' };
const ICO_TIPO = { especialidade: '🎖️', insignia: '🏅' };

function htmlStatusEnvio(item, p) {
  const tipo = tipoEnvio(item); if (!tipo) return '';
  const e = S.envios[item.id];
  const nomeEnvio = e ? `${ICO_TIPO[e.tipo]} ${h(e.nome)}${e.nivel ? ` (nível ${e.nivel})` : ''}` : '';
  if (p) return e?.status === 'aprovado' ? `<button type="button" class="envio-status ok" data-abrir-envio="${item.id}">${nomeEnvio}</button>` : '';
  if (e?.status === 'pendente') return `<button type="button" class="envio-status pendente" data-abrir-envio="${item.id}">⏳ Aguardando avaliação do monitor · ${nomeEnvio}</button>`;
  if (e?.status === 'recusado') return `<button type="button" class="envio-status recusado" data-abrir-envio="${item.id}">✖ Recusado${e.comentario ? `: “${h(e.comentario)}”` : ''} · ${S.proprio ? 'toque para enviar de novo' : 'aguardando novo envio'}</button>`;
  return S.proprio
    ? `<button type="button" class="envio-status" data-abrir-envio="${item.id}">📎 Envie o relatório da ${NOME_TIPO[tipo]} para marcar</button>`
    : `<span class="envio-status">📎 Aguardando o envio do relatório</span>`;
}

function htmlItem(item, prog, editavel, num) {
  const p = prog[item.id];
  const comEnvio = !!tipoEnvio(item);
  const tag = item.m ? `<span class="tag-mod ${item.m}">${item.m === 'ar' ? '✈ Ar' : '⛵ Mar'}</span>` : '';
  const por = p?.por ? `<span class="por">✔ validado por ${h(p.por)}</span>` : '';
  const dataEditavel = editavel && !(comEnvio && S.proprio);
  return `<div class="item ${p ? 'feito' : ''} ${item.esp ? 'esp' : ''} ${num === 'OU' ? 'ou' : ''}" data-id="${item.id}">
    <label><input type="checkbox" class="check" data-item="${item.id}" ${p ? 'checked' : ''} ${editavel ? '' : 'disabled'} aria-label="Concluído">
    <span class="txt"><span class="num">${num}</span>${h(item.t)}${tag}${por}</span></label>
    ${p ? `<input type="date" class="data" data-data="${item.id}" value="${h(p.data)}" ${dataEditavel ? '' : 'disabled'} aria-label="Data">` : '<span></span>'}
    ${comEnvio ? `<div class="item-envio">${htmlStatusEnvio(item, p)}</div>` : ''}
  </div>`;
}

function htmlBloco(b, prog, mod, editavel) {
  const st = statusBloco(b, prog, mod);
  const fixas = b.fixas.filter((i) => itemVisivel(i, mod));
  const vars = b.variaveis.filter((i) => itemVisivel(i, mod));
  const filtra = (i) => S.filtro === 'todos' || (S.filtro === 'pendentes' ? !prog[i.id] : !!prog[i.id]);
  const fx = fixas.filter(filtra), vr = vars.filter(filtra);
  const ouVis = b.ou && filtra(b.ou);
  const numerados = b.variaveis.filter((x) => !x.esp);
  return `<div class="bloco ${st.completo ? 'completo' : ''}" data-bloco="${b.id}">
    <div class="bloco-topo">
      <div><h4>Bloco ${b.numero} · ${h(b.titulo)}</h4></div>
      ${st.completo ? '<span class="badge ok">✔ Completo</span>' : `<span class="badge">${st.pct}%</span>`}
    </div>
    <p class="bloco-desc">${h(b.descricao)}</p>
    <div class="barra"><i style="width:${st.pct}%"></i></div>
    ${fixas.length ? `<div class="grupo-titulo"><span>Ações fixas</span><span class="cont ${st.fixasOk === st.fixasTotal ? 'ok' : ''}">${st.fixasOk}/${st.fixasTotal}</span></div>
      ${fx.map((i) => htmlItem(i, prog, editavel, b.fixas.indexOf(i) + 1)).join('')}` : ''}
    <div class="grupo-titulo"><span>Ações variáveis · realizar ${NUM_EXTENSO[st.req] || st.req}</span><span class="cont ${st.varsOk >= st.req ? 'ok' : ''}">${st.varsOk}/${st.req}</span></div>
    ${vr.map((i) => htmlItem(i, prog, editavel, i.esp ? '★' : numerados.indexOf(i) + 1)).join('')}
    ${ouVis ? `<div class="grupo-titulo"><span>Ou, alternativamente</span>${st.ouOk ? '<span class="cont ok">✔</span>' : ''}</div>${htmlItem(b.ou, prog, editavel, 'OU')}` : ''}
  </div>`;
}

function htmlResumo(prog, mod) {
  const r = resumoGeral(prog, mod);
  return `<div class="card resumo" id="resumo">
    <div class="anel" style="--p:${r.pct}"><b>${r.pct}%</b></div>
    <div class="eixos-mini">
      <div class="muted pequeno">Acolhida: <b>${r.acOk}/${r.acTotal}</b> · Blocos completos: <b>${r.completos}/${r.blocos}</b></div>
      ${EIXOS.map((e, i) => `<div class="eixo-mini"><span>${e.icone}</span><span>${h(e.titulo)}</span><span class="muted">${r.porEixo[i].completos}/${r.porEixo[i].total}</span>
        <div class="barra" style="--cor:${e.cor}"><i style="width:${r.porEixo[i].pct}%"></i></div></div>`).join('')}
    </div></div>`;
}

function htmlProgressao(prog, mod, editavel) {
  const acOk = ACOLHIDA_ITENS.filter((i) => prog[i.id]).length;
  const filtraAc = ACOLHIDA_ITENS.filter((i) => S.filtro === 'todos' || (S.filtro === 'pendentes' ? !prog[i.id] : !!prog[i.id]));
  const aberto = (id) => (S.abertos.has(id) ? 'open' : '');
  return `${htmlResumo(prog, mod)}
    <div class="filtros" role="group" aria-label="Filtro">
      ${['todos', 'pendentes', 'concluidos'].map((f) => `<button class="chip" data-filtro="${f}" aria-pressed="${S.filtro === f}">${{ todos: 'Todos', pendentes: 'Pendentes', concluidos: 'Concluídos' }[f]}</button>`).join('')}
      <span class="badge" style="margin-left:auto;align-self:center">Modalidade: ${{ basica: 'Básica', ar: '✈ Ar', mar: '⛵ Mar' }[mod]}</span>
    </div>
    <details class="secao" data-secao="ac" style="--cor:#a78bfa" ${aberto('ac')}>
      <summary><span class="ico-eixo">🤝</span><div><h3>${ACOLHIDA.titulo}</h3><span class="muted pequeno">${ACOLHIDA.subtitulo} · ${acOk}/${ACOLHIDA_ITENS.length}</span>
        <div class="barra" style="--cor:#a78bfa"><i style="width:${Math.round((acOk / ACOLHIDA_ITENS.length) * 100)}%"></i></div></div><span class="seta">▾</span></summary>
      <div class="secao-corpo"><div class="bloco">${filtraAc.map((i) => htmlItem(i, prog, editavel, ACOLHIDA_ITENS.indexOf(i) + 1)).join('') || '<p class="muted pequeno">Nada aqui.</p>'}</div></div>
    </details>
    ${EIXOS.map((e) => {
      const sts = e.blocos.map((b) => statusBloco(b, prog, mod));
      const pct = Math.round(sts.reduce((a, s) => a + s.pct, 0) / sts.length);
      return `<details class="secao" data-secao="${e.id}" style="--cor:${e.cor}" ${aberto(e.id)}>
        <summary><span class="ico-eixo">${e.icone}</span><div><h3>Eixo ${e.numero} · ${h(e.titulo)}</h3>
          <span class="muted pequeno">${sts.filter((s) => s.completo).length}/${e.blocos.length} blocos completos</span>
          <div class="barra" style="--cor:${e.cor}"><i style="width:${pct}%"></i></div></div><span class="seta">▾</span></summary>
        <div class="secao-corpo">${e.blocos.map((b) => htmlBloco(b, prog, mod, editavel)).join('')}</div>
      </details>`;
    }).join('')}`;
}

/** Liga os eventos de uma área de progressão. */
function ligarProgressao(el, { userId, prog, mod, editavel, redesenhar }) {
  el.addEventListener('toggle', (e) => {
    const id = e.target.dataset?.secao; if (!id) return;
    e.target.open ? S.abertos.add(id) : S.abertos.delete(id);
  }, true);
  el.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filtro]');
    if (f) { S.filtro = f.dataset.filtro; redesenhar(); }
    const a = e.target.closest('[data-abrir-envio]');
    if (a) { e.preventDefault(); acaoItemEnvio(a.dataset.abrirEnvio, prog, redesenhar); }
  });
  if (!editavel) return;
  const salvar = async (itemId, data) => {
    const antes = prog[itemId];
    if (data) prog[itemId] = { ...(antes || {}), data }; else delete prog[itemId];
    atualizarParcial(el, itemId, prog, mod, editavel);
    try { await db.setItem(userId, itemId, data); }
    catch (err) { if (antes) prog[itemId] = antes; else delete prog[itemId]; atualizarParcial(el, itemId, prog, mod, editavel); erro(err); }
  };
  el.addEventListener('change', async (e) => {
    const t = e.target;
    const id = t.dataset.item;
    if (id && tipoEnvio(itemPorId(id))) {
      // itens de especialidade/insígnia: só com relatório + aprovação
      if (!t.checked && !S.proprio) {
        t.checked = true;
        if (await confirmar('Desmarcar este item?', 'O item volta a ficar pendente. O envio aprovado continua no histórico.', 'Desmarcar', true)) salvar(id, null);
        return;
      }
      t.checked = !!prog[id];
      acaoItemEnvio(id, prog, redesenhar);
      return;
    }
    if (t.dataset.item) salvar(t.dataset.item, t.checked ? (prog[t.dataset.item]?.data || hoje()) : null);
    else if (t.dataset.data && t.value) salvar(t.dataset.data, t.value);
  });
}

function atualizarParcial(el, itemId, prog, mod, editavel) {
  // redesenha apenas o bloco afetado + resumo (mantém rolagem e seções abertas)
  const blocoEl = el.querySelector(`.item[data-id="${itemId}"]`)?.closest('.bloco');
  const bloco = EIXOS.flatMap((e) => e.blocos).find((b) => b.id === blocoEl?.dataset.bloco);
  if (bloco) blocoEl.outerHTML = htmlBloco(bloco, prog, mod, editavel);
  else if (itemId.startsWith('ac')) {
    const itemEl = el.querySelector(`.item[data-id="${itemId}"]`);
    const it = ACOLHIDA_ITENS.find((i) => i.id === itemId);
    if (itemEl) itemEl.outerHTML = htmlItem(it, prog, editavel, ACOLHIDA_ITENS.indexOf(it) + 1);
  }
  el.querySelector('#resumo')?.replaceWith(Object.assign(document.createElement('div'), { innerHTML: htmlResumo(prog, mod) }).firstElementChild);
  // atualiza cabeçalhos dos eixos
  el.querySelectorAll('details.secao').forEach((d) => {
    const e = EIXOS.find((x) => x.id === d.dataset.secao);
    if (!e) {
      const ok = ACOLHIDA_ITENS.filter((i) => prog[i.id]).length;
      d.querySelector('summary .muted').textContent = `${ACOLHIDA.subtitulo} · ${ok}/${ACOLHIDA_ITENS.length}`;
      d.querySelector('summary .barra i').style.width = Math.round((ok / ACOLHIDA_ITENS.length) * 100) + '%';
      return;
    }
    const sts = e.blocos.map((b) => statusBloco(b, prog, mod));
    d.querySelector('summary .muted').textContent = `${sts.filter((s) => s.completo).length}/${e.blocos.length} blocos completos`;
    d.querySelector('summary .barra i').style.width = Math.round(sts.reduce((a, s) => a + s.pct, 0) / sts.length) + '%';
  });
}

/* ========================================================= VIEW: PROGRESSO */
async function viewProgresso(el) {
  const [prog, envs] = await Promise.all([db.getProgresso(S.eu.id), db.listarEnvios({ userId: S.eu.id })]);
  S.meuProgresso = prog; S.envios = mapaEnvios(envs); S.proprio = true;
  const mod = S.eu.modalidade || 'basica';
  const semPatrulha = S.eu.papel !== 'chefe' && !S.eu.patrulha_id;
  const desenhar = () => {
    el.innerHTML = (semPatrulha ? `<div class="aviso">Você ainda não está em uma patrulha. Vá em <b>Minha Conta</b> e informe o código de entrada da sua patrulha.</div>` : '')
      + htmlProgressao(S.meuProgresso, mod, true);
  };
  desenhar();
  ligarProgressao(el, { userId: S.eu.id, prog: S.meuProgresso, mod, editavel: true,
    redesenhar: async (recarregar) => {
      if (recarregar === true) { S.envios = mapaEnvios(await db.listarEnvios({ userId: S.eu.id })); Object.assign(S.meuProgresso, await db.getProgresso(S.eu.id)); }
      desenhar();
    } });
}

/* =========================================================== VIEW: MONITOR */
async function viewMonitor(el) {
  const chefe = S.eu.papel === 'chefe';
  let patrulhas = await db.listarPatrulhas();
  if (!chefe) patrulhas = patrulhas.filter((p) => p.id === S.eu.patrulha_id);
  if (!patrulhas.length) {
    el.innerHTML = `<div class="card vazio"><span class="grande">🏕️</span>${chefe ? 'Nenhuma patrulha criada ainda. Crie uma em <b>Patrulhas</b>.' : 'Você não está em uma patrulha.'}</div>`;
    return;
  }
  if (!patrulhas.some((p) => p.id === S.monitor.patrulhaId)) S.monitor.patrulhaId = patrulhas[0].id;
  const pt = patrulhas.find((p) => p.id === S.monitor.patrulhaId);

  if (S.monitor.alvo) return viewMembro(el, pt);

  const membros = await db.membros(pt.id);
  const progs = await db.progressoDeVarios(membros.map((m) => m.id));
  const resumos = Object.fromEntries(membros.map((m) => [m.id, resumoGeral(progs[m.id] || {}, m.modalidade || 'basica')]));
  const media = membros.length ? Math.round(membros.reduce((a, m) => a + resumos[m.id].pct, 0) / membros.length) : 0;
  const pend = {};
  (await db.listarEnvios({ status: 'pendente' })).forEach((e) => { pend[e.user_id] = (pend[e.user_id] || 0) + 1; });

  el.innerHTML = `
    <div class="card">
      <div class="card-titulo">
        <div><h3 style="margin:0">🏕️ Patrulha ${h(pt.nome)}</h3><span class="muted pequeno">${membros.length} membro(s) · média de progresso ${media}%</span></div>
        ${chefe && patrulhas.length > 1 ? `<select class="input" id="sel-patrulha" style="max-width:240px">${patrulhas.map((p) => `<option value="${p.id}" ${p.id === pt.id ? 'selected' : ''}>${h(p.nome)}</option>`).join('')}</select>` : ''}
      </div>
      <p class="muted pequeno" style="margin:0">Toque em um membro para ver e marcar todos os itens da progressão dele.</p>
    </div>
    ${membros.length ? `<div class="grade" style="margin-top:14px">${membros.map((m) => {
      const r = resumos[m.id];
      return `<button class="card membro" data-membro="${m.id}">
        <div class="membro-topo"><div class="avatar">${h(iniciais(m.nome))}</div><div><b>${h(m.nome)}</b>${papelTexto(m)}</div><span class="pct-grande">${r.pct}%</span></div>
        <div class="barra"><i style="width:${r.pct}%"></i></div>
        <div class="muted pequeno" style="margin-top:.5rem">Acolhida ${r.acOk}/${r.acTotal} · Blocos ${r.completos}/${r.blocos}
          ${pend[m.id] ? `<span class="badge pendente">⏳ ${pend[m.id]} para avaliar</span>` : ''}</div>
        <div class="mini-eixos">${EIXOS.map((e, i) => `<div>${e.icone}<div class="barra" style="--cor:${e.cor}"><i style="width:${r.porEixo[i].pct}%"></i></div></div>`).join('')}</div>
      </button>`;
    }).join('')}</div>
    <div class="card"><h3>📊 Visão geral</h3><div class="tabela-wrap"><table class="tabela">
      <thead><tr><th>Membro</th><th>Acolhida</th>${EIXOS.map((e) => `<th>${e.icone} Eixo ${e.numero}</th>`).join('')}<th>Total</th></tr></thead>
      <tbody>${membros.map((m) => { const r = resumos[m.id]; return `<tr><td>${h(m.nome)}</td><td>${r.acOk}/${r.acTotal}</td>${r.porEixo.map((x) => `<td>${x.completos}/${x.total} <span class="muted">(${x.pct}%)</span></td>`).join('')}<td><b>${r.pct}%</b></td></tr>`; }).join('')}</tbody>
    </table></div></div>` : `<div class="card vazio" style="margin-top:14px"><span class="grande">🙋</span>Ninguém entrou nesta patrulha ainda.<br>Código de entrada: <span class="codigo">${h(pt.codigo)}</span></div>`}`;

  $('#sel-patrulha', el)?.addEventListener('change', (e) => { S.monitor.patrulhaId = e.target.value; irPara('monitor'); });
  el.querySelectorAll('[data-membro]').forEach((b) => b.addEventListener('click', () => {
    S.monitor.alvo = membros.find((m) => m.id === b.dataset.membro);
    S.monitor.progresso = progs[S.monitor.alvo.id] || {};
    irPara('monitor');
  }));
}

async function viewMembro(el, pt) {
  const m = S.monitor.alvo;
  const prog = S.monitor.progresso = await db.getProgresso(m.id);
  let envs = await db.listarEnvios({ userId: m.id });
  S.envios = mapaEnvios(envs); S.proprio = m.id === S.eu.id;
  const mod = m.modalidade || 'basica';
  const novo = el;
  const cab = `<div class="card" style="margin-bottom:14px"><div class="card-titulo" style="margin:0">
      <div class="membro-topo" style="margin:0"><div class="avatar">${h(iniciais(m.nome))}</div><div><b>${h(m.nome)}</b><span class="muted pequeno">Patrulha ${h(pt.nome)} · ${papelTexto(m)}</span></div></div>
      <button class="btn btn-sm" id="btn-voltar">← Voltar à patrulha</button></div>
      <p class="muted pequeno" style="margin:.6rem 0 0">Como ${S.eu.papel === 'chefe' ? 'chefe' : 'monitor'}, você pode marcar e datar os itens deste membro.</p></div>`;
  const htmlEnviosMembro = () => {
    const pend = envs.filter((e) => e.status === 'pendente');
    if (!envs.length) return '';
    return `<details class="secao" data-secao="envios-membro" ${pend.length ? 'open' : ''} style="--cor:#f5b74f">
      <summary><span class="ico-eixo">🎖️</span><div><h3>Especialidades e insígnias</h3><span class="muted pequeno">${pend.length ? `⏳ ${pend.length} aguardando avaliação · ` : ''}${envs.length} envio(s)</span></div><span class="seta">▾</span></summary>
      <div class="secao-corpo" id="lista-envios-membro">${envs.map((e) => htmlEnvio(e, { avaliar: !S.proprio })).join('')}</div></details>`;
  };
  const desenhar = () => {
    novo.innerHTML = cab + htmlEnviosMembro() + htmlProgressao(prog, mod, true);
    $('#btn-voltar', novo).onclick = () => { S.monitor.alvo = null; irPara('monitor'); };
    const lista = $('#lista-envios-membro', novo);
    if (lista) carregarMiniaturas(lista, envs);
  };
  const recarregar = async () => {
    envs = await db.listarEnvios({ userId: m.id }); S.envios = mapaEnvios(envs);
    Object.keys(prog).forEach((k) => delete prog[k]); Object.assign(prog, await db.getProgresso(m.id));
    desenhar(); verificarNotificacoes();
  };
  desenhar();
  ligarEnvios(novo, () => envs, recarregar);
  ligarProgressao(novo, { userId: m.id, prog, mod, editavel: true, redesenhar: (r) => (r === true ? recarregar() : desenhar()) });
}

/* ============================================ ESPECIALIDADES E INSÍGNIAS */
const STATUS_ENVIO = {
  pendente: { txt: '⏳ Aguardando avaliação', cls: 'pendente' },
  aprovado: { txt: '✔ Aprovado', cls: 'ok' },
  recusado: { txt: '✖ Recusado', cls: 'recusado' },
};
const fmtTamanho = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
const icoArquivo = (t = '') => (t.startsWith('image/') ? '🖼️' : t === 'application/pdf' ? '📄' : t.startsWith('video/') ? '🎬' : '📎');
const fmtDataHora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');

/** item_id → envio mais recente (lista já vem do mais novo para o mais antigo) */
function mapaEnvios(lista) {
  const m = {};
  lista.forEach((e) => { if (e.item_id && !m[e.item_id]) m[e.item_id] = e; });
  return m;
}

function htmlEnvio(e, { avaliar = false } = {}) {
  const st = STATUS_ENVIO[e.status];
  const item = e.item_id ? itemPorId(e.item_id) : null;
  const meu = e.user_id === S.eu.id;
  return `<article class="card envio" data-envio="${e.id}">
    <div class="envio-topo">
      <div class="envio-ico">${ICO_TIPO[e.tipo]}</div>
      <div class="envio-titulo">
        <b>${h(e.nome)}</b>
        <span class="muted pequeno">${e.tipo === 'insignia' ? 'Insígnia' : 'Especialidade'}${e.nivel ? ` · nível ${e.nivel}` : ''}${meu ? '' : ` · enviado por <b>${h(e.autor)}</b>`} · ${fmtDataHora(e.criado_em)}</span>
      </div>
      <span class="badge ${st.cls}">${st.txt}</span>
    </div>
    ${item ? `<p class="envio-item">🔗 Conta para: <b>${h(item.bloco)}</b><br><span class="muted">${h(item.t.length > 140 ? item.t.slice(0, 140) + '…' : item.t)}</span></p>` : ''}
    ${e.relatorio ? `<p class="envio-relatorio">${h(e.relatorio)}</p>` : ''}
    <div class="arquivos">${e.arquivos.map((a, i) => `<button type="button" class="arquivo" data-arquivo="${i}" title="Abrir ${h(a.nome)}">
      ${a.tipo?.startsWith('image/') ? `<img alt="" data-thumb="${i}">` : `<span class="arq-ico">${icoArquivo(a.tipo)}</span>`}
      <span class="arq-nome">${h(a.nome)}</span><span class="arq-tam">${fmtTamanho(a.tamanho)}</span></button>`).join('')}</div>
    ${e.status !== 'pendente' ? `<p class="envio-avaliacao ${st.cls}">${e.status === 'aprovado' ? '✔ Aprovado' : '✖ Recusado'} por ${h(e.avaliado_por_nome || '—')} em ${fmtDataHora(e.avaliado_em)}${e.comentario ? `<br>💬 “${h(e.comentario)}”` : ''}</p>` : ''}
    <div class="linha envio-acoes">
      ${avaliar && e.status === 'pendente' && !meu ? `<button class="btn btn-primary btn-sm" data-acao-envio="aprovar">✔ Aprovar</button><button class="btn btn-danger btn-sm" data-acao-envio="recusar">✖ Recusar</button>` : ''}
      ${meu && e.status === 'pendente' ? '<button class="btn btn-sm" data-acao-envio="cancelar">Cancelar envio</button>' : ''}
      ${meu && e.status === 'recusado' ? '<button class="btn btn-sm" data-acao-envio="reenviar">↻ Enviar de novo</button>' : ''}
    </div>
  </article>`;
}

async function carregarMiniaturas(el, lista) {
  for (const img of el.querySelectorAll('img[data-thumb]')) {
    const e = lista.find((x) => x.id === img.closest('[data-envio]')?.dataset.envio);
    if (!e) continue;
    try { img.src = await db.urlArquivo(e.arquivos[img.dataset.thumb]); } catch { img.remove(); }
  }
}

/** Liga os botões dos cards de envio. getLista() devolve a lista atual. */
function ligarEnvios(el, getLista, recarregar) {
  el.addEventListener('click', async (ev) => {
    const card = ev.target.closest('[data-envio]'); if (!card) return;
    const e = getLista().find((x) => x.id === card.dataset.envio); if (!e) return;
    const arq = ev.target.closest('[data-arquivo]');
    const acao = ev.target.closest('[data-acao-envio]')?.dataset.acaoEnvio;
    try {
      if (arq) return abrirArquivo(e.arquivos[arq.dataset.arquivo]);
      if (acao === 'aprovar' || acao === 'recusar') { if (await avaliar(e, acao === 'aprovar')) await recarregar(); }
      if (acao === 'cancelar' && await confirmar('Cancelar este envio?', 'O relatório e os arquivos serão apagados.', 'Cancelar envio', true)) {
        await db.excluirEnvio(e.id); toast('Envio cancelado.'); await recarregar();
      }
      if (acao === 'reenviar') abrirFormEnvio({ tipo: e.tipo, item_id: e.item_id, nome: e.nome, nivel: e.nivel, aoEnviar: recarregar });
    } catch (err) { erro(err); }
  });
}

async function abrirArquivo(a) {
  const url = await db.urlArquivo(a);
  if (a.tipo?.startsWith('image/')) {
    modal(`<h3>${h(a.nome)}</h3><img src="${h(url)}" alt="${h(a.nome)}" class="previa-img">
      <div class="acoes"><a class="btn" href="${h(url)}" download="${h(a.nome)}" target="_blank" rel="noopener">⬇ Baixar</a><button class="btn btn-primary" data-fechar>Fechar</button></div>`);
  } else {
    const w = window.open(url, '_blank', 'noopener');
    if (!w) { const l = document.createElement('a'); l.href = url; l.download = a.nome; l.click(); }
  }
}

function avaliar(e, aprovar) {
  return new Promise((ok) => {
    const d = modal(`<h3>${aprovar ? '✔ Aprovar' : '✖ Recusar'} ${e.tipo === 'insignia' ? 'insígnia' : 'especialidade'}</h3>
      <p class="muted"><b>${h(e.nome)}</b>${e.nivel ? ` (nível ${e.nivel})` : ''} · ${h(e.autor)}</p>
      ${aprovar && e.item_id ? '<p class="aviso ok">O item vinculado será marcado como concluído na progressão.</p>' : ''}
      <form id="m-aval"><label class="campo"><span>Comentário ${aprovar ? '(opcional)' : '(obrigatório)'}</span>
        <textarea class="input" name="comentario" rows="3" ${aprovar ? '' : 'required'} placeholder="${aprovar ? 'Parabéns! Ótimo relatório.' : 'Explique o que precisa melhorar'}"></textarea></label>
      <div class="acoes"><button type="button" class="btn" data-fechar>Voltar</button><button class="btn ${aprovar ? 'btn-primary' : 'btn-danger'}">${aprovar ? 'Aprovar' : 'Recusar'}</button></div></form>`);
    let feito = false;
    $('#m-aval', d).onsubmit = async (ev) => {
      ev.preventDefault(); const b = ev.submitter; b.disabled = true;
      try {
        await db.avaliarEnvio(e.id, aprovar, new FormData(ev.target).get('comentario'));
        feito = true; d.close(); toast(aprovar ? 'Aprovado! ✔' : 'Envio recusado.', aprovar ? 'ok' : '');
      } catch (err) { erro(err); b.disabled = false; }
    };
    d.addEventListener('close', () => ok(feito), { once: true });
  });
}

/** Clique em um item da progressão que exige envio. */
function acaoItemEnvio(itemId, prog, redesenhar) {
  const e = S.envios[itemId];
  const item = itemPorId(itemId);
  const depois = () => redesenhar(true);
  if (e && (e.status === 'pendente' || prog[itemId] || (e.status === 'recusado' && !S.proprio))) {
    const d = modal(`<h3>${ICO_TIPO[e.tipo]} ${h(e.nome)}</h3>${htmlEnvio(e, { avaliar: !S.proprio && ehAvaliador() })}
      <div class="acoes"><button class="btn" data-fechar>Fechar</button></div>`, (dd) => carregarMiniaturas(dd, [e]));
    ligarEnvios(d, () => [e], async () => { d.close(); await depois(); verificarNotificacoes(); });
    return;
  }
  if (!S.proprio) return toast('O escoteiro precisa enviar o relatório antes.');
  if (prog[itemId]) return;
  const t = tipoEnvio(item);
  abrirFormEnvio({ tipo: t === 'ambos' ? null : t, permitirAmbos: t === 'ambos', item_id: itemId, aoEnviar: depois });
}

function abrirFormEnvio({ tipo = 'especialidade', permitirAmbos = false, item_id = null, nome = '', nivel = null, aoEnviar } = {}) {
  const mod = S.eu.modalidade || 'basica';
  const item = item_id ? itemPorId(item_id) : null;
  const tipoInicial = tipo || 'especialidade';
  const escolheTipo = permitirAmbos || !item_id;
  const opcoesItem = (t) => ITENS_COM_ENVIO
    .filter((i) => itemVisivel(i, mod) && (i.tipo === t || i.tipo === 'ambos'))
    .filter((i) => i.id === item_id || (!S.meuProgresso[i.id] && S.envios[i.id]?.status !== 'pendente'))
    .map((i) => `<option value="${i.id}" ${i.id === item_id ? 'selected' : ''}>${h(i.bloco)} — ${h(i.esp ? 'especialidade que soma nas variáveis' : i.t.slice(0, 70))}</option>`).join('');
  const d = modal(`<h3>📤 Enviar ${escolheTipo ? 'conquista' : NOME_TIPO[tipoInicial]}</h3>
    ${item ? `<p class="aviso">🔗 <b>${h(item.bloco)}</b><br>${h(item.t)}</p>` : ''}
    <form id="m-envio">
      ${escolheTipo ? `<div class="campo"><span>Tipo</span><div class="segmentado" id="m-tipo">
        <button type="button" data-v="especialidade" aria-pressed="${tipoInicial === 'especialidade'}">🎖️ Especialidade</button>
        <button type="button" data-v="insignia" aria-pressed="${tipoInicial === 'insignia'}">🏅 Insígnia</button></div></div>` : ''}
      <input type="hidden" name="tipo" value="${tipoInicial}">
      <label class="campo"><span id="m-rotulo-nome">Qual ${tipoInicial === 'insignia' ? 'insígnia' : 'especialidade'}?</span>
        <input class="input" name="nome" list="m-lista" required autocomplete="off" value="${h(nome)}" placeholder="Digite ou escolha da lista">
        <datalist id="m-lista"></datalist></label>
      <label class="campo" id="m-campo-nivel"><span>Nível</span><select class="input" name="nivel">
        ${[1, 2, 3].map((n) => `<option value="${n}" ${(nivel || (item?.id.endsWith('ou') ? 2 : 1)) === n ? 'selected' : ''}>Nível ${n}</option>`).join('')}</select></label>
      ${item_id ? `<input type="hidden" name="item_id" value="${item_id}">` : `<label class="campo"><span>Vincular a um item da progressão (opcional)</span>
        <select class="input" name="item_id" id="m-item"></select><small>Ao ser aprovado, o item é marcado automaticamente.</small></label>`}
      <label class="campo"><span>📎 Relatório e comprovantes *</span>
        <input class="input" type="file" name="arquivos" id="m-arquivos" multiple required
          accept="application/pdf,image/*,video/*,.doc,.docx,.odt,.txt,.rtf,.ppt,.pptx,.xls,.xlsx">
        <small>PDF, fotos, vídeos ou documentos · até ${MAX_ARQUIVOS} arquivos de ${LIMITE_ARQUIVO_MB} MB.</small>
        <div id="m-lista-arq" class="lista-arq"></div></label>
      <label class="campo"><span>Resumo do que você fez (opcional)</span>
        <textarea class="input" name="relatorio" rows="3" maxlength="2000" placeholder="Conte como conquistou, o que aprendeu…"></textarea></label>
      <div class="acoes"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn btn-primary" id="m-enviar">📤 Enviar para o monitor</button></div>
    </form>`);
  const form = $('#m-envio', d);
  const aplicarTipo = (t) => {
    form.tipo.value = t;
    $('#m-lista', d).innerHTML = (t === 'insignia' ? INSIGNIAS : ESPECIALIDADES).map((n) => `<option value="${h(n)}">`).join('');
    $('#m-campo-nivel', d).hidden = t !== 'especialidade';
    $('#m-rotulo-nome', d).textContent = `Qual ${t === 'insignia' ? 'insígnia' : 'especialidade'}?`;
    const sel = $('#m-item', d);
    if (sel) sel.innerHTML = '<option value="">— não vincular —</option>' + opcoesItem(t);
  };
  aplicarTipo(tipoInicial);
  $('#m-tipo', d)?.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    $('#m-tipo', d).querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    aplicarTipo(b.dataset.v);
  });
  $('#m-arquivos', d).addEventListener('change', (ev) => {
    $('#m-lista-arq', d).innerHTML = Array.from(ev.target.files).map((f) => `<span class="${f.size > LIMITE_ARQUIVO_MB * 1048576 ? 'grande' : ''}">${icoArquivo(f.type)} ${h(f.name)} · ${fmtTamanho(f.size)}</span>`).join('');
  });
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const b = $('#m-enviar', d); b.disabled = true; b.textContent = 'Enviando…';
    try {
      const f = new FormData(form);
      await db.enviar({ tipo: f.get('tipo'), nome: f.get('nome'), nivel: f.get('nivel'), item_id: f.get('item_id') || null,
        relatorio: f.get('relatorio'), arquivos: $('#m-arquivos', d).files });
      d.close();
      toast('Enviado! O monitor vai avaliar. 📤', 'ok');
      await aoEnviar?.();
    } catch (err) { erro(err); b.disabled = false; b.textContent = '📤 Enviar para o monitor'; }
  };
}

/* ======================================== VIEW: ESPECIALIDADES / INSÍGNIAS */
async function viewEnvios(el, tipo) {
  const [lista, prog] = await Promise.all([db.listarEnvios({ userId: S.eu.id }), db.getProgresso(S.eu.id)]);
  S.meuProgresso = prog; S.envios = mapaEnvios(lista); S.proprio = true;
  const meus = lista.filter((e) => e.tipo === tipo);
  const n = (st) => meus.filter((e) => e.status === st).length;
  const ins = tipo === 'insignia';
  el.innerHTML = `
    <div class="card">
      <div class="card-titulo">
        <div><h3 style="margin:0">${ins ? '🏅 Minhas insígnias' : '🎖️ Minhas especialidades'}</h3>
          <span class="muted pequeno">${n('aprovado')} aprovada(s) · ${n('pendente')} aguardando · ${n('recusado')} recusada(s)</span></div>
        <button class="btn btn-primary" id="btn-novo-envio">➕ Enviar ${ins ? 'insígnia' : 'especialidade'}</button>
      </div>
      <p class="muted pequeno" style="margin:0">Envie o relatório (PDF, fotos ou outros arquivos). O monitor da sua patrulha avalia e, se aprovar,
        o item vinculado da progressão é marcado automaticamente.</p>
    </div>
    ${meus.length ? `<div class="pilha" style="margin-top:14px">${meus.map((e) => htmlEnvio(e)).join('')}</div>`
      : `<div class="card vazio" style="margin-top:14px"><span class="grande">${ins ? '🏅' : '🎖️'}</span>Você ainda não enviou nenhuma ${ins ? 'insígnia' : 'especialidade'}.</div>`}`;
  const recarregar = () => irPara(S.view);
  $('#btn-novo-envio', el).onclick = () => abrirFormEnvio({ tipo, aoEnviar: recarregar });
  ligarEnvios(el, () => meus, recarregar);
  carregarMiniaturas(el, meus);
}

/* ===================================================== VIEW: AVALIAÇÕES */
async function viewAvaliacoes(el) {
  const todos = (await db.listarEnvios()).filter((e) => e.user_id !== S.eu.id);
  const lista = todos.filter((e) => (S.filtroAval === 'pendente' ? e.status === 'pendente' : e.status !== 'pendente'));
  const pend = todos.filter((e) => e.status === 'pendente').length;
  const notif = 'Notification' in window ? Notification.permission : 'indisponivel';
  el.innerHTML = `
    ${notif === 'default' ? `<div class="card aviso-notif"><div><b>🔔 Receba um aviso quando chegar um envio</b><br><span class="muted pequeno">Ative as notificações deste aparelho.</span></div>
      <button class="btn btn-primary btn-sm" id="btn-ativar-notif">Ativar notificações</button></div>` : ''}
    <div class="card">
      <h3 style="margin:0 0 .3rem">✅ Especialidades e insígnias enviadas</h3>
      <p class="muted pequeno" style="margin:0">${S.eu.papel === 'chefe' ? 'Envios de todas as patrulhas.' : 'Envios dos membros da sua patrulha.'} Abra os arquivos, aprove ou recuse com um comentário.</p>
      <div class="filtros" style="margin-bottom:0">
        <button class="chip" data-f="pendente" aria-pressed="${S.filtroAval === 'pendente'}">⏳ Para avaliar (${pend})</button>
        <button class="chip" data-f="avaliado" aria-pressed="${S.filtroAval !== 'pendente'}">Já avaliados (${todos.length - pend})</button>
      </div>
    </div>
    ${lista.length ? `<div class="pilha" style="margin-top:14px">${lista.map((e) => htmlEnvio(e, { avaliar: true })).join('')}</div>`
      : `<div class="card vazio" style="margin-top:14px"><span class="grande">${S.filtroAval === 'pendente' ? '🎉' : '📭'}</span>${S.filtroAval === 'pendente' ? 'Nada para avaliar agora.' : 'Nenhum envio avaliado ainda.'}</div>`}`;
  el.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { S.filtroAval = b.dataset.f; irPara('avaliacoes'); }));
  $('#btn-ativar-notif', el)?.addEventListener('click', async () => { await pedirPermissaoNotificacao(); irPara('avaliacoes'); });
  ligarEnvios(el, () => lista, async () => { await verificarNotificacoes(); irPara('avaliacoes'); });
  carregarMiniaturas(el, lista);
}

/* ====================================================== NOTIFICAÇÕES */
const notif = { timer: null, cancelarRealtime: null, rodando: false, debounce: null };

function iniciarNotificacoes() {
  pararNotificacoes();
  verificarNotificacoes();
  notif.timer = setInterval(() => { if (document.visibilityState === 'visible') verificarNotificacoes(); }, 60 * 1000);
  notif.cancelarRealtime = db.assinarEnvios(() => {
    clearTimeout(notif.debounce);
    notif.debounce = setTimeout(verificarNotificacoes, 800);
  });
}
function pararNotificacoes() {
  clearInterval(notif.timer); notif.timer = null;
  notif.cancelarRealtime?.(); notif.cancelarRealtime = null;
  S.pendentes = 0; atualizarBadge();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && S.eu) verificarNotificacoes(); });

function atualizarBadge() {
  const b = $('#nav [data-view="avaliacoes"]');
  if (b) {
    b.querySelector('.nav-badge')?.remove();
    if (S.pendentes) b.insertAdjacentHTML('beforeend', `<span class="nav-badge" aria-label="${S.pendentes} pendentes">${S.pendentes}</span>`);
  }
  $('#btn-menu')?.classList.toggle('tem-aviso', S.pendentes > 0);
  try { S.pendentes ? navigator.setAppBadge?.(S.pendentes) : navigator.clearAppBadge?.(); } catch {}
}

async function notificarSistema(titulo, corpo, view) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || prefs.notificacoes === false) return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const opts = { body: corpo, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: 'envio-' + titulo + corpo, data: { view } };
    if (reg) await reg.showNotification(titulo, opts); else new Notification(titulo, opts);
  } catch {}
}

/** Compara os envios com o que já foi visto e avisa sobre novidades. */
async function verificarNotificacoes() {
  if (!S.eu || notif.rodando) return;
  notif.rodando = true;
  try {
    const envios = await db.listarEnvios();
    const avaliador = ehAvaliador();
    const paraAvaliar = avaliador ? envios.filter((e) => e.status === 'pendente' && e.user_id !== S.eu.id) : [];
    const meusAvaliados = envios.filter((e) => e.user_id === S.eu.id && e.status !== 'pendente');
    S.pendentes = paraAvaliar.length; atualizarBadge();

    const chave = `pe_vistos_${S.eu.id}`;
    const primeiraVez = localStorage.getItem(chave) === null;
    const vistos = new Set(JSON.parse(localStorage.getItem(chave) || '[]'));
    const novosAval = paraAvaliar.filter((e) => !vistos.has(`${e.id}:pendente`));
    const novosResult = meusAvaliados.filter((e) => !vistos.has(`${e.id}:${e.status}`));
    [...paraAvaliar.map((e) => `${e.id}:pendente`), ...meusAvaliados.map((e) => `${e.id}:${e.status}`)].forEach((k) => vistos.add(k));
    localStorage.setItem(chave, JSON.stringify([...vistos].slice(-500)));

    if (primeiraVez) {
      if (paraAvaliar.length) toast(`🔔 ${paraAvaliar.length} envio(s) aguardando sua avaliação.`, 'ok');
      return;
    }
    novosAval.slice(0, 3).forEach((e) => {
      const tit = `${ICO_TIPO[e.tipo]} Nova ${e.tipo === 'insignia' ? 'insígnia' : 'especialidade'} para avaliar`;
      toast(`${tit}: ${e.nome} – ${e.autor}`, 'ok');
      notificarSistema(tit, `${e.autor} enviou: ${e.nome}${e.nivel ? ` (nível ${e.nivel})` : ''}`, 'avaliacoes');
    });
    if (novosAval.length > 3) notificarSistema('🔔 Novos envios', `Mais ${novosAval.length - 3} envio(s) para avaliar`, 'avaliacoes');
    novosResult.slice(0, 3).forEach((e) => {
      const ok = e.status === 'aprovado';
      const tit = ok ? `✔ ${e.tipo === 'insignia' ? 'Insígnia aprovada' : 'Especialidade aprovada'}!` : `✖ ${e.tipo === 'insignia' ? 'Insígnia recusada' : 'Especialidade recusada'}`;
      toast(`${tit} ${e.nome}`, ok ? 'ok' : 'erro');
      notificarSistema(tit, `${e.nome}${e.comentario ? ` — “${e.comentario}”` : ''}`, e.tipo === 'insignia' ? 'insignias' : 'especialidades');
    });
    if ((novosAval.length && S.view === 'avaliacoes') || (novosResult.length && ['especialidades', 'insignias', 'progresso'].includes(S.view))) {
      if (!document.querySelector('#modal[open]')) irPara(S.view);
    }
  } catch (e) { console.warn('notificações:', e.message); }
  finally { notif.rodando = false; }
}

// clique na notificação do sistema → abre a tela certa
navigator.serviceWorker?.addEventListener('message', (e) => {
  if (e.data?.tipo === 'ABRIR' && S.eu && VIEWS[e.data.view] && (!VIEWS[e.data.view].se || VIEWS[e.data.view].se())) irPara(e.data.view);
});

/* ========================================================= VIEW: PATRULHAS */
async function viewPatrulhas(el) {
  const patrulhas = await db.listarPatrulhas();
  const membrosPor = Object.fromEntries(await Promise.all(patrulhas.map(async (p) => [p.id, await db.membros(p.id)])));
  const soltos = await db.semPatrulha();
  const opcoesPatrulha = (atual) => `<option value="">— sem patrulha —</option>` + patrulhas.map((p) => `<option value="${p.id}" ${p.id === atual ? 'selected' : ''}>${h(p.nome)}</option>`).join('');

  el.innerHTML = `
    <div class="card">
      <h3>➕ Criar nova patrulha</h3>
      <p class="muted pequeno" style="margin-top:0">Somente chefes podem criar patrulhas. Cada patrulha recebe um <b>código de entrada</b> que os escoteiros usam para entrar.</p>
      <form class="linha" id="form-patrulha"><input class="input" name="nome" placeholder="Nome da patrulha (ex.: Lobo)" required maxlength="40"><button class="btn btn-primary" type="submit">Criar patrulha</button></form>
    </div>
    ${patrulhas.length ? `<div class="grade" style="margin-top:14px">${patrulhas.map((p) => {
      const ms = membrosPor[p.id];
      return `<div class="card" data-pt="${p.id}">
        <div class="card-titulo" style="margin-bottom:.2rem"><h3 style="margin:0">🏕️ ${h(p.nome)}</h3><span class="badge">${ms.length} membro(s)</span></div>
        <div class="codigo-caixa"><span class="codigo">${h(p.codigo)}</span>
          <button class="btn btn-sm" data-acao="copiar" title="Copiar código">📋</button>
          <button class="btn btn-sm" data-acao="novo-codigo" title="Gerar novo código">🔄</button></div>
        <label class="campo" style="margin-bottom:.6rem"><span>Monitor</span>
          <select class="input" data-acao="monitor"><option value="">— nenhum —</option>${ms.map((m) => `<option value="${m.id}" ${p.monitor_id === m.id ? 'selected' : ''}>${h(m.nome)}</option>`).join('')}</select></label>
        ${ms.length ? `<div class="lista-membros">${ms.map((m) => `<div class="linha-membro"><span>${h(m.nome)} ${m.ehMonitor ? '<span class="badge monitor">Monitor</span>' : ''}</span>
          <select data-mover="${m.id}" aria-label="Mover ${h(m.nome)}">${opcoesPatrulha(p.id)}</select></div>`).join('')}</div>` : '<p class="muted pequeno">Sem membros ainda.</p>'}
        <div class="linha" style="margin-top:.9rem">
          <button class="btn btn-sm" data-acao="painel">📊 Painel</button>
          <button class="btn btn-sm" data-acao="renomear">✏️ Renomear</button>
          <button class="btn btn-sm btn-danger" data-acao="excluir">🗑 Excluir</button>
        </div>
      </div>`;
    }).join('')}</div>` : '<div class="card vazio"><span class="grande">🏕️</span>Nenhuma patrulha ainda. Crie a primeira acima!</div>'}
    <div class="card">
      <h3>🙋 Escoteiros sem patrulha</h3>
      ${soltos.length ? `<div class="lista-membros">${soltos.map((m) => `<div class="linha-membro"><span>${h(m.nome)} <span class="muted pequeno">${h(m.email)}</span></span>
        <select data-mover="${m.id}">${opcoesPatrulha(null)}</select></div>`).join('')}</div>` : '<p class="muted pequeno" style="margin:0">Todos os escoteiros estão em uma patrulha. 👍</p>'}
    </div>`;

  $('#form-patrulha', el).onsubmit = async (e) => {
    e.preventDefault();
    try {
      const p = await db.criarPatrulha(new FormData(e.target).get('nome'));
      await irPara('patrulhas');
      modal(`<h3>✅ Patrulha ${h(p.nome)} criada!</h3><p class="muted">Compartilhe este <b>código de entrada</b> com os escoteiros. Eles devem usá-lo ao criar a conta.</p>
        <div class="codigo-caixa"><span class="codigo">${h(p.codigo)}</span><button class="btn btn-sm" id="m-copiar">📋 Copiar</button></div>
        <div class="acoes"><button class="btn btn-primary" data-fechar>Pronto</button></div>`, (d) => { $('#m-copiar', d).onclick = () => copiar(p.codigo); });
    } catch (err) { erro(err); }
  };

  el.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-acao]'); if (!b || b.tagName === 'SELECT') return;
    const p = patrulhas.find((x) => x.id === b.closest('[data-pt]')?.dataset.pt); if (!p) return;
    try {
      if (b.dataset.acao === 'copiar') copiar(p.codigo);
      if (b.dataset.acao === 'novo-codigo' && await confirmar('Gerar novo código?', 'O código antigo deixará de funcionar para novos cadastros. Quem já está na patrulha continua nela.', 'Gerar novo')) {
        await db.novoCodigo(p.id); toast('Novo código gerado.', 'ok'); irPara('patrulhas');
      }
      if (b.dataset.acao === 'painel') { S.monitor = { patrulhaId: p.id, alvo: null, progresso: {} }; irPara('monitor'); }
      if (b.dataset.acao === 'renomear') {
        const d = modal(`<h3>Renomear patrulha</h3><form id="m-form"><input class="input" name="nome" value="${h(p.nome)}" required maxlength="40">
          <div class="acoes"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn btn-primary">Salvar</button></div></form>`);
        $('#m-form', d).onsubmit = async (ev) => { ev.preventDefault(); try { await db.renomearPatrulha(p.id, new FormData(ev.target).get('nome')); d.close(); irPara('patrulhas'); } catch (err) { erro(err); } };
      }
      if (b.dataset.acao === 'excluir' && await confirmar(`Excluir a patrulha ${p.nome}?`, 'Os membros ficarão sem patrulha, mas a progressão de cada um continua salva.', 'Excluir', true)) {
        await db.excluirPatrulha(p.id); toast('Patrulha excluída.'); irPara('patrulhas');
      }
    } catch (err) { erro(err); }
  });
  el.addEventListener('change', async (e) => {
    const t = e.target;
    try {
      if (t.dataset.acao === 'monitor') { await db.definirMonitor(t.closest('[data-pt]').dataset.pt, t.value || null); toast('Monitor atualizado.', 'ok'); irPara('patrulhas'); }
      if (t.dataset.mover !== undefined) { await db.moverMembro(t.dataset.mover, t.value || null); toast('Membro movido.', 'ok'); irPara('patrulhas'); }
    } catch (err) { erro(err); }
  });
}

/* ============================================================= VIEW: CONTA */
async function viewConta(el) {
  const patrulhas = S.eu.patrulha_id ? await db.listarPatrulhas().catch(() => []) : [];
  const minha = patrulhas.find((p) => p.id === S.eu.patrulha_id);
  el.innerHTML = `
    <div class="card">
      <div class="membro-topo"><div class="avatar" style="width:56px;height:56px;font-size:1.2rem">${h(iniciais(S.eu.nome))}</div>
        <div><b style="font-size:1.15rem">${h(S.eu.nome)}</b><span class="muted pequeno">${h(S.eu.email)}</span></div>${papelTexto(S.eu)}</div>
      <p class="muted" style="margin:0">Patrulha: <b>${minha ? h(minha.nome) : '—'}</b>${S.eu.ehMonitor ? ' · você é o <b>monitor</b>' : ''}</p>
    </div>
    <div class="card"><h3>✏️ Dados pessoais</h3>
      <form id="form-perfil">
        <label class="campo"><span>Nome</span><input class="input" name="nome" value="${h(S.eu.nome)}" required></label>
        <label class="campo"><span>Modalidade</span><select class="input" name="modalidade">
          ${[['basica', 'Básica'], ['ar', '✈ Modalidade do Ar'], ['mar', '⛵ Modalidade do Mar']].map(([v, t]) => `<option value="${v}" ${S.eu.modalidade === v ? 'selected' : ''}>${t}</option>`).join('')}
        </select><small>Os itens com ✈ ou ⛵ aparecem apenas para a modalidade correspondente.</small></label>
        <button class="btn btn-primary">Salvar</button>
      </form>
    </div>
    <div class="card"><h3>🔐 Código de entrada</h3>
      <p class="muted pequeno" style="margin-top:0">Use para entrar (ou trocar) de patrulha, ou para ativar o perfil de chefe.</p>
      <form class="linha" id="form-codigo"><input class="input input-codigo" name="codigo" placeholder="CÓDIGO" required autocomplete="off"><button class="btn">Aplicar código</button></form>
    </div>
    <div class="card"><h3>🔑 Trocar senha</h3>
      <form id="form-senha">
        <label class="campo"><span>Senha atual</span><input class="input" type="password" name="atual" required autocomplete="current-password"></label>
        <label class="campo"><span>Nova senha</span><input class="input" type="password" name="nova" required minlength="6" autocomplete="new-password"></label>
        <button class="btn">Trocar senha</button>
      </form>
    </div>
    <div class="card"><button class="btn btn-danger btn-block" id="btn-sair-conta">↩ Sair da conta</button></div>`;

  $('#form-perfil', el).onsubmit = async (e) => {
    e.preventDefault();
    try { S.eu = await db.atualizarPerfil(Object.fromEntries(new FormData(e.target))); toast('Dados salvos!', 'ok'); desenharSidebar(); } catch (err) { erro(err); }
  };
  $('#form-codigo', el).onsubmit = async (e) => {
    e.preventDefault();
    try { S.eu = await db.aplicarCodigo(new FormData(e.target).get('codigo')); toast('Código aplicado!', 'ok'); irPara('conta'); } catch (err) { erro(err); }
  };
  $('#form-senha', el).onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    try { await db.trocarSenha(f.get('atual'), f.get('nova')); e.target.reset(); toast('Senha alterada!', 'ok'); } catch (err) { erro(err); }
  };
  $('#btn-sair-conta', el).onclick = sair;
}

/* ============================================================ VIEW: CONFIG */
async function viewConfig(el) {
  const info = await infoVersao();
  const notif = 'Notification' in window ? Notification.permission : 'indisponivel';
  const seg = (nome, atual, opcoes) => `<div class="segmentado" data-pref="${nome}">${opcoes.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${(atual || opcoes[0][0]) === v}">${t}</button>`).join('')}</div>`;
  el.innerHTML = `
    <div class="card"><h3>🎨 Aparência</h3>
      <div class="opcao"><div><b>Tema</b><small>O modo escuro é o padrão.</small></div>${seg('tema', prefs.tema, [['dark', '🌙 Escuro'], ['light', '☀️ Claro']])}</div>
      <div class="opcao"><div><b>Tamanho do texto</b><small>Deixe mais fácil de ler.</small></div>${seg('fonte', prefs.fonte, [['', 'Normal'], ['grande', 'Grande'], ['extra', 'Extra']])}</div>
    </div>
    <div class="card"><h3>🔒 Segurança</h3>
      <div class="opcao"><div><b>PIN de bloqueio</b><small>Pede um código de 4 dígitos ao abrir o app neste aparelho.</small></div>
        ${temPin() ? '<button class="btn btn-sm btn-danger" id="btn-pin-remover">Remover PIN</button>' : '<button class="btn btn-sm" id="btn-pin-definir">Definir PIN</button>'}</div>
    </div>
    <div class="card"><h3>🔔 Atualizações</h3>
      <div class="opcao"><div><b>Versão instalada</b><small>${info ? `v${h(info.versao)} · ${fmtData(info.data)}` : 'desconhecida'}</small></div><button class="btn btn-sm" id="btn-verificar">Procurar atualização</button></div>
      <div class="opcao"><div><b>Notificações do sistema</b><small>${notif === 'granted' ? 'Você será avisado quando houver nova versão.' : notif === 'denied' ? 'Bloqueadas nas configurações do navegador.' : notif === 'indisponivel' ? 'Não suportado neste navegador.' : 'Receba um aviso quando sair nova versão.'}</small></div>
        ${notif === 'default' ? '<button class="btn btn-sm" id="btn-notif">Ativar</button>' : notif === 'granted' ? `<input type="checkbox" class="switch" id="sw-notif" ${prefs.notificacoes !== false ? 'checked' : ''} aria-label="Notificações">` : ''}</div>
      ${info?.novidades?.length ? `<div class="opcao"><div><b>Novidades desta versão</b><ul class="muted pequeno" style="margin:.3rem 0 0;padding-left:1.1rem">${info.novidades.map((n) => `<li>${h(n)}</li>`).join('')}</ul></div></div>` : ''}
      <p class="muted pequeno" style="margin:.4rem 0 0">Atualizar o app nunca apaga seus dados.</p>
    </div>
    <div class="card"><h3>💾 Dados</h3>
      <div class="opcao"><div><b>Onde os dados ficam</b><small>${db.modo === 'nuvem' ? '☁️ Na nuvem (Supabase) — acessíveis em qualquer aparelho.' : '📱 Neste aparelho. Faça backups com frequência.'}</small></div></div>
      <div class="opcao"><div><b>Backup</b><small>Baixe uma cópia ${db.modo === 'local' ? 'ou restaure um backup' : 'da sua progressão'}.</small></div>
        <div class="linha"><button class="btn btn-sm" id="btn-exportar">⬇ Exportar</button>${db.modo === 'local' ? '<label class="btn btn-sm">⬆ Importar<input type="file" accept="application/json" id="inp-importar" hidden></label>' : ''}</div></div>
    </div>
    <div class="card"><h3>📲 Aplicativo</h3>
      <div class="opcao"><div><b>Instalar na tela inicial</b><small>Use como aplicativo, mesmo sem internet.</small></div><button class="btn btn-sm" id="btn-instalar-cfg" ${eventoInstalar ? '' : 'disabled'}>${eventoInstalar ? 'Instalar' : (matchMedia('(display-mode: standalone)').matches ? 'Já instalado ✔' : 'Use o menu do navegador')}</button></div>
    </div>`;

  el.querySelectorAll('[data-pref]').forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    prefs[g.dataset.pref] = b.dataset.v; salvarPrefs(); aplicarPrefs();
    g.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }));
  $('#btn-pin-definir', el)?.addEventListener('click', definirPin);
  $('#btn-pin-remover', el)?.addEventListener('click', async () => {
    if (await confirmar('Remover PIN?', 'O app deixará de pedir o PIN neste aparelho.', 'Remover', true)) { localStorage.removeItem(PIN_CHAVE); toast('PIN removido.'); irPara('config'); }
  });
  $('#btn-verificar', el).onclick = async (e) => {
    e.target.disabled = true; e.target.textContent = 'Procurando…';
    const achou = await verificarAgora().catch(() => false);
    e.target.disabled = false; e.target.textContent = 'Procurar atualização';
    if (!achou) toast('Você já está na versão mais recente. ✔', 'ok');
  };
  $('#btn-notif', el)?.addEventListener('click', async () => { await pedirPermissaoNotificacao(); irPara('config'); });
  $('#sw-notif', el)?.addEventListener('change', (e) => { prefs.notificacoes = e.target.checked; salvarPrefs(); });
  $('#btn-exportar', el).onclick = async () => {
    try {
      const dados = await db.exportar();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }));
      a.download = `progressao-backup-${hoje()}.json`; a.click(); URL.revokeObjectURL(a.href);
    } catch (err) { erro(err); }
  };
  $('#inp-importar', el)?.addEventListener('change', async (e) => {
    const arq = e.target.files[0]; if (!arq) return;
    if (!(await confirmar('Restaurar backup?', 'Os dados atuais deste aparelho serão substituídos pelo backup (uma cópia de segurança é guardada).', 'Restaurar', true))) return;
    try { await db.importar(JSON.parse(await arq.text())); toast('Backup restaurado!', 'ok'); location.reload(); } catch (err) { erro(err); }
  });
  $('#btn-instalar-cfg', el).onclick = instalar;
}

function definirPin() {
  const d = modal(`<h3>Definir PIN</h3><p class="muted">Escolha 4 números. Ele será pedido ao abrir o app neste aparelho.</p>
    <form id="m-pin"><label class="campo"><span>Novo PIN</span><input class="input input-codigo" name="p1" inputmode="numeric" pattern="\\d{4}" maxlength="4" required></label>
    <label class="campo"><span>Repita o PIN</span><input class="input input-codigo" name="p2" inputmode="numeric" pattern="\\d{4}" maxlength="4" required></label>
    <div class="acoes"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn btn-primary">Salvar PIN</button></div></form>`);
  $('#m-pin', d).onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    if (f.get('p1') !== f.get('p2')) return toast('Os PINs não são iguais.', 'erro');
    localStorage.setItem(PIN_CHAVE, await hashPin(f.get('p1'))); d.close(); toast('PIN definido! 🔒', 'ok'); irPara('config');
  };
}

/* ============================================================ instalação */
let eventoInstalar = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); eventoInstalar = e;
  $('#btn-instalar').hidden = false;
});
window.addEventListener('appinstalled', () => { eventoInstalar = null; $('#btn-instalar').hidden = true; toast('Aplicativo instalado! 🎉', 'ok'); });
async function instalar() {
  if (!eventoInstalar) return toast('Use o menu do navegador → "Instalar app" / "Adicionar à tela inicial".');
  eventoInstalar.prompt(); await eventoInstalar.userChoice; eventoInstalar = null; $('#btn-instalar').hidden = true;
}

/* ================================================================== sair */
async function sair() {
  if (!(await confirmar('Sair da conta?', 'Seus dados continuam salvos.', 'Sair'))) return;
  pararNotificacoes();
  await db.sair(); S.eu = null; S.view = 'progresso'; S.monitor = { patrulhaId: null, alvo: null, progresso: {} };
  $('#aba-entrar').click(); mostrar('tela-auth');
}

/* ================================================================ início */
async function iniciar() {
  aplicarPrefs();
  iniciarAuth();
  $('#nav').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) { S.monitor.alvo = null; irPara(b.dataset.view); } });
  $('#btn-menu').onclick = () => $('#shell').classList.add('menu-aberto');
  $('#fundo-menu').onclick = () => $('#shell').classList.remove('menu-aberto');
  $('#btn-sair').onclick = sair;
  $('#btn-instalar').onclick = instalar;
  $('#btn-atualizar').onclick = () => { $('#btn-atualizar').disabled = true; $('#btn-atualizar').textContent = 'Atualizando…'; aplicarAtualizacao(); };
  $('#btn-depois').onclick = () => { $('#banner-atualizacao').hidden = true; };

  infoVersao().then((i) => { if (i) $('#versao-app').textContent = `Versão ${i.versao}`; });
  iniciarAtualizacoes((info) => {
    $('#banner-titulo').textContent = `Nova versão ${info?.versao ? 'v' + info.versao + ' ' : ''}disponível!`;
    $('#banner-novidades').innerHTML = (info?.novidades || []).slice(0, 4).map((n) => `<li>${h(n)}</li>`).join('');
    $('#banner-atualizacao').hidden = false;
  });

  try {
    await db.init();
    S.eu = await db.sessao();
  } catch (e) { erro(e); S.eu = null; }
  const abrir = new URLSearchParams(location.search).get('abrir');
  if (abrir && VIEWS[abrir]) S.view = abrir;
  if (S.eu) await entrarNoApp(); else mostrar('tela-auth');
}

iniciar();

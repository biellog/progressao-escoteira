/* =====================================================================
   Camada de banco de dados
   - LocalDB: salva no aparelho (localStorage), com migrações de versão
   - NuvemDB: Supabase (Postgres + Auth + Row Level Security)
   As duas expõem exatamente a mesma API assíncrona.
   ===================================================================== */
import { CONFIG } from './config.js';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function gerarCodigo(n = 6) {
  const a = crypto.getRandomValues(new Uint32Array(n));
  return Array.from(a, (x) => ALFABETO[x % ALFABETO.length]).join('');
}
const limpa = (s) => String(s || '').trim();
const normEmail = (e) => limpa(e).toLowerCase();
const normCodigo = (c) => limpa(c).toUpperCase();

class ErroApp extends Error {}
export { ErroApp };

/* --------------------------------------------------------------- LOCAL */
const CHAVE_DB = 'pe_db';
const CHAVE_SESSAO = 'pe_sessao';
const SCHEMA_ATUAL = 2;

async function hash(senha, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + senha));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Migrações do banco local: nunca apagam dados, só acrescentam campos. */
const MIGRACOES = {
  1: (db) => { db.usuarios ??= []; db.patrulhas ??= []; db.progresso ??= {}; },
  2: (db) => { db.usuarios.forEach((u) => { u.modalidade ??= 'basica'; }); },
};

class LocalDB {
  modo = 'local';

  _ler() {
    let db;
    try { db = JSON.parse(localStorage.getItem(CHAVE_DB)) || {}; } catch { db = {}; }
    const v = db.schema || 0;
    if (v < SCHEMA_ATUAL) {
      if (v > 0) localStorage.setItem(`${CHAVE_DB}_backup_v${v}`, JSON.stringify(db));
      for (let i = v + 1; i <= SCHEMA_ATUAL; i++) MIGRACOES[i]?.(db);
      db.schema = SCHEMA_ATUAL;
      this._gravar(db);
    }
    return db;
  }
  _gravar(db) { localStorage.setItem(CHAVE_DB, JSON.stringify(db)); }
  _perfil(u, db) {
    if (!u) return null;
    const { senhaHash, salt, ...p } = u;
    const pt = db.patrulhas.find((x) => x.id === p.patrulha_id);
    return { ...p, ehMonitor: !!pt && pt.monitor_id === p.id };
  }
  _eu(db) {
    const id = localStorage.getItem(CHAVE_SESSAO);
    const u = db.usuarios.find((x) => x.id === id);
    if (!u) throw new ErroApp('Sessão expirada. Entre novamente.');
    return u;
  }
  _exigeChefe(db) { const u = this._eu(db); if (u.papel !== 'chefe') throw new ErroApp('Apenas chefes podem fazer isso.'); return u; }
  _podeVer(db, alvoId) {
    const eu = this._eu(db);
    if (eu.id === alvoId || eu.papel === 'chefe') return true;
    const alvo = db.usuarios.find((x) => x.id === alvoId);
    const pt = alvo && db.patrulhas.find((p) => p.id === alvo.patrulha_id);
    return !!pt && pt.monitor_id === eu.id;
  }

  async init() {}
  async sessao() { const db = this._ler(); const id = localStorage.getItem(CHAVE_SESSAO); return this._perfil(db.usuarios.find((u) => u.id === id), db); }

  async entrar(email, senha) {
    const db = this._ler();
    const u = db.usuarios.find((x) => x.email === normEmail(email));
    if (!u || (await hash(senha, u.salt)) !== u.senhaHash) throw new ErroApp('E-mail ou senha incorretos.');
    localStorage.setItem(CHAVE_SESSAO, u.id);
    return this._perfil(u, db);
  }

  async cadastrar({ nome, email, senha, codigo }) {
    const db = this._ler();
    email = normEmail(email);
    if (!limpa(nome)) throw new ErroApp('Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new ErroApp('E-mail inválido.');
    if (String(senha).length < 6) throw new ErroApp('A senha precisa ter pelo menos 6 caracteres.');
    if (db.usuarios.some((u) => u.email === email)) throw new ErroApp('Já existe uma conta com esse e-mail.');
    if (!normCodigo(codigo)) throw new ErroApp('Informe o código de entrada (da patrulha ou de chefe).');
    // valida o código ANTES de criar a conta
    const chefe = CONFIG.CHEFES_LOCAIS.find((c) => c.email.toLowerCase() === email && normCodigo(c.codigo) === normCodigo(codigo));
    const pt = db.patrulhas.find((p) => p.codigo === normCodigo(codigo));
    if (!chefe && !pt) throw new ErroApp('Código de entrada inválido.');
    const salt = gerarCodigo(16);
    const u = {
      id: crypto.randomUUID(), nome: limpa(nome), email, salt, senhaHash: await hash(senha, salt),
      papel: chefe ? 'chefe' : 'escoteiro', patrulha_id: chefe ? null : pt.id,
      modalidade: 'basica', criado_em: new Date().toISOString(),
    };
    db.usuarios.push(u); this._gravar(db);
    localStorage.setItem(CHAVE_SESSAO, u.id);
    return this._perfil(u, db);
  }

  async sair() { localStorage.removeItem(CHAVE_SESSAO); }

  async aplicarCodigo(codigo) {
    const db = this._ler(); const u = this._eu(db);
    const c = normCodigo(codigo);
    const chefe = CONFIG.CHEFES_LOCAIS.find((x) => x.email.toLowerCase() === u.email && normCodigo(x.codigo) === c);
    if (chefe) { u.papel = 'chefe'; }
    else {
      const pt = db.patrulhas.find((p) => p.codigo === c);
      if (!pt) throw new ErroApp('Código de entrada inválido.');
      u.patrulha_id = pt.id;
    }
    this._gravar(db); return this._perfil(u, db);
  }

  async atualizarPerfil(dados) {
    const db = this._ler(); const u = this._eu(db);
    if (dados.nome !== undefined) { if (!limpa(dados.nome)) throw new ErroApp('Nome não pode ficar vazio.'); u.nome = limpa(dados.nome); }
    if (dados.modalidade) u.modalidade = dados.modalidade;
    this._gravar(db); return this._perfil(u, db);
  }

  async trocarSenha(atual, nova) {
    const db = this._ler(); const u = this._eu(db);
    if ((await hash(atual, u.salt)) !== u.senhaHash) throw new ErroApp('Senha atual incorreta.');
    if (String(nova).length < 6) throw new ErroApp('A nova senha precisa ter pelo menos 6 caracteres.');
    u.salt = gerarCodigo(16); u.senhaHash = await hash(nova, u.salt); this._gravar(db);
  }

  async getProgresso(userId) {
    const db = this._ler();
    if (!this._podeVer(db, userId)) throw new ErroApp('Sem permissão.');
    return { ...(db.progresso[userId] || {}) };
  }
  async progressoDeVarios(ids) {
    const db = this._ler(); const r = {};
    ids.forEach((id) => { if (this._podeVer(db, id)) r[id] = { ...(db.progresso[id] || {}) }; });
    return r;
  }
  async setItem(userId, itemId, data) {
    const db = this._ler(); const eu = this._eu(db);
    if (!this._podeVer(db, userId)) throw new ErroApp('Sem permissão.');
    db.progresso[userId] ??= {};
    if (data) db.progresso[userId][itemId] = { data, por: eu.id === userId ? null : eu.nome };
    else delete db.progresso[userId][itemId];
    this._gravar(db);
  }

  async listarPatrulhas() {
    const db = this._ler(); const eu = this._eu(db);
    const lista = eu.papel === 'chefe' ? db.patrulhas : db.patrulhas.filter((p) => p.id === eu.patrulha_id);
    return lista.map((p) => ({ ...p, membros: db.usuarios.filter((u) => u.patrulha_id === p.id).length }));
  }
  async membros(patrulhaId) {
    const db = this._ler(); const eu = this._eu(db);
    if (eu.papel !== 'chefe' && eu.patrulha_id !== patrulhaId) throw new ErroApp('Sem permissão.');
    return db.usuarios.filter((u) => u.patrulha_id === patrulhaId).map((u) => this._perfil(u, db)).sort((a, b) => a.nome.localeCompare(b.nome));
  }
  async semPatrulha() {
    const db = this._ler(); this._exigeChefe(db);
    return db.usuarios.filter((u) => !u.patrulha_id && u.papel !== 'chefe').map((u) => this._perfil(u, db));
  }
  async criarPatrulha(nome) {
    const db = this._ler(); const eu = this._exigeChefe(db);
    if (!limpa(nome)) throw new ErroApp('Dê um nome para a patrulha.');
    let codigo; do { codigo = gerarCodigo(); } while (db.patrulhas.some((p) => p.codigo === codigo));
    const p = { id: crypto.randomUUID(), nome: limpa(nome), codigo, chefe_id: eu.id, monitor_id: null, criado_em: new Date().toISOString() };
    db.patrulhas.push(p); this._gravar(db); return p;
  }
  async definirMonitor(patrulhaId, userId) {
    const db = this._ler(); this._exigeChefe(db);
    const p = db.patrulhas.find((x) => x.id === patrulhaId);
    if (userId && !db.usuarios.some((u) => u.id === userId && u.patrulha_id === patrulhaId)) throw new ErroApp('O monitor precisa ser membro da patrulha.');
    p.monitor_id = userId || null; this._gravar(db);
  }
  async moverMembro(userId, patrulhaId) {
    const db = this._ler(); this._exigeChefe(db);
    const u = db.usuarios.find((x) => x.id === userId);
    db.patrulhas.forEach((p) => { if (p.monitor_id === userId && p.id !== patrulhaId) p.monitor_id = null; });
    u.patrulha_id = patrulhaId || null; this._gravar(db);
  }
  async novoCodigo(patrulhaId) {
    const db = this._ler(); this._exigeChefe(db);
    const p = db.patrulhas.find((x) => x.id === patrulhaId); p.codigo = gerarCodigo(); this._gravar(db); return p.codigo;
  }
  async renomearPatrulha(patrulhaId, nome) {
    const db = this._ler(); this._exigeChefe(db);
    if (!limpa(nome)) throw new ErroApp('Nome inválido.');
    db.patrulhas.find((x) => x.id === patrulhaId).nome = limpa(nome); this._gravar(db);
  }
  async excluirPatrulha(patrulhaId) {
    const db = this._ler(); this._exigeChefe(db);
    db.usuarios.forEach((u) => { if (u.patrulha_id === patrulhaId) u.patrulha_id = null; });
    db.patrulhas = db.patrulhas.filter((p) => p.id !== patrulhaId); this._gravar(db);
  }

  /* Backup */
  async exportar() { return { app: 'progressao-escoteira', exportado_em: new Date().toISOString(), db: this._ler() }; }
  async importar(json) {
    if (!json?.db?.usuarios) throw new ErroApp('Arquivo de backup inválido.');
    localStorage.setItem(`${CHAVE_DB}_antes_import`, localStorage.getItem(CHAVE_DB) || '{}');
    this._gravar(json.db); this._ler();
  }
}

/* --------------------------------------------------------------- NUVEM */
class NuvemDB {
  modo = 'nuvem';
  sb = null;

  async init() {
    if (!window.supabase) {
      await new Promise((ok, falha) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
        s.onload = ok; s.onerror = () => falha(new ErroApp('Não foi possível carregar o Supabase. Verifique a internet.'));
        document.head.appendChild(s);
      });
    }
    this.sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'pe_auth' },
    });
  }
  _ok({ data, error }) {
    if (error) {
      const m = error.message || String(error);
      const traducoes = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'User already registered': 'Já existe uma conta com esse e-mail.',
        'Email not confirmed': 'Confirme seu e-mail (veja sua caixa de entrada) antes de entrar.',
      };
      throw new ErroApp(traducoes[m] || m);
    }
    return data;
  }
  async _uid() { const { data } = await this.sb.auth.getSession(); if (!data.session) throw new ErroApp('Sessão expirada. Entre novamente.'); return data.session.user.id; }
  async _perfilDe(id) {
    const p = this._ok(await this.sb.from('perfis').select('*, patrulha:patrulhas(monitor_id)').eq('id', id).single());
    const { patrulha, ...resto } = p;
    return { ...resto, ehMonitor: patrulha?.monitor_id === id };
  }

  async sessao() {
    const { data } = await this.sb.auth.getSession();
    if (!data.session) return null;
    await this._aplicarPendente();
    return this._perfilDe(data.session.user.id);
  }
  async entrar(email, senha) {
    const d = this._ok(await this.sb.auth.signInWithPassword({ email: normEmail(email), password: senha }));
    await this._aplicarPendente();
    return this._perfilDe(d.user.id);
  }
  async _aplicarPendente() {
    const cod = localStorage.getItem('pe_codigo_pendente');
    if (!cod) return;
    localStorage.removeItem('pe_codigo_pendente');
    try { await this.aplicarCodigo(cod); } catch (e) { console.warn('Código pendente não aplicado:', e.message); }
  }
  async cadastrar({ nome, email, senha, codigo }) {
    if (!limpa(nome)) throw new ErroApp('Informe seu nome.');
    if (!normCodigo(codigo)) throw new ErroApp('Informe o código de entrada (da patrulha ou de chefe).');
    // valida o código antes de criar a conta
    const valido = this._ok(await this.sb.rpc('codigo_valido', { p_email: normEmail(email), p_codigo: normCodigo(codigo) }));
    if (!valido) throw new ErroApp('Código de entrada inválido.');
    const d = this._ok(await this.sb.auth.signUp({ email: normEmail(email), password: senha, options: { data: { nome: limpa(nome) } } }));
    localStorage.setItem('pe_codigo_pendente', normCodigo(codigo));
    if (!d.session) return { confirmarEmail: true };
    await this._aplicarPendente();
    return this._perfilDe(d.user.id);
  }
  async sair() { await this.sb.auth.signOut(); }
  async aplicarCodigo(codigo) {
    this._ok(await this.sb.rpc('aplicar_codigo', { p_codigo: normCodigo(codigo) }));
    return this._perfilDe(await this._uid());
  }
  async atualizarPerfil(dados) {
    const id = await this._uid(); const up = {};
    if (dados.nome !== undefined) { if (!limpa(dados.nome)) throw new ErroApp('Nome não pode ficar vazio.'); up.nome = limpa(dados.nome); }
    if (dados.modalidade) up.modalidade = dados.modalidade;
    this._ok(await this.sb.from('perfis').update(up).eq('id', id));
    return this._perfilDe(id);
  }
  async trocarSenha(atual, nova) {
    const { data } = await this.sb.auth.getSession();
    this._ok(await this.sb.auth.signInWithPassword({ email: data.session.user.email, password: atual }));
    if (String(nova).length < 6) throw new ErroApp('A nova senha precisa ter pelo menos 6 caracteres.');
    this._ok(await this.sb.auth.updateUser({ password: nova }));
  }
  _mapa(rows) { const m = {}; rows.forEach((r) => { m[r.item_id] = { data: r.data, por: r.validado_por_nome || null }; }); return m; }
  async getProgresso(userId) {
    return this._mapa(this._ok(await this.sb.from('progresso').select('item_id,data,validado_por_nome').eq('user_id', userId)));
  }
  async progressoDeVarios(ids) {
    if (!ids.length) return {};
    const rows = this._ok(await this.sb.from('progresso').select('user_id,item_id,data,validado_por_nome').in('user_id', ids));
    const r = {}; ids.forEach((id) => { r[id] = this._mapa(rows.filter((x) => x.user_id === id)); }); return r;
  }
  async setItem(userId, itemId, data) {
    if (data) this._ok(await this.sb.rpc('marcar_item', { p_user: userId, p_item: itemId, p_data: data }));
    else this._ok(await this.sb.from('progresso').delete().eq('user_id', userId).eq('item_id', itemId));
  }
  async listarPatrulhas() {
    const rows = this._ok(await this.sb.from('patrulhas').select('*, perfis!perfis_patrulha_id_fkey(count)').order('nome'));
    return rows.map(({ perfis, ...p }) => ({ ...p, membros: perfis?.[0]?.count ?? 0 }));
  }
  async membros(patrulhaId) {
    const pt = this._ok(await this.sb.from('patrulhas').select('monitor_id').eq('id', patrulhaId).single());
    const rows = this._ok(await this.sb.from('perfis').select('*').eq('patrulha_id', patrulhaId).order('nome'));
    return rows.map((p) => ({ ...p, ehMonitor: pt.monitor_id === p.id }));
  }
  async semPatrulha() {
    return this._ok(await this.sb.from('perfis').select('*').is('patrulha_id', null).neq('papel', 'chefe').order('nome'));
  }
  async criarPatrulha(nome) {
    if (!limpa(nome)) throw new ErroApp('Dê um nome para a patrulha.');
    return this._ok(await this.sb.rpc('criar_patrulha', { p_nome: limpa(nome) }));
  }
  async definirMonitor(patrulhaId, userId) { this._ok(await this.sb.rpc('definir_monitor', { p_patrulha: patrulhaId, p_user: userId || null })); }
  async moverMembro(userId, patrulhaId) { this._ok(await this.sb.rpc('mover_membro', { p_user: userId, p_patrulha: patrulhaId || null })); }
  async novoCodigo(patrulhaId) { return this._ok(await this.sb.rpc('novo_codigo', { p_patrulha: patrulhaId })); }
  async renomearPatrulha(patrulhaId, nome) { this._ok(await this.sb.from('patrulhas').update({ nome: limpa(nome) }).eq('id', patrulhaId)); }
  async excluirPatrulha(patrulhaId) { this._ok(await this.sb.from('patrulhas').delete().eq('id', patrulhaId)); }
  async exportar() {
    const eu = await this._perfilDe(await this._uid());
    return { app: 'progressao-escoteira', exportado_em: new Date().toISOString(), perfil: eu, progresso: await this.getProgresso(eu.id) };
  }
  async importar() { throw new ErroApp('No modo nuvem os dados já ficam salvos no servidor.'); }
}

export const db = CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY ? new NuvemDB() : new LocalDB();

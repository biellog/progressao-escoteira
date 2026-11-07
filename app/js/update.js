/* =====================================================================
   Atualizações automáticas (Service Worker)
   - Detecta quando uma nova versão foi publicada no GitHub Pages
   - Mostra uma notificação (banner + notificação do sistema, se permitido)
   - Ao atualizar, faz um backup local e troca apenas os ARQUIVOS do app:
     os dados (localStorage / Supabase) nunca são apagados.
   ===================================================================== */
import { CONFIG } from './config.js';

let registro = null;
let workerEsperando = null;

export async function infoVersao() {
  try {
    const r = await fetch('./version.json', { cache: 'no-store' });
    return await r.json();
  } catch { return null; }
}

export async function iniciarAtualizacoes(aoTerNovaVersao) {
  if (!('serviceWorker' in navigator)) return null;
  try {
    registro = await navigator.serviceWorker.register('./sw.js');
  } catch (e) { console.warn('Service worker não registrado:', e); return null; }

  const avisar = async (w) => {
    workerEsperando = w;
    const info = await infoVersao();
    aoTerNovaVersao(info);
    notificarSistema(info);
  };

  if (registro.waiting && navigator.serviceWorker.controller) avisar(registro.waiting);
  registro.addEventListener('updatefound', () => {
    const w = registro.installing;
    w?.addEventListener('statechange', () => {
      if (w.state === 'installed' && navigator.serviceWorker.controller) avisar(w);
    });
  });

  let recarregando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (recarregando) return;
    recarregando = true;
    location.reload();
  });

  const verificar = () => registro.update().catch(() => {});
  setInterval(verificar, CONFIG.INTERVALO_ATUALIZACAO_MIN * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verificar(); });
  return registro;
}

/** Procura atualização agora. Retorna true se encontrou. */
export async function verificarAgora() {
  if (!registro) return false;
  await registro.update();
  await new Promise((r) => setTimeout(r, 1500));
  return !!(registro.waiting || registro.installing || workerEsperando);
}

export function aplicarAtualizacao() {
  // backup de segurança antes de trocar de versão
  try {
    const dados = localStorage.getItem('pe_db');
    if (dados) localStorage.setItem('pe_db_backup_pre_atualizacao', dados);
  } catch {}
  const w = workerEsperando || registro?.waiting;
  if (w) w.postMessage({ tipo: 'ATUALIZAR' });
  else location.reload();
}

async function notificarSistema(info) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const prefs = JSON.parse(localStorage.getItem('pe_prefs') || '{}');
  if (prefs.notificacoes === false) return;
  const corpo = info?.novidades?.length ? info.novidades.slice(0, 3).join(' • ') : 'Toque para atualizar. Seus dados continuam salvos.';
  try {
    await registro.showNotification(`Nova versão ${info?.versao ?? ''} disponível`.trim(), {
      body: corpo, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: 'atualizacao',
    });
  } catch {}
}

export async function pedirPermissaoNotificacao() {
  if (!('Notification' in window)) return 'indisponivel';
  return Notification.requestPermission();
}

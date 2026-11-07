// Mostra a versão atual e o histórico de novidades (lidos do próprio app)
(async function () {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const card = document.getElementById('novidades-card');
  try {
    const [atual, hist] = await Promise.all([
      fetch('app/version.json', { cache: 'no-store' }).then((r) => r.json()),
      fetch('changelog.json', { cache: 'no-store' }).then((r) => r.json()).catch(() => []),
    ]);
    document.getElementById('pilula-versao').textContent = `Versão ${atual.versao} · Ramo Escoteiro 2026`;
    const versoes = hist.length ? hist : [atual];
    card.innerHTML = versoes.map((v) => `<div class="versao-item"><h3>v${esc(v.versao)} <small>${new Date(v.data + 'T12:00:00').toLocaleDateString('pt-BR')}</small></h3>
      <ul>${(v.novidades || []).map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>`).join('');
  } catch {
    card.innerHTML = '<p class="sub">Não foi possível carregar as novidades.</p>';
  }

  // link para o repositório: https://USUARIO.github.io/REPO → https://github.com/USUARIO/REPO
  const m = location.hostname.match(/^([^.]+)\.github\.io$/);
  const link = document.getElementById('link-github');
  if (m) link.href = `https://github.com/${m[1]}/${location.pathname.split('/')[1] || ''}`;
  else link.removeAttribute('href');
})();

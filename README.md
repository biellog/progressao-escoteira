# 🏕️ Progressão Escoteira – Ramo Escoteiro 2026

Aplicativo (PWA instalável) + site de download para acompanhar a **Progressão do Ramo Escoteiro 2026**:
Período de Acolhida, 4 Eixos e 18 Blocos, com ações fixas, variáveis e alternativas ("OU").

| Recurso | |
|---|---|
| 🔐 Login e cadastro | Cada cadastro exige um **código de entrada** (da patrulha ou de chefe) |
| 🌙 Modo escuro | Padrão. Também há tema claro e texto grande/extra |
| 📚 Painel lateral | Minha Progressão · Painel do Monitor · Patrulhas · Minha Conta · Configurações |
| 🧑‍🤝‍🧑 Painel do Monitor | O monitor vê **e marca** todos os itens de cada membro da patrulha dele |
| 🏕️ Patrulhas | **Somente o chefe** cria patrulhas, gera códigos, define monitor e move membros |
| 🔒 PIN | PIN opcional de 4 dígitos para abrir o app no aparelho |
| 🔔 Atualizações | Ao publicar uma versão nova, o app mostra uma notificação "Atualizar agora" — **sem perder dados** |
| 📴 Offline | Funciona sem internet depois de aberto uma vez |

```
index.html, site/        → site de download (página inicial do GitHub Pages)
app/                     → o aplicativo (PWA)
  js/data.js             → conteúdo da progressão (transcrito do PDF)
  js/db.js               → banco de dados (modo local ou Supabase)
  js/config.js           → configurações (Supabase, chefes do modo local)
  sw.js                  → service worker (offline + atualizações)
  version.json           → versão atual e novidades
supabase/schema.sql      → banco de dados na nuvem (tabelas + segurança)
scripts/nova-versao.mjs  → publica uma nova versão
.github/workflows/       → publicação automática no GitHub Pages
```

---

## 1. Publicar no GitHub (site + app)

1. Crie um repositório no GitHub (ex.: `progressao-escoteira`) e envie estes arquivos:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/progressao-escoteira.git
   git push -u origin main
   ```
2. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Pronto. A cada `push` na `main`, o site é publicado em
   `https://SEU-USUARIO.github.io/progressao-escoteira/` e o app em `.../progressao-escoteira/app/`.

## 2. Banco de dados compartilhado (Supabase – grátis)

Sem configurar nada, o app roda em **modo local**: os dados ficam só no aparelho
(bom para testar). Para que monitor e chefe vejam os dados de todos, ative o **modo nuvem**:

1. Crie um projeto em <https://supabase.com>.
2. **SQL Editor** → cole o arquivo [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   - Antes de rodar, troque o código `CHEFE-2026` pelo seu código secreto de chefe.
   - Para adicionar mais chefes depois:
     ```sql
     insert into chefes_autorizados (email, codigo) values ('outro.chefe@gmail.com', 'CODIGO-SECRETO');
     ```
3. **Authentication → Sign In / Providers → Email**: se quiser que a conta funcione na hora,
   desative *Confirm email* (senão o usuário precisa confirmar o e-mail antes de entrar).
4. **Project Settings → API**: copie a *Project URL* e a *anon public key*.
5. No GitHub: **Settings → Secrets and variables → Actions → aba Variables** → crie
   `SUPABASE_URL` e `SUPABASE_ANON_KEY`. No próximo `push` o app entra em modo nuvem.
   (A *anon key* é pública por natureza; a segurança vem das regras RLS do `schema.sql`.)

### Quem pode o quê

| | Escoteiro | Monitor | Chefe |
|---|:-:|:-:|:-:|
| Marcar a própria progressão | ✅ | ✅ | ✅ |
| Ver e marcar itens dos membros da **sua** patrulha | – | ✅ | ✅ |
| Ver todas as patrulhas | – | – | ✅ |
| Criar/excluir patrulha, gerar código, definir monitor | – | – | ✅ |

- **Chefe**: cria a conta com o e-mail autorizado (ex.: `chefe@gmail.com`) + o código de chefe.
- **Escoteiro**: cria a conta com o **código de entrada da patrulha** (o chefe vê e compartilha esse código).
- **Monitor**: o chefe escolhe um membro da patrulha como monitor na tela *Patrulhas*.

## 3. Lançar uma atualização

```bash
node scripts/nova-versao.mjs 1.1.0 "O que mudou" "Outra novidade"
git add -A && git commit -m "v1.1.0" && git push
```

Quem estiver com o app aberto ou instalado recebe o aviso **"🔔 Nova versão disponível — Atualizar agora"**
(e uma notificação do sistema, se tiver ativado em Configurações). Ao atualizar:

- só os **arquivos do app** são trocados; os dados ficam no `localStorage`/Supabase e não são tocados;
- antes de trocar, é feito um backup local (`pe_db_backup_pre_atualizacao`);
- o banco local tem **migrações** versionadas (`MIGRACOES` em `db.js`) que só acrescentam campos.

> ⚠️ Ao editar `app/js/data.js`, **não remova nem reordene itens** — os IDs dos itens vêm da posição.
> Acrescente itens novos sempre no final da lista.

## 4. Testar no computador

```bash
python3 -m http.server 8000
```
Abra <http://localhost:8000/> (site) ou <http://localhost:8000/app/> (app).
No modo local, o chefe de teste é `chefe@gmail.com` com o código `CHEFE-2026` (em `app/js/config.js`).

## 5. Quero um APK (Android)

O app já instala direto pelo navegador. Se quiser um arquivo `.apk` para distribuir, depois de publicar
abra <https://www.pwabuilder.com>, cole o endereço do app (`.../app/`) e gere o pacote Android.

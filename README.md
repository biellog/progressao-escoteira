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

## 2.1 Especialidades e Insígnias (versão 1.1)

- Itens da progressão que pedem **especialidade** ou **insígnia** (as linhas ★, as alternativas "OU" e os itens
  "Conquistar…") **não podem ser marcados direto**: o escoteiro envia o relatório (PDF, fotos, vídeos ou
  documentos – até 5 arquivos de 10 MB) e o item fica "⏳ aguardando avaliação".
- O **monitor** da patrulha (ou um chefe) recebe a notificação, abre os arquivos na tela **Avaliações** e
  aprova ou recusa com um comentário. Ao aprovar, o item é marcado automaticamente na progressão.
- Telas **Especialidades** e **Insígnias**: histórico de envios; também dá para enviar conquistas sem vínculo com um item.
- O monitor não avalia os próprios envios — esses vão para o chefe.

**Quem já tinha o banco criado** precisa rodar uma vez no Supabase → SQL Editor o arquivo
[`supabase/atualizacao-1.1.sql`](supabase/atualizacao-1.1.sql) (cria a tabela `envios`, o armazenamento
privado `relatorios` para os arquivos e as regras de segurança). Instalações novas: o `schema.sql` já inclui tudo.

**Notificações:** chegam como aviso no app, número vermelho no menu (e no ícone do app instalado) e
notificação do sistema (ative em *Configurações → Notificações do sistema*). Elas são verificadas em tempo
real enquanto o app está aberto ou em segundo plano e sempre que ele é aberto. Com o app totalmente fechado,
o aviso aparece na próxima vez que ele for aberto.

> No **modo local** os arquivos ficam só no aparelho, então o monitor só vê envios feitos no mesmo aparelho.
> Para uso real da patrulha, use o modo nuvem (Supabase).

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

## 5. APK para Android

O APK é gerado **automaticamente pelo GitHub Actions** (workflow `Gerar APK Android`) sempre que a
versão muda (`app/version.json`), e publicado na página **Releases**. Link fixo para a versão mais recente:

`https://github.com/biellog/progressao-escoteira/releases/latest/download/progressao-escoteira.apk`

- O APK é uma casca Android ([Capacitor](https://capacitorjs.com), pasta `android/`) que abre o app
  publicado no GitHub Pages. Por isso ele **se atualiza sozinho** com o aviso "Nova versão disponível" —
  não é preciso baixar um APK novo a cada mudança.
- Para gerar manualmente: aba **Actions → Gerar APK Android → Run workflow**.

### Chave de assinatura (importante)
O Android só aceita atualizar um APK se ele for assinado com a **mesma chave**. Cadastre em
**Settings → Secrets and variables → Actions → Secrets**:

| Secret | Conteúdo |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | arquivo `.jks` em base64 (`base64 -w0 progressao.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | senha do arquivo `.jks` |

Para criar uma chave nova: `keytool -genkeypair -keystore progressao.jks -alias progressao -keyalg RSA -keysize 2048 -validity 10000`.
Guarde o `.jks` e a senha em lugar seguro — **nunca** faça commit deles. Sem esses secrets o workflow
usa uma chave temporária (funciona, mas cada APK novo exigirá desinstalar o anterior).

-- =====================================================================
--  Progressão Escoteira – banco de dados (Supabase / PostgreSQL)
--  Como usar: Supabase → SQL Editor → cole este arquivo inteiro → Run.
--  O script pode ser executado mais de uma vez sem perder dados.
-- =====================================================================

-- ---------------------------------------------------------------- TABELAS
create table if not exists public.chefes_autorizados (
  email  text primary key,          -- e-mail do chefe (minúsculo)
  codigo text not null              -- código de entrada de segurança do chefe
);

create table if not exists public.patrulhas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  codigo     text not null unique,  -- código de entrada para os escoteiros
  chefe_id   uuid references auth.users on delete set null,
  monitor_id uuid references auth.users on delete set null,
  criado_em  timestamptz not null default now()
);

create table if not exists public.perfis (
  id          uuid primary key references auth.users on delete cascade,
  nome        text not null default '',
  email       text not null,
  papel       text not null default 'escoteiro' check (papel in ('escoteiro','chefe')),
  patrulha_id uuid,
  modalidade  text not null default 'basica' check (modalidade in ('basica','ar','mar')),
  criado_em   timestamptz not null default now()
);
do $$ begin
  alter table public.perfis add constraint perfis_patrulha_id_fkey
    foreign key (patrulha_id) references public.patrulhas(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.progresso (
  user_id           uuid not null references auth.users on delete cascade,
  item_id           text not null,
  data              date not null default current_date,
  validado_por      uuid references auth.users on delete set null,
  validado_por_nome text,
  atualizado_em     timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- ------------------------------------------------- CHEFES (edite aqui!)
-- Troque o código abaixo por um código secreto seu.
insert into public.chefes_autorizados (email, codigo)
values ('chefe@gmail.com', 'CHEFE-2026')
on conflict (email) do nothing;

-- ------------------------------------------------------ FUNÇÕES DE APOIO
create or replace function public.eh_chefe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and papel = 'chefe');
$$;

create or replace function public.minha_patrulha() returns uuid
language sql stable security definer set search_path = public as $$
  select patrulha_id from perfis where id = auth.uid();
$$;

-- o usuário logado é monitor da patrulha de "alvo"?
create or replace function public.eh_monitor_de(alvo uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from perfis p join patrulhas pt on pt.id = p.patrulha_id
    where p.id = alvo and pt.monitor_id = auth.uid());
$$;

-- cria o perfil automaticamente quando alguém se cadastra
create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfis (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''), lower(new.email))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.novo_usuario();

-- ---------------------------------------------------------------- RPCs
-- Verifica um código de entrada antes do cadastro (não revela qual é qual)
create or replace function public.codigo_valido(p_email text, p_codigo text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from chefes_autorizados where email = lower(p_email) and upper(codigo) = upper(p_codigo))
      or exists (select 1 from patrulhas where codigo = upper(p_codigo));
$$;

-- Aplica um código: código de chefe → vira chefe; código de patrulha → entra na patrulha
create or replace function public.aplicar_codigo(p_codigo text) returns void
language plpgsql security definer set search_path = public as $$
declare v_pt uuid;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if exists (select 1 from chefes_autorizados
             where email = lower(auth.email()) and upper(codigo) = upper(p_codigo)) then
    update perfis set papel = 'chefe' where id = auth.uid();
    return;
  end if;
  select id into v_pt from patrulhas where codigo = upper(p_codigo);
  if v_pt is null then raise exception 'Código de entrada inválido.'; end if;
  update patrulhas set monitor_id = null where monitor_id = auth.uid() and id <> v_pt;
  update perfis set patrulha_id = v_pt where id = auth.uid();
end $$;

create or replace function public.criar_patrulha(p_nome text) returns patrulhas
language plpgsql security definer set search_path = public as $$
declare v patrulhas; v_cod text;
begin
  if not eh_chefe() then raise exception 'Apenas chefes podem criar patrulhas.'; end if;
  loop
    v_cod := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from patrulhas where codigo = v_cod);
  end loop;
  insert into patrulhas (nome, codigo, chefe_id) values (trim(p_nome), v_cod, auth.uid()) returning * into v;
  return v;
end $$;

create or replace function public.novo_codigo(p_patrulha uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_cod text;
begin
  if not eh_chefe() then raise exception 'Apenas chefes.'; end if;
  loop
    v_cod := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from patrulhas where codigo = v_cod);
  end loop;
  update patrulhas set codigo = v_cod where id = p_patrulha;
  return v_cod;
end $$;

create or replace function public.definir_monitor(p_patrulha uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not eh_chefe() then raise exception 'Apenas chefes.'; end if;
  if p_user is not null and not exists (select 1 from perfis where id = p_user and patrulha_id = p_patrulha) then
    raise exception 'O monitor precisa ser membro da patrulha.';
  end if;
  update patrulhas set monitor_id = p_user where id = p_patrulha;
end $$;

create or replace function public.mover_membro(p_user uuid, p_patrulha uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not eh_chefe() then raise exception 'Apenas chefes.'; end if;
  update patrulhas set monitor_id = null where monitor_id = p_user and id is distinct from p_patrulha;
  update perfis set patrulha_id = p_patrulha where id = p_user;
end $$;

-- marca um item (o próprio escoteiro, o monitor da patrulha ou um chefe)
create or replace function public.marcar_item(p_user uuid, p_item text, p_data date) returns void
language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  if not (p_user = auth.uid() or eh_chefe() or eh_monitor_de(p_user)) then
    raise exception 'Sem permissão.';
  end if;
  if p_user <> auth.uid() then select nome into v_nome from perfis where id = auth.uid(); end if;
  insert into progresso (user_id, item_id, data, validado_por, validado_por_nome, atualizado_em)
  values (p_user, p_item, coalesce(p_data, current_date),
          case when p_user <> auth.uid() then auth.uid() end, v_nome, now())
  on conflict (user_id, item_id) do update
    set data = excluded.data, validado_por = excluded.validado_por,
        validado_por_nome = excluded.validado_por_nome, atualizado_em = now();
end $$;

-- ----------------------------------------------- SEGURANÇA (RLS)
alter table public.chefes_autorizados enable row level security;  -- sem políticas = ninguém lê pela API
alter table public.patrulhas          enable row level security;
alter table public.perfis             enable row level security;
alter table public.progresso          enable row level security;

drop policy if exists "ver patrulhas"      on public.patrulhas;
drop policy if exists "chefe edita"        on public.patrulhas;
drop policy if exists "chefe exclui"       on public.patrulhas;
create policy "ver patrulhas" on public.patrulhas for select to authenticated
  using (eh_chefe() or id = minha_patrulha());
create policy "chefe edita"   on public.patrulhas for update to authenticated using (eh_chefe()) with check (eh_chefe());
create policy "chefe exclui"  on public.patrulhas for delete to authenticated using (eh_chefe());

drop policy if exists "ver perfis"     on public.perfis;
drop policy if exists "editar proprio" on public.perfis;
create policy "ver perfis" on public.perfis for select to authenticated
  using (id = auth.uid() or eh_chefe() or patrulha_id = minha_patrulha());
create policy "editar proprio" on public.perfis for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- só nome e modalidade podem ser alterados diretamente (papel/patrulha só via RPC)
revoke update on public.perfis from authenticated, anon;
grant update (nome, modalidade) on public.perfis to authenticated;

drop policy if exists "ver progresso"    on public.progresso;
drop policy if exists "apagar progresso" on public.progresso;
create policy "ver progresso" on public.progresso for select to authenticated
  using (user_id = auth.uid() or eh_chefe() or eh_monitor_de(user_id));
create policy "apagar progresso" on public.progresso for delete to authenticated
  using (user_id = auth.uid() or eh_chefe() or eh_monitor_de(user_id));

grant execute on function public.codigo_valido(text, text) to anon, authenticated;

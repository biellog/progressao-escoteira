-- =====================================================================
--  Atualização 1.1 – Especialidades e Insígnias (envio de relatório)
--  Rode UMA vez no Supabase → SQL Editor (pode rodar de novo sem problema).
--  Já está incluída no schema.sql para instalações novas.
-- =====================================================================

-- Itens da progressão que só podem ser marcados com envio aprovado
create or replace function public.item_exige_envio(p_item text) returns boolean
language sql immutable as $$
  select p_item = any (array['e1b1f1','e1b1v8','e1b1ou','e1b2ou','e1b3ou','e2b1v13','e2b1ou','e2b2v9','e2b2ou','e2b3v11','e2b3ou','e2b4v10','e2b4ou','e3b1v5','e3b1ou','e3b2v5','e3b3v13','e3b3ou','e3b4v9','e3b4ou','e3b5v6','e3b5ou','e4b1v9','e4b1ou','e4b2ou','e4b3v9','e4b3ou','e4b4v6','e4b4ou','e4b5ou']);
$$;

create table if not exists public.envios (
  id                uuid primary key,
  user_id           uuid not null references auth.users on delete cascade,
  tipo              text not null check (tipo in ('especialidade','insignia')),
  nome              text not null,
  nivel             int check (nivel between 1 and 3),
  item_id           text,
  relatorio         text not null default '',
  arquivos          jsonb not null default '[]',
  status            text not null default 'pendente' check (status in ('pendente','aprovado','recusado')),
  comentario        text,
  avaliado_por      uuid references auth.users on delete set null,
  avaliado_por_nome text,
  criado_em         timestamptz not null default now(),
  avaliado_em       timestamptz
);
create index if not exists envios_user_idx on public.envios (user_id);
create index if not exists envios_status_idx on public.envios (status);

alter table public.envios enable row level security;
drop policy if exists "ver envios"    on public.envios;
drop policy if exists "criar envio"   on public.envios;
drop policy if exists "apagar envio"  on public.envios;
create policy "ver envios" on public.envios for select to authenticated
  using (user_id = auth.uid() or eh_chefe() or eh_monitor_de(user_id));
create policy "criar envio" on public.envios for insert to authenticated
  with check (user_id = auth.uid() and status = 'pendente' and avaliado_por is null);
create policy "apagar envio" on public.envios for delete to authenticated
  using (user_id = auth.uid() and status = 'pendente');

-- Monitor (da patrulha, não o próprio) ou chefe aprova/recusa.
-- Ao aprovar, o item vinculado é marcado na progressão.
create or replace function public.avaliar_envio(p_envio uuid, p_aprovado boolean, p_comentario text)
returns void language plpgsql security definer set search_path = public as $$
declare v envios; v_nome text;
begin
  select * into v from envios where id = p_envio;
  if v.id is null then raise exception 'Envio não encontrado.'; end if;
  if not (eh_chefe() or (eh_monitor_de(v.user_id) and v.user_id <> auth.uid())) then
    raise exception 'Apenas o monitor da patrulha ou um chefe pode avaliar.';
  end if;
  select nome into v_nome from perfis where id = auth.uid();
  update envios set status = case when p_aprovado then 'aprovado' else 'recusado' end,
    comentario = nullif(trim(p_comentario), ''), avaliado_por = auth.uid(),
    avaliado_por_nome = v_nome, avaliado_em = now()
  where id = p_envio;
  if v.item_id is not null then
    if p_aprovado then
      insert into progresso (user_id, item_id, data, validado_por, validado_por_nome, atualizado_em)
      values (v.user_id, v.item_id, current_date, auth.uid(), v_nome, now())
      on conflict (user_id, item_id) do update
        set data = current_date, validado_por = auth.uid(), validado_por_nome = v_nome, atualizado_em = now();
    else
      delete from progresso where user_id = v.user_id and item_id = v.item_id;
    end if;
  end if;
end $$;

-- O próprio escoteiro não marca sozinho itens que exigem envio
create or replace function public.marcar_item(p_user uuid, p_item text, p_data date) returns void
language plpgsql security definer set search_path = public as $$
declare v_nome text;
begin
  if not (p_user = auth.uid() or eh_chefe() or eh_monitor_de(p_user)) then
    raise exception 'Sem permissão.';
  end if;
  if item_exige_envio(p_item) and not exists (
       select 1 from progresso where user_id = p_user and item_id = p_item) then
    raise exception 'Este item precisa do envio do relatório e da aprovação do monitor.';
  end if;
  if p_user <> auth.uid() then select nome into v_nome from perfis where id = auth.uid(); end if;
  insert into progresso (user_id, item_id, data, validado_por, validado_por_nome, atualizado_em)
  values (p_user, p_item, coalesce(p_data, current_date),
          case when p_user <> auth.uid() then auth.uid() end, v_nome, now())
  on conflict (user_id, item_id) do update
    set data = excluded.data,
        validado_por = coalesce(excluded.validado_por, progresso.validado_por),
        validado_por_nome = coalesce(excluded.validado_por_nome, progresso.validado_por_nome),
        atualizado_em = now();
end $$;

-- Arquivos (PDF, imagens, etc.) – bucket privado, máx. 10 MB por arquivo
insert into storage.buckets (id, name, public, file_size_limit)
values ('relatorios', 'relatorios', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "relatorios enviar" on storage.objects;
drop policy if exists "relatorios ver"    on storage.objects;
drop policy if exists "relatorios apagar" on storage.objects;
create policy "relatorios enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'relatorios' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "relatorios ver" on storage.objects for select to authenticated
  using (bucket_id = 'relatorios' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.eh_chefe()
    or public.eh_monitor_de(((storage.foldername(name))[1])::uuid)));
create policy "relatorios apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'relatorios' and (storage.foldername(name))[1] = auth.uid()::text);

-- Notificações em tempo real para o monitor
do $$ begin
  alter publication supabase_realtime add table public.envios;
exception when duplicate_object or undefined_object then null; end $$;

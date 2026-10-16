/* ==========================================================================
   ACCOUNT · Supabase (facoltativo)
   Senza configurazione TOYO resta com'è: dati solo su questo dispositivo.
   Con URL e chiave del progetto, le persone si registrano e i dati le seguono
   su ogni dispositivo. La sincronia salva tutto il documento dell'utente.
   ========================================================================== */
const SQL_SETUP = `-- TOYO · da incollare nell'SQL Editor di Supabase.
-- Si può rilanciare quante volte si vuole: ogni regola viene prima rimossa e
-- poi ricreata, così aggiornare non dà mai "policy already exists".

create table if not exists toyo_dati (
  utente     uuid primary key references auth.users on delete cascade,
  dati       jsonb not null default '{}'::jsonb,
  aggiornato timestamptz default now()
);

alter table toyo_dati enable row level security;

drop policy if exists "ognuno vede solo i suoi dati" on toyo_dati;
drop policy if exists "ognuno scrive solo i suoi dati" on toyo_dati;
drop policy if exists "ognuno aggiorna solo i suoi dati" on toyo_dati;
drop policy if exists "ognuno cancella solo i suoi dati" on toyo_dati;

create policy "ognuno vede solo i suoi dati" on toyo_dati
  for select to authenticated using (utente = auth.uid());
create policy "ognuno scrive solo i suoi dati" on toyo_dati
  for insert to authenticated with check (utente = auth.uid());
create policy "ognuno aggiorna solo i suoi dati" on toyo_dati
  for update to authenticated using (utente = auth.uid()) with check (utente = auth.uid());
create policy "ognuno cancella solo i suoi dati" on toyo_dati
  for delete to authenticated using (utente = auth.uid());

-- ==========================================================================
-- RUBRICA · serve solo a trovare le persone per nome utente quando si invita.
-- Contiene il minimo indispensabile: nome utente, nome e cognome. Niente email
-- (qui non ne esistono), niente viaggi, niente documenti.
-- ==========================================================================
create table if not exists toyo_profili (
  utente  uuid primary key references auth.users on delete cascade,
  nick    text unique not null,
  nome    text default '',
  cognome text default ''
);
alter table toyo_profili enable row level security;

drop policy if exists "la rubrica è consultabile" on toyo_profili;
drop policy if exists "vedo solo la mia scheda" on toyo_profili;
drop policy if exists "scrivo solo la mia scheda" on toyo_profili;
drop policy if exists "aggiorno solo la mia scheda" on toyo_profili;

-- ⚠️ La rubrica NON è leggibile in blocco. Con una select libera bastava una
-- richiesta per portarsi via nome utente, nome e cognome di ogni iscritto — e
-- la chiave pubblica sta nel file su GitHub, quindi il prerequisito
-- "autenticato" è gratuito. Si cerca una persona alla volta, per nome esatto.
create or replace function toyo_trova(p_nick text)
returns table(utente uuid, nick text, nome text, cognome text)
language sql security definer stable set search_path = public as $$
  select p.utente, p.nick, p.nome, p.cognome
  from toyo_profili p where p.nick = lower(trim(p_nick)) limit 1;
$$;
revoke all on function toyo_trova(text) from public;
grant execute on function toyo_trova(text) to authenticated;

create policy "vedo solo la mia scheda" on toyo_profili
  for select to authenticated using (utente = auth.uid());
create policy "scrivo solo la mia scheda" on toyo_profili
  for insert to authenticated with check (utente = auth.uid());
create policy "aggiorno solo la mia scheda" on toyo_profili
  for update to authenticated using (utente = auth.uid()) with check (utente = auth.uid());

-- ==========================================================================
-- VIAGGI CONDIVISI · il viaggio invitato non è più una copia: sta qui, e chi
-- partecipa legge sempre l'ultima versione scritta da chi organizza.
-- ==========================================================================
create table if not exists toyo_viaggi (
  id         text primary key,
  propr      uuid not null references auth.users on delete cascade,
  dati       jsonb not null default '{}'::jsonb,
  aggiornato timestamptz default now()
);
alter table toyo_viaggi enable row level security;

create table if not exists toyo_membri (
  viaggio  text not null references toyo_viaggi(id) on delete cascade,
  utente   uuid not null references auth.users on delete cascade,
  propr    uuid not null,
  titolo   text default '',
  da_nick  text default '',
  ruolo    text not null default 'viaggiatore',
  stato    text not null default 'invitato',
  creato   timestamptz default now(),
  primary key (viaggio, utente)
);
alter table toyo_membri enable row level security;

-- Il nome utente di chi è stato invitato: serve a mostrarlo fra le persone del
-- viaggio senza dover interrogare la rubrica ogni volta.
alter table toyo_membri add column if not exists nick text default '';

-- Le due tabelle si interrogano a vicenda: se lo facessero dentro le regole si
-- chiamerebbero all'infinito. Queste due funzioni girano con i privilegi del
-- proprietario e spezzano il cerchio.
create or replace function toyo_e_mio(v text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from toyo_viaggi where id = v and propr = auth.uid());
$$;
create or replace function toyo_sono_dentro(v text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from toyo_membri
                 where viaggio = v and utente = auth.uid() and stato = 'accettato');
$$;
-- Un co-organizzatore è un membro con ruolo 'organizzatore': può modificare il
-- viaggio e invitare, ma il proprietario resta uno solo.
create or replace function toyo_propr(v text) returns uuid
language sql security definer stable set search_path = public as $$
  select propr from toyo_viaggi where id = v;
$$;
create or replace function toyo_co_organizzo(v text) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from toyo_membri
                 where viaggio = v and utente = auth.uid()
                   and stato = 'accettato' and ruolo = 'organizzatore');
$$;
revoke all on function toyo_e_mio(text), toyo_sono_dentro(text),
                      toyo_propr(text), toyo_co_organizzo(text) from public;
grant execute on function toyo_e_mio(text), toyo_sono_dentro(text),
                          toyo_propr(text), toyo_co_organizzo(text) to authenticated;

drop policy if exists "vedo i miei viaggi e quelli a cui partecipo" on toyo_viaggi;
drop policy if exists "pubblico solo i miei viaggi" on toyo_viaggi;
drop policy if exists "aggiorno solo i miei viaggi" on toyo_viaggi;
drop policy if exists "cancello solo i miei viaggi" on toyo_viaggi;

create policy "vedo i miei viaggi e quelli a cui partecipo" on toyo_viaggi
  for select to authenticated using (propr = auth.uid() or toyo_sono_dentro(id));
create policy "pubblico solo i miei viaggi" on toyo_viaggi
  for insert to authenticated with check (propr = auth.uid());
create policy "aggiorno solo i miei viaggi" on toyo_viaggi
  for update to authenticated
  using      (propr = auth.uid() or toyo_co_organizzo(id))
  with check (propr = auth.uid() or toyo_co_organizzo(id));
create policy "cancello solo i miei viaggi" on toyo_viaggi
  for delete to authenticated using (propr = auth.uid());

drop policy if exists "vedo gli inviti che mi riguardano" on toyo_membri;
drop policy if exists "invito solo ai miei viaggi" on toyo_membri;
drop policy if exists "rispondo al mio invito" on toyo_membri;
drop policy if exists "tolgo un partecipante o me stesso" on toyo_membri;

-- Chi è dentro un viaggio deve poter vedere gli altri: senza questo non si sa
-- fra chi dividere le spese, e la lista dei partecipanti resta un segreto fra
-- l'organizzatore e ognuno singolarmente.
create policy "vedo gli inviti che mi riguardano" on toyo_membri
  for select to authenticated
  using (utente = auth.uid() or propr = auth.uid() or toyo_sono_dentro(viaggio));
create policy "invito solo ai miei viaggi" on toyo_membri
  for insert to authenticated
  with check (propr = toyo_propr(viaggio)
              and (toyo_e_mio(viaggio) or toyo_co_organizzo(viaggio)));
create policy "rispondo al mio invito" on toyo_membri
  for update to authenticated using (utente = auth.uid() or propr = auth.uid())
                            with check (utente = auth.uid() or propr = auth.uid());
create policy "tolgo un partecipante o me stesso" on toyo_membri
  for delete to authenticated using (propr = auth.uid() or utente = auth.uid());

-- ==========================================================================
-- ⚠️ IL PEZZO PIÙ IMPORTANTE DI TUTTO L'SQL
-- Una regola RLS decide se puoi toccare UNA RIGA, non QUALI COLONNE. Con la
-- sola regola qui sopra, un invitato poteva riscrivere la propria riga a
-- piacere: mettersi ruolo 'organizzatore' (e diventare padrone del viaggio di
-- un altro), oppure cambiare «viaggio» e infilarsi in un viaggio dove non era
-- mai stato invitato. Le colonne si vincolano solo con un trigger.
-- ==========================================================================
create or replace function toyo_membri_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    if new.viaggio <> old.viaggio or new.utente <> old.utente or new.propr <> old.propr then
      raise exception 'TOYO: viaggio, utente e proprietario non si cambiano';
    end if;
    /* il ruolo lo decide chi organizza, non l'invitato */
    if new.ruolo is distinct from old.ruolo
       and not (toyo_e_mio(old.viaggio) or toyo_co_organizzo(old.viaggio)) then
      raise exception 'TOYO: il ruolo lo assegna chi organizza';
    end if;
  end if;

  if new.stato not in ('invitato','accettato','rifiutato') then
    raise exception 'TOYO: stato non valido';
  end if;
  if new.ruolo not in ('viaggiatore','organizzatore') then
    raise exception 'TOYO: ruolo non valido';
  end if;

  /* il proprietario dichiarato deve essere quello vero */
  if new.propr is distinct from toyo_propr(new.viaggio) then
    raise exception 'TOYO: proprietario non corrispondente';
  end if;

  /* "da_nick" è il mittente dell'invito: lo mette il server, non il client,
     altrimenti si possono spedire inviti a nome di chiunque */
  if tg_op = 'INSERT' then
    new.da_nick := coalesce((select nick from toyo_profili where utente = auth.uid()), '');
  end if;

  return new;
end $$;

drop trigger if exists toyo_membri_guard_t on toyo_membri;
create trigger toyo_membri_guard_t before insert or update on toyo_membri
  for each row execute function toyo_membri_guard();

-- Stessa storia sui viaggi: un co-organizzatore poteva intestarsi il viaggio
-- («propr = io») e chiudere fuori il proprietario, che perdeva perfino la
-- lettura del proprio viaggio.
create or replace function toyo_viaggi_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.id <> old.id or new.propr <> old.propr then
    raise exception 'TOYO: il proprietario di un viaggio non si cambia';
  end if;
  return new;
end $$;

drop trigger if exists toyo_viaggi_guard_t on toyo_viaggi;
create trigger toyo_viaggi_guard_t before update on toyo_viaggi
  for each row execute function toyo_viaggi_guard();

-- ==========================================================================
-- SPESE DI CHI PARTECIPA
-- Le spese di chi organizza stanno dentro il viaggio. Ma in un viaggio vero
-- paga anche chi partecipa — e sul viaggio ha solo lettura. Le sue spese
-- vanno quindi qui, dove ha diritto di scrivere. Il conto finale somma le due.
-- ==========================================================================
create table if not exists toyo_spese (
  id          text primary key,
  viaggio     text not null references toyo_viaggi(id) on delete cascade,
  utente      uuid not null references auth.users on delete cascade,
  nick        text default '',
  voce        text default '',
  importo     numeric default 0,
  cat         text default 'altro',
  chi_paga    text default '',
  diviso_tra  text[] default '{}',
  pagato      boolean default false,
  creato      timestamptz default now()
);
alter table toyo_spese enable row level security;

drop policy if exists "vedo le spese dei viaggi a cui partecipo" on toyo_spese;
drop policy if exists "registro le mie spese" on toyo_spese;
drop policy if exists "correggo le mie spese" on toyo_spese;
drop policy if exists "cancello le mie spese" on toyo_spese;

create policy "vedo le spese dei viaggi a cui partecipo" on toyo_spese
  for select to authenticated using (toyo_e_mio(viaggio) or toyo_sono_dentro(viaggio));
create policy "registro le mie spese" on toyo_spese
  for insert to authenticated
  with check (utente = auth.uid() and (toyo_e_mio(viaggio) or toyo_sono_dentro(viaggio)));
-- ⚠️ Il «with check» deve ripetere il controllo sull'appartenenza al viaggio:
-- senza, bastava creare una spesa in un viaggio proprio e poi spostarla, con
-- una PATCH, dentro il viaggio di qualcun altro, falsandone i conti.
create policy "correggo le mie spese" on toyo_spese
  for update to authenticated
  using      (utente = auth.uid())
  with check (utente = auth.uid() and (toyo_e_mio(viaggio) or toyo_sono_dentro(viaggio)));
create policy "cancello le mie spese" on toyo_spese
  for delete to authenticated using (utente = auth.uid() or toyo_e_mio(viaggio));

-- Il nome di chi registra e l'importo li stabilisce il server: il primo perché
-- altrimenti si registra una spesa firmandola con il nome di un altro, il
-- secondo perché un importo assurdo manda in vacca tutti i saldi.
create or replace function toyo_spese_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.viaggio <> old.viaggio then
    raise exception 'TOYO: una spesa non si sposta di viaggio';
  end if;
  new.utente := auth.uid();
  new.nick   := coalesce((select nick from toyo_profili where utente = auth.uid()), '');
  if new.importo is null or new.importo < 0 or new.importo > 1000000 then
    raise exception 'TOYO: importo non valido';
  end if;
  return new;
end $$;

drop trigger if exists toyo_spese_guard_t on toyo_spese;
create trigger toyo_spese_guard_t before insert or update on toyo_spese
  for each row execute function toyo_spese_guard();

-- ==========================================================================
-- SONDAGGI · le domande stanno dentro il viaggio (le scrive chi organizza),
-- i voti stanno qui perché anche chi partecipa deve poter scrivere.
-- ==========================================================================
create table if not exists toyo_voti (
  viaggio   text not null references toyo_viaggi(id) on delete cascade,
  sondaggio text not null,
  utente    uuid not null references auth.users on delete cascade,
  nick      text default '',
  opzione   text not null,
  creato    timestamptz default now(),
  primary key (viaggio, sondaggio, utente)
);
alter table toyo_voti enable row level security;

drop policy if exists "vedo i voti dei viaggi a cui partecipo" on toyo_voti;
drop policy if exists "voto nei viaggi a cui partecipo" on toyo_voti;
drop policy if exists "cambio il mio voto" on toyo_voti;
drop policy if exists "ritiro il mio voto" on toyo_voti;

create policy "vedo i voti dei viaggi a cui partecipo" on toyo_voti
  for select to authenticated using (toyo_e_mio(viaggio) or toyo_sono_dentro(viaggio));
create policy "voto nei viaggi a cui partecipo" on toyo_voti
  for insert to authenticated
  with check (utente = auth.uid() and (toyo_e_mio(viaggio) or toyo_sono_dentro(viaggio)));
create policy "cambio il mio voto" on toyo_voti
  for update to authenticated
  using      (utente = auth.uid())
  with check (utente = auth.uid() and (toyo_e_mio(viaggio) or toyo_sono_dentro(viaggio)));
create policy "ritiro il mio voto" on toyo_voti
  for delete to authenticated using (utente = auth.uid() or toyo_e_mio(viaggio));

create or replace function toyo_voti_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.viaggio <> old.viaggio then
    raise exception 'TOYO: un voto non si sposta di viaggio';
  end if;
  new.utente := auth.uid();
  new.nick   := coalesce((select nick from toyo_profili where utente = auth.uid()), '');
  return new;
end $$;

drop trigger if exists toyo_voti_guard_t on toyo_voti;
create trigger toyo_voti_guard_t before insert or update on toyo_voti
  for each row execute function toyo_voti_guard();

-- ARCHIVIO FILE (documenti, biglietti, foto): privato, ognuno vede solo la sua cartella
-- Limiti sul bucket: finora il tetto di 10 MB e i tipi ammessi esistevano solo
-- nel browser, cioè in un posto dove chiunque può aggirarli.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('documenti', 'documenti', false, 10485760,
          array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
  on conflict (id) do update set file_size_limit    = excluded.file_size_limit,
                                 allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "carico i miei file" on storage.objects;
drop policy if exists "leggo i miei file" on storage.objects;
drop policy if exists "sostituisco i miei file" on storage.objects;
drop policy if exists "cancello i miei file" on storage.objects;

create policy "carico i miei file" on storage.objects for insert to authenticated
  with check (bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "leggo i miei file" on storage.objects for select to authenticated
  using (bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text);
-- ⚠️ Senza il "with check" si poteva rinominare un proprio file spostandolo
-- dentro la cartella di un altro utente.
create policy "sostituisco i miei file" on storage.objects for update to authenticated
  using      (bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cancello i miei file" on storage.objects for delete to authenticated
  using (bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text);

-- ==========================================================================
-- LA PARTE PUBBLICA · profili, chi segue chi, post, mi piace, commenti
-- ⚠️ Da qui in poi TOYO smette di essere solo uno strumento privato e diventa
-- anche una piazza. Il cambio è deliberato e va detto: i profili tornano
-- leggibili da chiunque sia iscritto, perché senza profili trovabili non
-- esiste nessuno da seguire. Chi non vuole comparire mette 'pubblico' a
-- falso e sparisce dalla piazza senza perdere i suoi viaggi.
-- ==========================================================================
alter table toyo_profili add column if not exists foto     text default '';
alter table toyo_profili add column if not exists bio      text default '';
alter table toyo_profili add column if not exists pubblico boolean default true;

drop policy if exists "vedo solo la mia scheda" on toyo_profili;
drop policy if exists "i profili pubblici si vedono" on toyo_profili;
create policy "i profili pubblici si vedono" on toyo_profili
  for select to authenticated using (pubblico or utente = auth.uid());

-- chi segue chi
create table if not exists toyo_segui (
  chi     uuid not null references auth.users on delete cascade,
  seguito uuid not null references auth.users on delete cascade,
  creato  timestamptz default now(),
  primary key (chi, seguito),
  check (chi <> seguito)
);
alter table toyo_segui enable row level security;
drop policy if exists "il grafo è pubblico" on toyo_segui;
drop policy if exists "seguo io per me" on toyo_segui;
drop policy if exists "smetto di seguire" on toyo_segui;
create policy "il grafo è pubblico" on toyo_segui for select to authenticated using (true);
create policy "seguo io per me" on toyo_segui for insert to authenticated with check (chi = auth.uid());
create policy "smetto di seguire" on toyo_segui for delete to authenticated using (chi = auth.uid());

-- il blocco viene PRIMA dei post: una piazza senza il modo di togliersi
-- qualcuno di torno non si apre.
create table if not exists toyo_blocchi (
  chi      uuid not null references auth.users on delete cascade,
  bloccato uuid not null references auth.users on delete cascade,
  creato   timestamptz default now(),
  primary key (chi, bloccato),
  check (chi <> bloccato)
);
alter table toyo_blocchi enable row level security;
drop policy if exists "vedo i miei blocchi" on toyo_blocchi;
drop policy if exists "blocco io" on toyo_blocchi;
drop policy if exists "sblocco io" on toyo_blocchi;
create policy "vedo i miei blocchi" on toyo_blocchi for select to authenticated using (chi = auth.uid());
create policy "blocco io" on toyo_blocchi for insert to authenticated with check (chi = auth.uid());
create policy "sblocco io" on toyo_blocchi for delete to authenticated using (chi = auth.uid());

create or replace function toyo_bloccato(u uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from toyo_blocchi
                 where (chi = auth.uid() and bloccato = u)
                    or (chi = u and bloccato = auth.uid()));
$$;
revoke all on function toyo_bloccato(uuid) from public;
grant execute on function toyo_bloccato(uuid) to authenticated;

-- i post
create table if not exists toyo_post (
  id      text primary key,
  autore  uuid not null references auth.users on delete cascade,
  testo   text default '',
  foto    text[] default '{}',
  luogo   text default '',
  viaggio text default '',
  creato  timestamptz default now()
);
alter table toyo_post enable row level security;
drop policy if exists "i post si leggono" on toyo_post;
drop policy if exists "scrivo i miei post" on toyo_post;
drop policy if exists "correggo i miei post" on toyo_post;
drop policy if exists "cancello i miei post" on toyo_post;
create policy "i post si leggono" on toyo_post
  for select to authenticated using (not toyo_bloccato(autore));
create policy "scrivo i miei post" on toyo_post
  for insert to authenticated with check (autore = auth.uid());
create policy "correggo i miei post" on toyo_post
  for update to authenticated using (autore = auth.uid()) with check (autore = auth.uid());
create policy "cancello i miei post" on toyo_post
  for delete to authenticated using (autore = auth.uid());

create table if not exists toyo_mipiace (
  post   text not null references toyo_post(id) on delete cascade,
  utente uuid not null references auth.users on delete cascade,
  creato timestamptz default now(),
  primary key (post, utente)
);
alter table toyo_mipiace enable row level security;
drop policy if exists "i mi piace si contano" on toyo_mipiace;
drop policy if exists "metto il mio" on toyo_mipiace;
drop policy if exists "tolgo il mio" on toyo_mipiace;
create policy "i mi piace si contano" on toyo_mipiace for select to authenticated using (true);
create policy "metto il mio" on toyo_mipiace for insert to authenticated with check (utente = auth.uid());
create policy "tolgo il mio" on toyo_mipiace for delete to authenticated using (utente = auth.uid());

create table if not exists toyo_commenti (
  id     text primary key,
  post   text not null references toyo_post(id) on delete cascade,
  autore uuid not null references auth.users on delete cascade,
  testo  text not null,
  creato timestamptz default now()
);
alter table toyo_commenti enable row level security;
drop policy if exists "i commenti si leggono" on toyo_commenti;
drop policy if exists "commento io" on toyo_commenti;
drop policy if exists "cancello il mio commento" on toyo_commenti;
create policy "i commenti si leggono" on toyo_commenti
  for select to authenticated using (not toyo_bloccato(autore));
create policy "commento io" on toyo_commenti
  for insert to authenticated with check (autore = auth.uid());
-- chi ha scritto il post può togliere un commento da casa sua
create policy "cancello il mio commento" on toyo_commenti
  for delete to authenticated
  using (autore = auth.uid() or exists (select 1 from toyo_post p where p.id = post and p.autore = auth.uid()));

create table if not exists toyo_segnalazioni (
  id      text primary key,
  post    text default '',
  chi     uuid not null references auth.users on delete cascade,
  motivo  text default '',
  creato  timestamptz default now()
);
alter table toyo_segnalazioni enable row level security;
drop policy if exists "segnalo io" on toyo_segnalazioni;
drop policy if exists "vedo le mie segnalazioni" on toyo_segnalazioni;
create policy "segnalo io" on toyo_segnalazioni for insert to authenticated with check (chi = auth.uid());
create policy "vedo le mie segnalazioni" on toyo_segnalazioni for select to authenticated using (chi = auth.uid());

-- ⚠️ Le regole qui sopra dicono CHI può scrivere, non QUANTO. Senza un tetto,
-- una sola richiesta può infilare un post da dieci megabyte o quattrocento
-- foto, e la bacheca di tutti si trascina dietro quel peso per sempre. Il
-- limite sta nel database e non nel telefono: quello nel telefono lo salta
-- chiunque apra la console.
alter table toyo_post      drop constraint if exists toyo_post_testo_corto;
alter table toyo_post      add  constraint toyo_post_testo_corto  check (char_length(testo) <= 2000);
alter table toyo_post      drop constraint if exists toyo_post_poche_foto;
alter table toyo_post      add  constraint toyo_post_poche_foto   check (coalesce(array_length(foto,1),0) <= 4);
alter table toyo_post      drop constraint if exists toyo_post_luogo_corto;
alter table toyo_post      add  constraint toyo_post_luogo_corto  check (char_length(luogo) <= 120);
alter table toyo_commenti  drop constraint if exists toyo_commenti_corto;
alter table toyo_commenti  add  constraint toyo_commenti_corto    check (char_length(testo) between 1 and 600);
alter table toyo_profili   drop constraint if exists toyo_profili_bio_corta;
alter table toyo_profili   add  constraint toyo_profili_bio_corta check (char_length(coalesce(bio,'')) <= 200);

-- Una bacheca si legge sempre nello stesso modo: gli ultimi post di chi seguo.
-- Senza questi indici il database rilegge tutta la tabella a ogni apertura.
create index if not exists toyo_post_autore_creato on toyo_post (autore, creato desc);
create index if not exists toyo_post_creato        on toyo_post (creato desc);
-- Solo i post che hanno un luogo: l'indice resta piccolo e serve alla pagina
-- "dove sono stati gli altri", che e' la piu' aperta di tutta l'app.
create index if not exists toyo_post_luogo         on toyo_post (lower(luogo), creato desc)
  where luogo <> '';
-- Cercare "milos" dentro "Milos, Grecia" vuol dire cercare in mezzo alla
-- parola, e un indice normale li' non serve a niente. pg_trgm risolve, ma se
-- l'estensione non si puo' installare non e' un dramma: senza indice la
-- ricerca funziona lo stesso, solo piu' lenta. Percio' si prova e si tira
-- dritto.
do $$
begin
  create extension if not exists pg_trgm;
  create index if not exists toyo_post_luogo_cerca on toyo_post using gin (lower(luogo) gin_trgm_ops);
  create index if not exists toyo_profili_cerca    on toyo_profili using gin ((nick || ' ' || nome || ' ' || cognome) gin_trgm_ops);
exception when others then
  raise notice 'pg_trgm non disponibile: la ricerca funziona lo stesso, senza indice';
end $$;
create index if not exists toyo_segui_seguito      on toyo_segui (seguito);
create index if not exists toyo_commenti_post      on toyo_commenti (post, creato);
create index if not exists toyo_mipiace_post       on toyo_mipiace (post);

-- ⚠️ Le foto della bacheca stanno in un secchio PUBBLICO: un feed che deve
-- mostrare centinaia di immagini non può chiedere un permesso firmato per
-- ognuna. I documenti d'identità restano dove sono, nel secchio privato.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('foto', 'foto', true, 5242880,
          array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set public = true,
                                 file_size_limit    = excluded.file_size_limit,
                                 allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "carico le mie foto" on storage.objects;
drop policy if exists "le foto si vedono" on storage.objects;
drop policy if exists "sostituisco le mie foto" on storage.objects;
drop policy if exists "cancello le mie foto" on storage.objects;
create policy "le foto si vedono" on storage.objects for select
  using (bucket_id = 'foto');
create policy "carico le mie foto" on storage.objects for insert to authenticated
  with check (bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "sostituisco le mie foto" on storage.objects for update to authenticated
  using      (bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cancello le mie foto" on storage.objects for delete to authenticated
  using (bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text);

-- CANCELLAZIONE DELL'ACCOUNT dall'app (obbligatoria per pubblicare su App Store)
create or replace function elimina_mio_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from storage.objects
    where bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text;
  delete from storage.objects where bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text;
  delete from toyo_commenti where autore = auth.uid();
  delete from toyo_mipiace  where utente = auth.uid();
  delete from toyo_post     where autore = auth.uid();
  delete from toyo_segui    where chi = auth.uid() or seguito = auth.uid();
  delete from toyo_blocchi  where chi = auth.uid() or bloccato = auth.uid();
  delete from toyo_spese  where utente = auth.uid();
  delete from toyo_voti   where utente = auth.uid();
  delete from toyo_membri where utente = auth.uid() or propr = auth.uid();
  delete from toyo_viaggi where propr = auth.uid();
  delete from toyo_profili where utente = auth.uid();
  delete from toyo_dati where utente = auth.uid();
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function elimina_mio_account() from public;
grant execute on function elimina_mio_account() to authenticated;`;

/* ⚠️ Versione FISSATA di proposito. Con "@2" ci si fida di qualunque release
   futura: una compromessa, o un incidente al CDN, eseguirebbe codice arbitrario
   nel browser di ogni utente con la sessione aperta. Alzarla a mano, leggendo
   cosa cambia. */
const LIB_SUPABASE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const CFG_KEY = 'toyo.cloud';
let sb = null, cloudCfg = null, utente = null, syncStato = 'off', syncT = null, motivoCloud = '';

/* Toglie spazi, virgolette e — errore frequentissimo — il nome della variabile
   copiato insieme al valore (es. NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...). */
const pulisci = v => String(v || '')
  .replace(/\s+/g, '')
  .replace(/^[A-Za-z0-9_.]*(?:URL|KEY|SUPABASE)[A-Za-z0-9_.]*=/i, '')
  .replace(/^['"]|['"];?$/g, '')
  .replace(/\/+$/, '');
const cfgDalFile = () => !!(TOYO_CONFIG.url && TOYO_CONFIG.chiave);
function leggiCfg(){
  /* quello salvato qui vince sul file: così una chiave sbagliata nel file si corregge dall'app */
  try{
    const r = localStorage.getItem(CFG_KEY);
    if(r){
      const c = JSON.parse(r);
      if(c && c.url && c.key) return {url:pulisci(c.url), key:pulisci(c.key)};
    }
  }catch(e){}
  if(cfgDalFile()) return {url:pulisci(TOYO_CONFIG.url), key:pulisci(TOYO_CONFIG.chiave), dalFile:true};
  return null;
}
function scriviCfg(c){
  try{ c ? localStorage.setItem(CFG_KEY, JSON.stringify(c)) : localStorage.removeItem(CFG_KEY); }catch(e){}
  cloudCfg = c;
}
const cloudAttivo = () => !!(cloudCfg && cloudCfg.url && cloudCfg.key);

async function initCloud(){
  cloudCfg = leggiCfg();
  if(!cloudAttivo()) return false;
  try{
    const mod = await import(LIB_SUPABASE);
    sb = mod.createClient(cloudCfg.url, cloudCfg.key);
    const {data} = await sb.auth.getSession();
    utente = data && data.session ? data.session.user : null;
    sb.auth.onAuthStateChange((ev, sess) => {
      utente = sess ? sess.user : null;
      if(ev === 'SIGNED_OUT'){
        syncStato = 'off';
        /* Una cosa è uscire, un'altra è essere buttati fuori dalla sessione
           scaduta: nel secondo caso l'utente stava magari compilando una
           spesa, e si ritrovava la finestra aperta sopra la schermata di
           accesso senza una parola di spiegazione. */
        const volontaria = uscitaVoluta; uscitaVoluta = false;
        closeModal();
        boot();
        if(!volontaria) toast('La sessione è scaduta: rientra per continuare');
      }
    });
    return true;
  }catch(e){
    syncStato = 'errore';
    motivoCloud = String((e && e.message) || e);
    return false;
  }
}

/* Controlla passo per passo dove si rompe il collegamento e lo dice in chiaro. */
async function diagnosi(){
  const righe = [];
  const ok = (t, d) => righe.push(['ok', t, d || '']);
  const ko = (t, d) => righe.push(['ko', t, d || '']);
  const info = (t, d) => righe.push(['info', t, d || '']);

  let nomeVar = false, libreriaKo = false;
  const daFile = location.protocol === 'file:';
  daFile ? info('Come stai aprendo TOYO', 'Da file sul computer (file://).')
         : ok('Come stai aprendo TOYO', location.origin);

  if(!cloudAttivo()){ ko('Progetto Supabase', 'Nessun indirizzo o chiave impostati.'); }
  else {
    ok('Indirizzo del progetto', cloudCfg.url);
    const k = cloudCfg.key;
    const jwt = k.indexOf('eyJ') === 0, pub = k.indexOf('sb_publishable_') === 0, seg = k.indexOf('sb_secret_') === 0;
    const forma = seg ? 'è la chiave SEGRETA: va sostituita con la pubblica'
      : jwt ? (k.length > 150 ? 'formato anon (JWT), lunghezza plausibile' : 'formato anon ma TROPPO CORTA: copiata a metà')
      : pub ? (k.length > 30 ? 'formato publishable, lunghezza plausibile' : 'formato publishable ma troppo corta')
      : 'formato non riconosciuto: deve iniziare con eyJ… oppure sb_publishable_…';
    const buona = !seg && ((jwt && k.length > 150) || (pub && k.length > 30));
    (buona ? ok : ko)('Chiave', k.slice(0, 16) + '… · ' + k.length + ' caratteri · ' + forma);
    if(!buona && /^[A-Z]|_KEY|SUPABASE|=/.test(k) && !jwt && !pub && !seg)
      nomeVar = true;
    if(cloudCfg.dalFile) info('Da dove arriva', 'Scritta dentro il file dell\'app');
  }

  if(!navigator.onLine) ko('Rete', 'Il dispositivo risulta offline.');
  else ok('Rete', 'connessa');

  if(cloudAttivo()){
    if(!sb){
      try{
        const mod = await import(LIB_SUPABASE);
        sb = mod.createClient(cloudCfg.url, cloudCfg.key);
        ok('Libreria Supabase', 'caricata ora');
      }catch(e){
        libreriaKo = true;
        ko('Libreria Supabase', 'non si carica — ' + String((e && e.message) || e));
      }
    } else ok('Libreria Supabase', 'caricata');

    if(sb){
      try{
        const r = await fetch(cloudCfg.url + '/auth/v1/health', {headers:{apikey:cloudCfg.key}});
        r.ok ? ok('Il server risponde', 'sì') : ko('Il server risponde', 'errore ' + r.status);
      }catch(e){ ko('Il server risponde', String((e && e.message) || e)); }

      try{
        const {error} = await sb.from('toyo_dati').select('utente', {count:'exact', head:true});
        if(error && /does not exist|schema cache/i.test(error.message)) ko('Tabella toyo_dati', 'non esiste: rilancia l\'SQL su Supabase');
        else if(error && /JWT|apikey|Invalid/i.test(error.message)) ko('Chiave', 'rifiutata dal server: ricopiala da Settings → API Keys');
        else ok('Tabella toyo_dati', 'raggiungibile');
      }catch(e){ ko('Tabella toyo_dati', String((e && e.message) || e)); }
    }
  }

  const icona = {ok:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>', ko:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>', info:'<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.95" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6h.01"/></svg>'};
  const problema = righe.some(r => r[0] === 'ko');
  modal(mHead('Verifica del collegamento', problema ? 'Ecco dove si ferma' : 'Sembra tutto a posto') +
    '<div class="modal-b"><div class="rows">' +
      righe.map(r => '<div class="row" style="padding:9px 2px"><span class="ic">' + icona[r[0]] + '</span>' +
        '<span class="tx"><span class="t">' + esc(r[1]) + '</span>' +
        (r[2] ? '<span class="m" style="word-break:break-all">' + esc(r[2]) + '</span>' : '') + '</span></div>').join('') +
    '</div>' +
    (nomeVar ? '<div class="card" style="margin-top:14px;border-left:3px solid var(--terracotta)"><div class="card-b" style="font-size:12.5px;line-height:1.55">' +
      '<b>È questo.</b> Hai incollato il <b>nome della variabile</b>, non la chiave. Dalla finestra "Connect" viene copiata la riga intera:<br>' +
      '<code style="display:block;margin:8px 0;padding:8px;background:var(--surface-2);border-radius:var(--r-btn);word-break:break-all">NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi…</code>' +
      'Serve solo quello che sta <b>dopo l\'uguale</b>. Meglio ancora: su Supabase vai in <b>Settings → API Keys</b> e usa il pulsante di copia accanto alla chiave <b>publishable</b> (o <b>anon</b>).<br><br>' +
      'Poi qui: <b><svg class="ico" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3L5.5 5.5"/></svg> Cambia progetto o chiave</b> → incolla → Salva → rilancia questa verifica.</div></div>' : '') +
    (libreriaKo && daFile ? '<div class="card" style="margin-top:14px;border-left:3px solid var(--terracotta)"><div class="card-b" style="font-size:12.5px;line-height:1.55">' +
      '<b>Probabilmente è il doppio clic.</b> Aprendo il file direttamente, il browser lo tratta come "nessun sito" e blocca le chiamate esterne.<br><br>' +
      'Apri il <b>Terminale</b>, scrivi <code>cd</code> seguito da uno spazio, trascina dentro la cartella dove sta il file, premi Invio, poi scrivi:<br>' +
      '<code style="display:block;margin:8px 0;padding:8px;background:var(--surface-2);border-radius:var(--r-btn)">python3 -m http.server 8000</code>' +
      'e apri <code>http://localhost:8000/toyo.html</code>. Da lì funziona.</div></div>' : '') +
    '</div>' +
    '<div class="modal-f"><span class="sp"></span><button class="btn btn-primary" data-act="close-modal">Chiudi</button></div>', true);
}

/* ---- lettura e scrittura del documento dell'utente ---- */
async function scaricaDati(){
  if(!sb || !utente) return null;
  const {data, error} = await sb.from('toyo_dati').select('dati, aggiornato').eq('utente', utente.id).maybeSingle();
  if(error) throw error;
  return data;
}
/* Il documento personale non porta con sé i viaggi ricevuti da altri: quelli
   si riscaricano da toyo_viaggi. Tenerli qui dentro raddoppiava i dati
   dell'organizzatore su ogni account invitato. */
function blobDaSalvare(){
  const copia = {};
  for(const k in DB) if(k !== 'viaggi') copia[k] = DB[k];
  copia.viaggi = (DB.viaggi || []).filter(t => !t.ospite);
  return copia;
}
let sincronizzando = false, risincronizza = false, uscitaVoluta = false;
async function inviaDati(){
  if(!sb || !utente) return;
  /* Due invii in volo insieme possono atterrare fuori ordine e far vincere lo
     snapshot più vecchio: se ne fa uno per volta, e chi arriva dopo si mette
     in coda. */
  if(sincronizzando){ risincronizza = true; return; }
  sincronizzando = true;
  syncStato = 'sync'; segnaSync();
  try{
    DB.aggiornato = DB.aggiornato || new Date().toISOString();
    DB.propr = utente.id;          /* timbro di proprietà: vedi allineaDati() */
    const {error} = await sb.from('toyo_dati')
      .upsert({utente:utente.id, dati:blobDaSalvare(), aggiornato:DB.aggiornato});
    if(error) throw error;
    salvaLocale();
    await pubblicaCondivisi();   /* se fallisce, alza: non deve passare per "salvato" */
    syncStato = 'ok';
  }catch(e){
    syncStato = 'errore';
    toast(/condivis/i.test(String(e && e.message)) ? 'Salvato sul tuo account, ma non sui viaggi condivisi'
                                                   : 'Non riesco a sincronizzare: i dati restano su questo dispositivo');
  }
  sincronizzando = false;
  segnaSync();
  if(risincronizza){ risincronizza = false; programmaSync(); }
}
/* Manda subito quello che è in attesa, e aspetta che sia partito. Serve prima
   di uscire dall'account o di cancellare la copia locale: senza, il timer da
   1,5 secondi non scatta mai e la modifica muore lì. */
async function svuotaCoda(){
  clearTimeout(syncT);
  if(!sb || !utente) return;
  try{ await inviaDati(); }catch(e){}
}
function programmaSync(){
  if(!sb || !utente) return;
  clearTimeout(syncT);
  syncStato = 'sync'; segnaSync();
  syncT = setTimeout(inviaDati, 1500);
}
function segnaSync(){
  const el = $('syncBtn');
  if(!el) return;
  const m = {ok:['nuvola','Salvato sul tuo account','var(--sage)'],
             sync:['sincro','Sto salvando…','var(--ink-3)'],
             errore:['info','Non riesco a salvare online','var(--terracotta)'],
             off:['disco','Solo su questo dispositivo','var(--ink-3)']};
  const v = m[syncStato] || m.off;
  el.innerHTML = ico(v[0], 21, v[2]); el.title = v[1]; el.setAttribute('aria-label', v[1]);
  el.classList.toggle('spin', syncStato === 'sync');
}

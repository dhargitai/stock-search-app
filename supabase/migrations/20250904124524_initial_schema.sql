create sequence "public"."watchlist_items_id_seq";

create table "public"."_prisma_migrations" (
    "id" character varying(36) not null,
    "checksum" character varying(64) not null,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) not null,
    "logs" text,
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone not null default now(),
    "applied_steps_count" integer not null default 0
);


create table "public"."users" (
    "id" uuid not null,
    "email" text,
    "name" text,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "updatedAt" timestamp(3) without time zone not null
);


create table "public"."watchlist_items" (
    "id" integer not null default nextval('watchlist_items_id_seq'::regclass),
    "symbol" text not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP,
    "userId" uuid not null
);


alter table "public"."watchlist_items" enable row level security;

alter sequence "public"."watchlist_items_id_seq" owned by "public"."watchlist_items"."id";

CREATE UNIQUE INDEX _prisma_migrations_pkey ON public._prisma_migrations USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX watchlist_items_pkey ON public.watchlist_items USING btree (id);

CREATE UNIQUE INDEX "watchlist_items_userId_symbol_key" ON public.watchlist_items USING btree ("userId", symbol);

alter table "public"."_prisma_migrations" add constraint "_prisma_migrations_pkey" PRIMARY KEY using index "_prisma_migrations_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."watchlist_items" add constraint "watchlist_items_pkey" PRIMARY KEY using index "watchlist_items_pkey";

alter table "public"."watchlist_items" add constraint "watchlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."watchlist_items" validate constraint "watchlist_items_userId_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$function$
;

create policy "Enable users to delete their own watchlist items"
on "public"."watchlist_items"
as permissive
for delete
to public
using ((auth.uid() = "userId"));


create policy "Enable users to insert their own watchlist items"
on "public"."watchlist_items"
as permissive
for insert
to public
with check ((auth.uid() = "userId"));


create policy "Enable users to update their own watchlist items"
on "public"."watchlist_items"
as permissive
for update
to public
using ((auth.uid() = "userId"))
with check ((auth.uid() = "userId"));


create policy "Enable users to view their own watchlist items"
on "public"."watchlist_items"
as permissive
for select
to public
using ((auth.uid() = "userId"));




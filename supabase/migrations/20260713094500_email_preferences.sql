create table if not exists public.email_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    product_updates_subscribed boolean not null default true,
    subscription_source text not null default 'registration_default',
    subscribed_at timestamptz,
    unsubscribed_at timestamptz,
    deliverability_status text not null default 'active'
        check (deliverability_status in ('active', 'bounced', 'complained', 'suppressed')),
    resend_contact_id text,
    resend_sync_status text not null default 'pending'
        check (resend_sync_status in ('pending', 'synced', 'failed', 'skipped')),
    resend_synced_at timestamptz,
    resend_sync_error text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists email_preferences_email_key
    on public.email_preferences (lower(email));

alter table public.email_preferences enable row level security;

create table if not exists public.email_subscription_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    email text not null,
    topic text not null default 'product_updates',
    event_type text not null
        check (event_type in ('subscribed', 'unsubscribed', 'bounced', 'complained', 'suppressed')),
    source text not null,
    provider_event_id text,
    metadata jsonb not null default '{}'::jsonb,
    occurred_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists email_subscription_events_provider_event_key
    on public.email_subscription_events (provider_event_id)
    where provider_event_id is not null;

create index if not exists email_subscription_events_user_time_idx
    on public.email_subscription_events (user_id, occurred_at desc);

alter table public.email_subscription_events enable row level security;

create or replace function public.create_email_preference_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    subscribed boolean;
    source text;
begin
    if new.email is null then
        return new;
    end if;

    subscribed := case
        when lower(coalesce(new.raw_user_meta_data ->> 'product_updates_subscribed', 'true')) = 'false'
            then false
        else true
    end;

    source := case
        when new.raw_user_meta_data ? 'product_updates_subscribed'
            then 'registration_choice'
        else 'registration_default'
    end;

    insert into public.email_preferences (
        user_id,
        email,
        product_updates_subscribed,
        subscription_source,
        subscribed_at,
        unsubscribed_at
    ) values (
        new.id,
        lower(new.email),
        subscribed,
        source,
        case when subscribed then timezone('utc', now()) else null end,
        case when subscribed then null else timezone('utc', now()) end
    ) on conflict (user_id) do nothing;

    insert into public.email_subscription_events (
        user_id,
        email,
        event_type,
        source
    ) values (
        new.id,
        lower(new.email),
        case when subscribed then 'subscribed' else 'unsubscribed' end,
        source
    );

    return new;
end;
$$;

drop trigger if exists on_auth_user_created_email_preference on auth.users;

create trigger on_auth_user_created_email_preference
    after insert on auth.users
    for each row execute procedure public.create_email_preference_for_auth_user();

insert into public.email_preferences (
    user_id,
    email,
    product_updates_subscribed,
    subscription_source,
    subscribed_at,
    resend_sync_status
)
select
    id,
    lower(email),
    true,
    'legacy_default',
    timezone('utc', now()),
    'pending'
from auth.users
where email is not null
on conflict (user_id) do nothing;

insert into public.email_subscription_events (
    user_id,
    email,
    event_type,
    source
)
select
    p.user_id,
    p.email,
    'subscribed',
    'legacy_default'
from public.email_preferences p
where p.subscription_source = 'legacy_default'
  and not exists (
      select 1
      from public.email_subscription_events e
      where e.user_id = p.user_id
        and e.source = 'legacy_default'
  );

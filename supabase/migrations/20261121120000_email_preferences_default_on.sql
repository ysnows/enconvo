-- Product update emails are on by default again (the user's call on 2026-11-21). The box on
-- /register starts checked, and an account created without a choice (Google or Apple sign-in, the
-- app's email code) is subscribed. A choice the person made still wins, and every email carries a
-- one-click unsubscribe. This reverses the default of 20261025120000_email_preferences_opt_in.sql.

alter table public.email_preferences
    alter column product_updates_subscribed set default true;

alter table public.email_preferences
    alter column subscription_source set default 'registration_default';

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

    subscribed := lower(coalesce(new.raw_user_meta_data ->> 'product_updates_subscribed', 'true')) = 'true';

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

-- Accounts created under the opt-in default without a choice ('no_choice') are subscribed too,
-- each with an event that says why. Accounts that chose, or whose address stopped working, keep
-- what they have.
with switched as (
    update public.email_preferences
       set product_updates_subscribed = true,
           subscription_source = 'registration_default',
           subscribed_at = timezone('utc', now()),
           unsubscribed_at = null,
           resend_sync_status = 'pending',
           updated_at = timezone('utc', now())
     where subscription_source = 'no_choice'
       and product_updates_subscribed = false
       and deliverability_status = 'active'
    returning user_id, email
)
insert into public.email_subscription_events (user_id, email, event_type, source, metadata)
select user_id, email, 'subscribed', 'default_on_backfill',
       jsonb_build_object('migration', '20261121120000_email_preferences_default_on')
from switched;

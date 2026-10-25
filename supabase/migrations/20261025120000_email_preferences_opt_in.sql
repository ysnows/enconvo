-- Product update emails are marketing, so an account is subscribed only when its owner opted in
-- (the unchecked "Send me occasional product updates" box on /register, or the Account page).
-- Until now a new account without an explicit choice, such as one Google created from the
-- sign-in page, was subscribed by default. Existing rows are left as they are.

alter table public.email_preferences
    alter column product_updates_subscribed set default false;

alter table public.email_preferences
    alter column subscription_source set default 'no_choice';

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

    subscribed := lower(coalesce(new.raw_user_meta_data ->> 'product_updates_subscribed', 'false')) = 'true';

    source := case
        when new.raw_user_meta_data ? 'product_updates_subscribed'
            then 'registration_choice'
        else 'no_choice'
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

# Supabase Auth email templates

Source for the emails Supabase Auth sends. Supabase doesn't read these files: the live
templates are in the dashboard (Authentication > Emails > Templates), so a change here
goes live only when it is pasted there.

| File | Dashboard template | Subject |
|---|---|---|
| `confirmation.html` | Confirm signup | Confirm your Enconvo account |
| `recovery.html` | Reset password | Reset your Enconvo password |

## How the link works

When the redirect is on this site, each button links to the website's `/auth/confirm` page
(`src/pages/auth/confirm.tsx`). The top of each template picks the link:

```
{{ $link := .ConfirmationURL }}
{{ if ge (len .RedirectTo) 24 }}{{ if eq (slice .RedirectTo 0 24) "https://www.enconvo.com/" }}
  {{ $link = printf "%s/auth/confirm?token_hash=%s&type=signup&redirect_to=%s" .SiteURL .TokenHash (urlquery .RedirectTo) }}
{{ end }}{{ end }}
```

The page signs in with `supabase.auth.verifyOtp({ token_hash, type })`, so the link works in
any browser: on a phone, in another browser, or in a mail app's web view. The default
`{{ .ConfirmationURL }}` link ends in a PKCE code that only the browser that began the
sign-up can exchange, so elsewhere the account was activated but nobody was signed in, and
an app sign-up never reached the app.

After signing in, the page goes to `redirect_to`, the address the site passed as
`emailRedirectTo` (sign-up) or `redirectTo` (password reset). That address carries the app
hand-off (`from=app`, `source`, `handoff`), a `returnUrl`, and the page language, so
`/login` still opens Enconvo for a sign-up that started in the app. The page only follows a
`redirect_to` on its own site; anything else goes to `/login` (or `/reset_password` for a
recovery link).

Any other redirect keeps Supabase's own `{{ .ConfirmationURL }}`. The feedback site
(`feedback.enconvo.com`) uses the same Supabase project: its email sign-in asks for a link
with `create_user`, and a new address gets this Confirm signup email, whose link must go back
to the feedback site's callback. A redirect that wasn't allowed arrives as the bare Site URL,
which also keeps Supabase's link.

Variables used, from Supabase's
[email template docs](https://supabase.com/docs/guides/auth/auth-email-templates):

- `{{ .SiteURL }}`: the project's Site URL.
- `{{ .TokenHash }}`: the hashed one-time token that `verifyOtp` takes.
- `{{ .RedirectTo }}`: the redirect the sign-up or reset passed, if it is on the
  allow-list; otherwise the Site URL.
- `{{ .ConfirmationURL }}`: Supabase's own verify link, used for redirects off this site.

Supabase renders templates with Go's `html/template`. `urlquery` percent-encodes the
redirect, so the button and the plain-text copy under it carry the same link.

## Dashboard steps

Do these in order; nothing here is applied automatically.

1. Deploy the website with `/auth/confirm` first. A template that links there before
   the page is live sends people to a 404.
2. Authentication > URL Configuration:
   - Site URL: `https://www.enconvo.com`. The link is built from it, and `/auth/confirm`
     only follows redirects on the origin it is served from.
   - Redirect URLs: keep entries that allow the addresses the site passes, for example
     `https://www.enconvo.com/**`. These are the same `/login`, `/auth/callback`, and
     `/reset_password` addresses the current emails use, so no new entry should be
     needed. A redirect that isn't allowed becomes the Site URL, and the email then
     carries Supabase's own link, which lands on the home page without the app hand-off.
     `https://feedback.enconvo.com/api/auth/callback` must stay allowed for the feedback
     site's email sign-in.
3. Authentication > Emails > Templates:
   - Confirm signup: set the subject above and paste `confirmation.html`.
   - Reset password: set the subject above and paste `recovery.html`.
4. Send a test sign-up and a test reset to an address you own, and open each link in a
   different browser from the one that started it.

Emails sent before the switch keep their old link, which still works in the browser that
started the sign-up.

## Notes

- A mail scanner that only fetches the page doesn't spend the token: `/auth/confirm`
  verifies in the browser with JavaScript. A scanner that runs the page's scripts still can.
  The person then sees the expired-link page and can get a new link there.
- `supabase/config.toml` doesn't point at these files on purpose. That file sets almost
  nothing, so pushing it with the Supabase CLI could reset other Auth settings to the
  CLI's defaults.
- The logo loads from `https://www.enconvo.com/brand/enconvo-icon-512.png`; keep that
  file in `public/brand/`.

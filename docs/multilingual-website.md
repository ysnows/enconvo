# Multilingual website

The website supports English (`en`), Simplified Chinese (`zh-CN`), Traditional Chinese (`zh-TW`), Japanese (`ja`), Korean (`ko`), Spanish (`es`), German (`de`), French (`fr`), Italian (`it`), European Portuguese (`pt`), Dutch (`nl`) and Polish (`pl`). English keeps the existing URLs; other languages use a path prefix, such as `/zh-CN/use-cases`. Next.js Pages Router handles locale detection and the `NEXT_LOCALE` preference cookie. The desktop language selector is anchored to the right edge of the header, and the mobile selector is to the right of the menu button; screens below 1280px use the collapsed menu to accommodate longer translated links.

`src/i18n/config.json` is the routing configuration. `src/i18n/messages/` contains the eleven translation catalogs, keyed by the original English copy. English is the fallback. `scripts/generate-i18n-message-map.mjs` follows page imports and builds the per-page message map; `npm run build` runs it automatically. Run it after changing copy during development. Page data loaders send only the current language's relevant messages to the browser, so initial HTML and client navigation use the same messages. Shared components call `useI18n().t(source, values)`. Use `I18nText` for complete sentences containing links, emphasis or dynamic values so translations can reorder the values without changing their markup or escaping.

Interpolation uses named placeholders (`{count}` or `{p0}`). Keep every placeholder in every translation. Data helpers and server errors that produce English sentences can match an explicitly registered complete template; unregistered text stays unchanged. Never pass user names, emails, prompts or other user-authored content to translation. Prices, currency, IDs, model names, product names, plan keys, API requests and native app links keep their existing meaning.

Public page titles, descriptions, Open Graph metadata, structured data, canonical links and language alternatives follow the page locale. Run `node scripts/generate-i18n-sitemap.mjs` after changing the public language list or sitemap paths. Historical release notes and existing screenshots/videos keep their original language; the release browser's controls and dates are localized.

Language switching preserves the current path, query parameters and fragment. OAuth and email redirects keep the existing callback paths and carry the language in a query parameter, so no new callback path is needed in Supabase's allowlist. Website Stripe checkout and billing portal handlers use the selected language for return URLs; amounts, price IDs and entitlement behavior stay unchanged. The provider remembers the current language with a cookie shared by the bare and www production domains. Middleware restores that preference only for the trial-code Worker’s existing unprefixed success/cancel URLs, retaining all query parameters; normal payments and unrelated routes keep their explicit locale.

Verification commands:

```sh
node scripts/check-i18n.mjs
node scripts/check-i18n-pages.mjs
npm run build
```

Set `I18N_CHECK_SITE` for the page check (default `http://localhost:3001`). Real account OAuth, email delivery and a completed Stripe purchase still require integration verification with an authorized test account; the local checks cover rendering, routing, metadata, interpolation, search and checkout return URL construction without creating a payment.

Release verification uses an isolated source snapshot with `pnpm install --frozen-lockfile`, followed by the standard `npm run build`. The repository's pnpm lock resolves `@typescript-eslint/parser@5.62.0`; the existing local npm tree instead has parser 5.29.0, which fails against TypeScript 5 with the `originalKeywordKind` deprecation error. Do not disable production lint or change dependencies just to work around that stale local npm tree.

The two language events override GA4's automatically derived page location, title and referrer with a fixed public homepage, the Enconvo brand and an empty referrer. This prevents private paths, query parameters and dynamic page titles from entering those events. Existing analytics events retain their behavior. See [GA4 configuration fields](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).

Verified locally: the isolated standard production build passed lint, types and 361 static-page generation steps. All 12 languages passed 204 public/private/404 page checks, SEO, picker deduplication and trial-code return preference checks. The financial regression suite passed 35/35, including all supported checkout and billing portal return languages. English discovery, navigation and share-card crawler checks passed. Representative Edge layouts passed at 320px, 390px, 1024px, 1280px and 1920px with no horizontal overflow or overlapping controls; the desktop selector remains 24px from the viewport edge. A real German-to-Spanish switch preserved its query and fragment. Auth language-hint switching, sign-up checkout language, pure promotion date formatting, all 2011 messages in 11 catalogs and privacy-safe language event payloads passed their focused regression checks. Real OAuth/email/purchase completion, physical Safari/iPhone, independent native-speaker review and GA4 reporting readback remain unverified.

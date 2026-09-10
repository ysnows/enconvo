# Homepage navigation from secondary pages

Features and Pricing in the shared site header used document-relative fragments.
From Use Cases, these resolved to `/use-cases#features` and
`/use-cases#pricing`, where neither section exists.

Both the default and signed-in navigation now use `/#features` and `/#pricing`.
Desktop links and the mobile menu share these definitions. The homepage, Use
Cases and Releases consume this header. Footer links already point to the
homepage and need no changes. Authentication, account links, billing and the
section layout are unchanged.

## Verification

- `node scripts/check-homepage-navigation.mjs` reproduced the original failure
  before the fix, then passed against development and the production server.
  It checks every literal navigation variant (including signed-in links),
  URL resolution from all three consumer pages, actual header/footer links
  in served HTML, and the existence of the homepage target sections.
- Standard `npm run build` passed with lint and TypeScript checks, producing
  all 28 static pages. Used an isolated checkout of the intended release with
  dependencies from the frozen pnpm lock, preserving the running development
  server and unrelated local video-data changes. Existing nonfatal lint and
  page-size warnings remain. Build log: `/tmp/enconvo-navigation-release-build.log`.
- Browser checks covered Use Cases to Features/Pricing, Releases to Features,
  and the Use Cases footer to Pricing. At 1280px, the feature/pricing sections
  land at 80px/64px respectively and their headings are below the fixed header.
- Production browser checks at 390px covered both mobile menu links. Each
  returns to the homepage section and closes the menu; headings remain visible.
- No extension modules changed, so module builds do not apply. Real authenticated
  account sessions were not used; both signed-in link definitions are covered
  by the source-based regression check. No new navigation risk found in the
  tested routes.

Run the served-page checks against a different environment with:

```sh
NAV_CHECK_SITE=https://www.enconvo.com node scripts/check-homepage-navigation.mjs
```

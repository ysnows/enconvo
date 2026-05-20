# EnConvo Website Design System

## Visual Theme & Atmosphere

EnConvo should feel like a native macOS command center expanded into a marketing site: dark, fast, precise, and product-led. The page chrome uses a near-black canvas, in-app screenshots, hairline borders, tight radii, and subtle translucent surfaces. Decorative elements should feel like refracted glass or command-palette light, not generic gradients or floating blobs. The product UI is the hero visual signal; the surrounding design should support it rather than compete with it.

## Color Palette & Roles

- **Canvas**: `#07080A` — full-page background, matching dark app chrome.
- **Header Surface**: `#071014` — sticky navigation and dark glass overlays.
- **Surface**: `#0D0D0D` — primary panels, release sections, timeline index.
- **Surface Elevated**: `#101111` — raised product screenshot panels and hover states.
- **Surface Card**: `#121212` — small repeated feature/release cards.
- **Hairline**: `#242728` — default 1px borders and dividers.
- **Hairline Strong**: `rgba(255,255,255,0.16)` — focused or hero-level borders.
- **Primary Text**: `#F4F4F6` — display headings and important labels.
- **Body Text**: `#CDCDCD` — paragraphs and changelog content.
- **Muted Text**: `#9C9C9D` — dates, captions, secondary navigation.
- **Ash Text**: `#6A6B6C` — low-emphasis metadata.
- **Primary CTA**: `#FFFFFF` — primary action background.
- **On Primary**: `#000000` — text on white CTA.
- **Accent Blue**: `#57C1FF` — informational details, release-source signals.
- **Accent Green**: `#59D499` — latest/success states.
- **Accent Yellow**: `#FFC533` — warning or provider/model highlights.
- **Accent Red**: `#FF6161` — hero stripe, high-priority product energy.

## Typography Rules

- Use Inter when available, with `system-ui` as fallback.
- Enable `font-feature-settings: "calt", "kern", "liga", "ss03"` on the page shell.
- Display: 56-72px, weight 600, line-height 1.05-1.12, letter spacing 0.
- Section headings: 28-40px, weight 600, line-height 1.2.
- Card headings: 16-20px, weight 600, line-height 1.4.
- Body: 14-18px, weight 400, line-height 1.6.
- Metadata labels: 11-13px, uppercase, positive tracking from 0.12em to 0.2em.
- Do not use negative tracking. Do not scale font size with viewport width.

## Component Styling

- **Primary Buttons**: white fill, black text, 8px radius, 14px/500 type, compact padding. Use icons when the action is concrete.
- **Secondary Buttons**: transparent or `#101111` fill, `#242728` border, white text, 8px radius.
- **Release Hero**: left-aligned content, right-side product screenshot panel, restrained crystal/refraction accents behind content.
- **Product Screenshot Panel**: `#101111` surface, 1px strong hairline border, 8-10px radius, no heavy shadow. Use the screenshot as the visual anchor.
- **Timeline Index**: sticky left panel on desktop, `#0D0D0D` surface, hairline border, uppercase label, compact rows.
- **Release Sections**: timeline bands, not cards inside cards. Use top dividers and small accent bars for hierarchy.
- **Release Detail Cards**: only repeated section groups get framed cards. Use `#121212`, hairline border, 8px radius, 16-24px padding.
- **Badges**: 4-6px radius, small uppercase type, dark surface fill with one semantic accent.

## Layout Principles

- Use a max content width near 1240px with 24px mobile gutters and 32-48px desktop gutters.
- Major section rhythm should be close to 96px vertical spacing.
- Keep the site in one continuous dark mode; avoid abrupt light bands.
- Prefer a two-column hero on desktop and a single-column stack on mobile.
- Do not put UI cards inside other UI cards. If a release is a container, make inner content unframed; if inner content is framed, make the release itself a timeline band.
- Product screenshots must remain readable and unobscured.

## Depth & Elevation

- Use a dark surface ladder instead of broad drop shadows: `#07080A` -> `#0D0D0D` -> `#101111` -> `#121212`.
- Use 1px borders for separation. Borders should usually be `#242728` or white at 8-16% opacity.
- Use backdrop blur only on sticky navigation and hero glass panels.
- Decorative crystal shapes should sit behind content, be low-opacity, and never overlap text enough to reduce readability.
- Use one strong decorative moment per page: a refracted hero stripe or crystal band, not multiple competing effects.

## Responsive Behavior

- Navigation collapses by hiding secondary links before crowding the logo and primary CTA.
- Hero media stacks below text on smaller screens.
- Timeline index moves above content or becomes a normal block below desktop widths.
- Release section cards collapse from two columns to one column.
- Buttons wrap cleanly with at least 44px touch height on mobile.

## Do's

- Use product screenshots as the primary visual asset.
- Use hairline borders, restrained surfaces, and compact controls.
- Use white for the primary CTA and dark chrome for all secondary controls.
- Use accent colors as small signals, not full-page themes.
- Keep release notes highly scannable with dates, version labels, and section bars.

## Don'ts

- Do not use large decorative orbs, bokeh blobs, or one-note gradients.
- Do not place decorative elements over important text.
- Do not create nested card stacks.
- Do not introduce rounded pill buttons for ordinary actions; use 8px-radius buttons.
- Do not let the page become mostly blue, purple, brown, or beige.

## Agent Prompt Guide

When editing EnConvo UI, preserve the dark command-center chrome: `#07080A` canvas, `#0D0D0D` surfaces, `#242728` hairline borders, Inter/system typography with `ss03`, white primary CTAs, and restrained semantic accents (`#57C1FF`, `#59D499`, `#FFC533`, `#FF6161`). Build layouts around the real product UI whenever possible.

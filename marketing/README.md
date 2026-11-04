# KEV Marketing

The launch campaign for KEV — the immersive online school from Sans Mercantile
(`kev.sansmercantile.com`). Follows the same structure as the Priv marketing
folder so the growth engine, asset factory and ClickUp pipeline can consume it
without new infrastructure.

## Files

| File | What it is |
| --- | --- |
| `00-ROADMAP.md` | Status, sequencing, phases |
| `01-PRODUCT-FACT-SHEET.md` | Quotable, verifiable facts only + approved phrasing + hard no's |
| `02-COPY-BANK.md` | Every headline/eyebrow/sub-head/CTA/caption in one place |
| `03-CAMPAIGN-PLAN.md` | Positioning, audience, pillars, channel × format, 6-week cadence, KPIs |
| `04-LANDING-PAGES.md` | Six programmatic-SEO pages (one per pillar), ready to publish |
| `05-FIRST-LINKEDIN-ARTICLE.md` | Week-1 LinkedIn article, ready for review |

## Brand voice (one paragraph)

Warm, child-safe, school-credible. Declarative short sentences, numerals where
they help ("11 floors · 2,234 structures · 185+ subjects"). Second person for
the student, first person plural for the school. No hype, no trading language,
no performance claims. All facts from the fact sheet — if it's not on screen,
it's not in an ad. The three owned words: **Immersive**, **Real**, **Yours**.

## Plugging into the growth engine

KEV plugs into the existing product-agnostic infrastructure:
- `pr_content_engine/config.py` — add a `NEXUS_COLORS` token + a `PRODUCTS`
  entry for KEV, then create the 52-week LinkedIn plan task following the
  existing naming pattern.
- Growth agent (`pr-growth-agent` Lambda) — the owned/social/paid modules are
  product-config driven; point the product config at this folder.
- Asset factory (`marketing/build/` in the Priv repo) — brand tokens (house
  gold, mark) swap to the KEV mark; the poster/video templates are reusable.

## Guardrails (hard rules)

1. All facts verifiable from the live app (see `01-PRODUCT-FACT-SHEET.md`).
2. No performance/learning-outcome claims, ever.
3. No literal "5D", no quantum-hardware claims, no camera-surveillance framing,
   no fake multiplayer. Honest versions are in the fact sheet.
4. Child-safe imagery and language; house gold, never alarm-red.

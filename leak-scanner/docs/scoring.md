# Scoring — how the numbers are made

All scores are **deterministic**: pure functions over signals extracted from the
scanned pages. AI never sets or adjusts a score. Rules live in
`lib/scoring/rules.ts`; the combiner lives in `lib/scoring/engine.ts`.

## Pipeline

1. Fetch homepage + up to 4 detected internal pages (contact/about/services/reviews).
2. Extract structured signals (headings, links, buttons, forms, phones, emails,
   schema.org types, social links, visible text). No script execution.
3. Run every rule. Each rule returns `{ detected, evidence }`. Evidence is a short
   quote/paraphrase from the site so reports can show *why*.
4. Category score = (earned weight / total weight) × 100, rounded.
5. Revenue Leak Score = weighted average of category scores.

## Category weights (Revenue Leak Score)

| Category | Weight | Why |
|---|---|---|
| Website Conversion | 25% | closest to lost calls/bookings |
| Local Visibility | 20% | being findable and obviously local |
| AI Visibility | 20% | being understandable to answer engines |
| Trust & Proof | 20% | being choosable by skeptical visitors |
| Follow-Up Readiness | 15% | not losing captured demand |

## Rules and weights

Weights within each category sum to 100.

### Website Conversion
| Rule | Weight |
|---|---|
| Phone number visible | 10 |
| Clear primary CTA in hero | 10 |
| Contact/booking form detected | 10 |
| Services clearly listed | 10 |
| Mobile viewport meta present | 10 |
| Testimonials/reviews detected | 10 |
| Contact page detected | 10 |
| Offer/differentiator language | 10 |
| Low-friction CTA (call/book/short form) | 10 |
| Title + meta description set | 10 |

### Local Visibility
| Rule | Weight |
|---|---|
| City/state mentioned | 15 |
| Service area described | 10 |
| NAP (name/address/phone) detected | 10 |
| Location/service-area page | 10 |
| Local reviews/testimonials | 10 |
| LocalBusiness schema | 10 |
| Service + city keyword pairing | 10 |
| Clear business category in headline | 10 |
| Map/directions/location signal | 10 |
| Local proof language | 5 |

### AI Visibility
| Rule | Weight |
|---|---|
| Clear service sections | 15 |
| FAQ content | 10 |
| About/expertise content | 10 |
| Differentiators ("why choose us") | 10 |
| Buyer-question content (cost/how long/vs) | 10 |
| Structured headings (H1 + sections) | 10 |
| Location + service clarity in title | 10 |
| Proof/reviews in crawlable text | 10 |
| Process explanation ("how it works") | 10 |
| Structured data present | 5 |

### Trust & Proof
| Rule | Weight |
|---|---|
| Testimonials/reviews | 15 |
| Team/about page | 10 |
| Photos/gallery/portfolio | 10 |
| Certifications/license language | 10 |
| Guarantees/warranties | 10 |
| Before/after or case studies | 10 |
| Years in business | 10 |
| Clear contact info | 10 |
| Social links | 10 |
| Metadata completeness | 5 |

### Follow-Up Readiness
| Rule | Weight |
|---|---|
| Lead capture form | 15 |
| Booking/scheduling link | 15 |
| Quote/estimate CTA | 10 |
| Response-time promise | 10 |
| Email capture | 10 |
| Multiple contact options | 10 |
| CRM/automation indicators | 10 |
| Follow-up / missed-call language | 10 |
| Next-step/confirmation language | 5 |
| Calendar/scheduler link | 5 |

## Verdict bands (Revenue Leak Score)

- **80–100** — "Strong foundation. A few leaks may still be costing you easy wins."
- **60–79** — "Good business, but several conversion leaks are likely reducing calls and bookings."
- **40–59** — "Your online presence is probably leaking meaningful revenue."
- **0–39** — "Your website and follow-up system may be making it harder for customers to choose you."

## Honesty rules

- Every failed rule maps to a recommendation whose copy only claims what we did
  or did not detect ("we couldn't detect…", "not detected on the pages we scanned").
- AI-visibility copy is hedged: "may struggle to recommend", "likely lacks clear
  signals", "based on your website's visible content".
- Sites we can't fetch produce a partial report that says so — never fabricated
  scores.

## Tuning

Weights are constants in `lib/scoring/rules.ts` (per rule) and
`lib/scoring/engine.ts` (`CATEGORY_WEIGHTS`). Change them there; unit tests in
`tests/scoring.test.ts` assert each category's weights sum to 100.

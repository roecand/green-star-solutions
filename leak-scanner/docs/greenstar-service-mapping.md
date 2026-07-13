# Greenstar service mapping

Every scoring rule that fails maps to exactly one recommendation, and every
recommendation maps to one Greenstar service (`lib/scoring/recommendations.ts`
→ `lib/services/catalog.ts`). A unit test enforces that the mapping is total.

## Services

1. **Website Conversion Rebuild** — weak homepage, weak CTAs, poor mobile
   layout, bad contact flow, unclear service messaging.
2. **CRM & Follow-Up Automation** — no instant response, nurturing,
   missed-call recovery, or quote follow-up.
3. **Review & Reputation System** — weak trust proof, low review volume, no
   review generation process.
4. **Local SEO Foundation** — missing service pages, location pages, schema,
   or clear local relevance.
5. **AI Visibility Upgrade** — site doesn't clearly explain services,
   differentiators, FAQs, proof, buyer questions.
6. **Lead Reactivation Campaign** — old leads/past customers with no email
   capture or reactivation path.
7. **Booking / Quote Funnel** — no clear path from visitor to booked
   call/estimate/quote.

## Rule → service map

| Failed rule | Service |
|---|---|
| conv_phone_visible, conv_primary_cta, conv_contact_page, conv_offer_language, conv_mobile_viewport | Website Conversion Rebuild |
| conv_contact_form, conv_low_friction_cta, followup_booking_link, followup_quote_cta, followup_next_step, followup_scheduler | Booking / Quote Funnel |
| conv_social_proof, local_reviews, ai_proof_reviews, trust_testimonials, trust_case_studies, trust_social_links | Review & Reputation System |
| conv_services_listed, conv_meta_basics, local_city_state, local_service_area, local_nap, local_location_page, local_schema, local_service_city_pairing, local_map_contact, local_proof_language, ai_location_service_clarity, ai_structured_data, trust_meta_completeness | Local SEO Foundation |
| ai_clear_services, ai_faq, ai_about_expertise, ai_differentiators, ai_buyer_questions, ai_structured_headings, ai_process_explanation | AI Visibility Upgrade |
| followup_form, followup_response_promise, followup_multiple_contact, followup_crm_indicators, followup_language | CRM & Follow-Up Automation |
| followup_email_capture | Lead Reactivation Campaign |
| local_clear_category, trust_team_about, trust_photos_portfolio, trust_certifications, trust_guarantee, trust_years_in_business, trust_clear_contact | Website Conversion Rebuild |

The report's "How Greenstar fixes this" section ranks services by how many
of the scan's recommendations point at each, so the pitch always matches the
actual findings.

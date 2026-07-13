# Launch checklist

## Technical pre-flight
- [ ] `npm run lint && npm run typecheck && npm run test` all green
- [ ] `npm run build` succeeds; app boots with production env
- [ ] `DATABASE_PATH` on persistent volume; backup job configured
- [ ] `NEXT_PUBLIC_APP_URL` set to the real domain (check a report email's link)
- [ ] Admin account created; default seed password changed
- [ ] Resend domain verified; test email lands in a real inbox (not spam)
- [ ] Stripe live: 3 prices created, webhook endpoint verified, test purchase + cancel round-trip
- [ ] `ANTHROPIC_API_KEY` set; run one scan and confirm `ai_source = "ai"` on the scan row
- [ ] Scan your own site + 2 real local businesses; sanity-check scores and copy
- [ ] Try a garbage URL and an unreachable site; confirm friendly failure
- [ ] Run a scan on a phone; check report layout + print-to-PDF output
- [ ] `/privacy` and `/terms` reviewed with real contact email

## Business pre-flight
- [ ] `NEXT_PUBLIC_BOOKING_URL` points at a real calendar with availability
- [ ] `ADMIN_NOTIFICATION_EMAIL` is an inbox Robert actually checks
- [ ] Demo reports seeded (`/demo` looks alive)
- [ ] Response plan: who replies to `requested_help` leads and how fast (target < 1 business hour)

## First 7 days (Robert's playbook)
1. **Day 1:** Scan 10 local businesses you'd want as clients (admin → mark as
   outreach targets). Send the copy-paste opener to 5.
2. **Day 2:** Post 1 UGC hook + a 30-second screen recording of a demo report
   (see marketing/short-form-video-scripts.md).
3. **Day 3:** Follow up day-1 outreach; send report links to responders;
   book first strategy calls.
4. **Day 4:** Scan 10 more; ask 2 friendly existing clients to run the free
   scan themselves (watch where they get confused).
5. **Day 5:** Post before/after content: "what a 34/100 looks like vs an 88/100".
6. **Day 6:** Review admin analytics: scanner starts vs completions vs report
   views. Fix the biggest drop-off.
7. **Day 7:** Email everyone who scanned but didn't request help: one useful
   tip from their report + soft CTA.

Weekly cadence after: 20 outreach scans, 2 content posts, follow up every
hot lead within a day.

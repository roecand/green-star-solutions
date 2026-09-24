# n8n workflows for the outbound engine

Business logic lives in the app; n8n only schedules and moves messages.
Import `n8n-scheduler.json` and build the other two by hand (5 minutes each).

## 1. Scheduler (import `n8n-scheduler.json`)

Schedule Trigger (every 3 minutes) → HTTP Request
`POST https://<app>/api/outbound/tick`, header
`Authorization: Bearer <OUTBOUND_CRON_SECRET>`. Timeout 300s.
The response JSON says what happened (`analyzed`, `drafted`, `sent`, `skipped`).
Overlapping runs are safe: the app holds a DB lease and returns `ran: false`.

## 2. Send from your Google Workspace mailbox (email provider `n8n`)

1. **Webhook** node: POST, path `greenstar-send`, Authentication = Header Auth
   (`Authorization` = `Bearer <OUTBOUND_WEBHOOK_SECRET>`), Respond = "Using
   'Respond to Webhook' node". Copy its production URL into
   `OUTBOUND_N8N_SEND_WEBHOOK_URL`.
2. **Gmail → Send a message**: To `{{$json.body.to}}`, Subject
   `{{$json.body.subject}}`, Email type = Text, Message `{{$json.body.text}}`.
   (Follow-ups share the "Re: …" subject; to thread properly use Gmail
   **Reply to a message** with Message ID `{{$json.body.threadProviderMessageId}}`
   when it's not empty — an IF node in front splits the two.)
3. **Respond to Webhook**: JSON `{"providerMessageId": "{{$json.id}}"}`.

The app sends one email per call and records the returned id. A non-2xx
response is a failed send: retried once, then the lead is marked FAILED.

## 3. Replies back into the app

1. **Gmail Trigger**: poll every minute, "Simplify" off, filter to INBOX.
2. **HTTP Request**: `POST https://<app>/api/outbound/webhooks/email`, header
   `Authorization: Bearer <OUTBOUND_WEBHOOK_SECRET>`, JSON body:
   ```json
   {
     "type": "reply",
     "email": "{{ $json.from.value[0].address }}",
     "subject": "{{ $json.subject }}",
     "content": "{{ $json.text }}",
     "id": "{{ $json.id }}"
   }
   ```
Mail from people who aren't leads comes back `unmatched` and is ignored.
Bounces (mailer-daemon) can be forwarded as `{"type":"bounce","email":"<original recipient>"}`.

import { NETLIFY_FORM_NAME } from "@/lib/config";

/**
 * Netlify detects forms by parsing the deployed static HTML at build time.
 * Our real form is rendered client-side in steps, so Netlify can't see its
 * fields. This hidden, server-rendered form declares the form name and every
 * field name so Netlify provisions the backend. Field names must match
 * ProjectForm's FormData keys exactly. (A duplicate of public/__forms.html.)
 */
export default function NetlifyFormDetect() {
  return (
    <form name={NETLIFY_FORM_NAME} data-netlify="true" netlify-honeypot="bot-field" hidden>
      <input type="hidden" name="form-name" defaultValue={NETLIFY_FORM_NAME} />
      <input name="bot-field" />
      <input name="business" />
      <input name="trade" />
      <input name="service_area" />
      <input name="current_site" />
      <input name="goals" />
      <textarea name="goal_notes" />
      <input name="current_marketing" />
      <input name="ad_budget" />
      <input name="name" />
      <input name="email" type="email" />
      <input name="phone" />
      <input name="best_time" />
    </form>
  );
}

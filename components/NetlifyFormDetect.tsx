import { NETLIFY_FORM_NAME } from "@/lib/config";

/**
 * Netlify detects forms by parsing the deployed static HTML at build time.
 * Our real form is rendered client-side in steps, so Netlify can't see its
 * fields. This hidden, server-rendered form declares the form name and every
 * field name (plus a file input) so Netlify provisions the backend. The live
 * multi-step form then POSTs to it. Field names must match ProjectForm's
 * FormData keys exactly.
 */
export default function NetlifyFormDetect() {
  return (
    <form
      name={NETLIFY_FORM_NAME}
      data-netlify="true"
      netlify-honeypot="bot-field"
      hidden
      {...{ enctype: "multipart/form-data" }}
    >
      <input type="hidden" name="form-name" defaultValue={NETLIFY_FORM_NAME} />
      <input name="bot-field" />
      <input name="business" />
      <input name="industry" />
      <input name="location" />
      <input name="current_site" />
      <input name="goals" />
      <textarea name="goal_notes" />
      <input name="style" />
      <input name="name" />
      <input name="email" type="email" />
      <input name="phone" />
      <input name="budget" />
      <input name="timeline" />
      <input name="uploads" type="file" multiple />
    </form>
  );
}

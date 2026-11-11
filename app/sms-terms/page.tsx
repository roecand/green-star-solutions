import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, PHONE } from "@/lib/config";

export const metadata: Metadata = {
  title: "SMS Terms",
  description:
    "Terms for text messages from Green Star Solutions: what you'll receive, how often, and how to opt out.",
};

export default function SmsTermsPage() {
  return (
    <LegalPage title="SMS Terms" updated="November 10, 2026">
      <h2>Program</h2>
      <p>
        Green Star Solutions sends text messages to people who contact us or
        request a call through our website. Messages include replies to your
        questions, scheduling and appointment confirmations, and follow-ups
        about your inquiry.
      </p>

      <h2>How you opt in</h2>
      <p>
        You opt in by texting our business number, or by checking the text
        message consent box when you submit a form on green-starsolutions.com.
        Consent to receive texts is not a condition of any purchase or service.
      </p>

      <h2>Message frequency</h2>
      <p>Message frequency varies based on your conversation with us.</p>

      <h2>Cost</h2>
      <p>
        Message and data rates may apply. Check with your mobile carrier for
        details about your plan.
      </p>

      <h2>Opting out</h2>
      <p>
        Reply <strong>STOP</strong> to any message to unsubscribe. You&rsquo;ll
        receive one final message confirming you&rsquo;ve been unsubscribed,
        and no further messages after that. Reply <strong>START</strong> to
        resubscribe.
      </p>

      <h2>Help</h2>
      <p>
        Reply <strong>HELP</strong> to any message for help, or contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or{" "}
        <a href={`tel:${PHONE.replace(/[^\d]/g, "")}`}>{PHONE}</a>.
      </p>

      <h2>Carriers</h2>
      <p>
        Mobile carriers are not liable for delayed or undelivered messages.
      </p>

      <h2>Privacy</h2>
      <p>
        We do not sell or share your mobile number or text messaging opt-in
        data with third parties for marketing purposes. See our{" "}
        <a href="/privacy/">Privacy Policy</a> for how we handle your
        information.
      </p>
    </LegalPage>
  );
}

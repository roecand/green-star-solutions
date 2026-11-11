import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL, PHONE, LOCATION } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Green Star Solutions collects, uses, and protects your information, including mobile numbers and text message opt-in data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 10, 2026">
      <p>
        Green Star Solutions (&ldquo;Green Star,&rdquo; &ldquo;we,&rdquo;
        &ldquo;us&rdquo;) is a design and marketing studio based in {LOCATION}.
        This policy explains what information we collect through
        green-starsolutions.com and our text messaging, how we use it, and the
        choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Information you give us.</strong> When you fill out a form on
          our site, we collect what you enter: your name, email, phone number,
          business name, trade, service area, website, and anything you tell us
          about your business and goals.
        </li>
        <li>
          <strong>Text messages.</strong> If you text us or agree to receive
          texts from us, we keep your mobile number, the messages exchanged,
          and a record of your consent and any opt-out.
        </li>
        <li>
          <strong>Usage data.</strong> We use Google Analytics to understand
          how visitors use our site (pages viewed, approximate location, device
          and browser type). This data is collected through cookies and is not
          used to identify you personally.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To respond to your inquiry and schedule the call you asked for.</li>
        <li>
          To send you text messages you agreed to receive, such as replies to
          your questions, appointment confirmations, and follow-ups about your
          inquiry.
        </li>
        <li>To prepare proposals and deliver work you hire us for.</li>
        <li>To improve our website and services.</li>
      </ul>

      <h2>Mobile numbers and text messaging</h2>
      <p>
        <strong>
          We do not sell, rent, or share your mobile number or text messaging
          opt-in data with third parties or affiliates for their marketing or
          promotional purposes.
        </strong>{" "}
        Your mobile number and consent are used only to send you the messages
        you signed up for. They may be processed by the messaging carriers and
        providers we use to deliver texts, solely to deliver those messages.
      </p>
      <p>
        You can opt out of texts at any time by replying <strong>STOP</strong>.
        Reply <strong>HELP</strong> for help. See our{" "}
        <a href="/sms-terms/">SMS Terms</a> for details.
      </p>

      <h2>Who we share information with</h2>
      <p>
        We do not sell your personal information. We share it only with
        service providers that help us run our business, such as our website
        host, form processing, analytics, and messaging providers, and only as
        needed to provide their service to us. We may also disclose information
        if required by law.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your information for as long as we need it to respond to you
        and serve you, or as required by law. You can ask us to delete it at
        any time.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Reply STOP to any text to stop receiving messages.</li>
        <li>
          Email us to see, correct, or delete the information we have about
          you.
        </li>
        <li>
          You can block or delete cookies in your browser settings, or opt out
          of Google Analytics with Google&rsquo;s browser add-on.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        Our services are for businesses. We do not knowingly collect
        information from anyone under 13.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we&rsquo;ll update the date at the top of
        this page.
      </p>

      <h2>Contact us</h2>
      <p>
        Green Star Solutions
        <br />
        {LOCATION}
        <br />
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <br />
        <a href={`tel:${PHONE.replace(/[^\d]/g, "")}`}>{PHONE}</a>
      </p>
    </LegalPage>
  );
}

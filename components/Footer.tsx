import StarMark from "./StarMark";
import { CONTACT_EMAIL, LOCATION, PHONE, SCANNER_URL } from "@/lib/config";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="/" className="footer__logo">
            <StarMark size={26} />
            <span>Green Star Solutions</span>
          </a>
          <p className="footer__line measure">
            A perception studio for the trades. We redesign how your company
            looks — brand, website, socials, ads — and run the follow-up
            system that turns the new attention into booked jobs.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          <span className="footer__col-label">Site</span>
          <a href="/#work">The Work</a>
          <a href="/#services">Departments</a>
          <a href="/#how">How it works</a>
          <a href="/portfolio/">Portfolio</a>
          <a href="/#start">Book a call</a>
          <a href={SCANNER_URL} target="_blank" rel="noopener noreferrer">
            Free Leak Scan
          </a>
        </nav>

        <div className="footer__contact">
          <span className="footer__col-label">Get in touch</span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <a href={`tel:${PHONE.replace(/[^\d]/g, "")}`}>{PHONE}</a>
          <span>{LOCATION}</span>
        </div>
      </div>

      <div className="container footer__base">
        <span>© {year} Green Star Solutions</span>
        <span className="footer__wink">
          Built by Green Star <StarMark size={11} /> yes, this site too.
        </span>
      </div>
    </footer>
  );
}

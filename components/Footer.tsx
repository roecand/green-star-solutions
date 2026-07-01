import StarMark from "./StarMark";
import { CONTACT_EMAIL, LOCATION, PHONE } from "@/lib/config";

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
            A growth agency for local service businesses. We build the website,
            run the ads, and automate the follow-up — so you get more calls,
            more booked jobs, and less busy work.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          <span className="footer__col-label">Site</span>
          <a href="/#services">Services</a>
          <a href="/#how">How it works</a>
          <a href="/#industries">Industries</a>
          <a href="/portfolio/">Portfolio</a>
          <a href="/#start">Book a call</a>
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

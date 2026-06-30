import StarMark from "./StarMark";
import { CONTACT_EMAIL, LOCATION, PHONE } from "@/lib/config";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="#top" className="footer__logo">
            <StarMark size={26} />
            <span>Green Star Solutions</span>
          </a>
          <p className="footer__line measure">
            An operations &amp; AI consultancy for Las Vegas service businesses.
            We start with the digital and stay for the operation.
          </p>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          <span className="footer__col-label">Site</span>
          <a href="#work">Work</a>
          <a href="#services">Services</a>
          <a href="#process">Process</a>
          <a href="#about">About</a>
          <a href="#start">Book a consult</a>
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

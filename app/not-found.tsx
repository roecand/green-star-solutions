import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main>
        <section className="section nf">
          <div className="container nf__inner">
            <p className="label">404. Page not found</p>
            <h1 className="wide t-display nf__title">
              This page took a day off.
            </h1>
            <p className="lead measure-wide nf__lead">
              The page you&rsquo;re looking for doesn&rsquo;t exist, but the
              work does. Head back home, or go straight to the portfolio.
            </p>
            <div className="nf__actions">
              <Link href="/" className="btn">
                Back to home
              </Link>
              <Link href="/portfolio/" className="btn btn--frost">
                View the portfolio
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

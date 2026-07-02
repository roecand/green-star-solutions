import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import StarMark from "@/components/StarMark";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main>
        <section className="section nf">
          <div className="container nf__inner">
            <p className="eyebrow eyebrow--ink">
              <StarMark size={14} /> 404 — page not found
            </p>
            <h1 className="display h-xl nf__title">
              This page took <span className="serif accent">a day off.</span>
            </h1>
            <p className="lead measure-wide nf__lead">
              The page you&rsquo;re looking for doesn&rsquo;t exist — but the
              work does. Head back home, or go straight to the portfolio.
            </p>
            <div className="nf__actions">
              <Link href="/" className="btn">
                Back to home
              </Link>
              <Link href="/portfolio/" className="btn btn--ghost">
                View the portfolio <span className="arrow">↗</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

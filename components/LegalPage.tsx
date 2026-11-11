import Nav from "./Nav";
import Footer from "./Footer";

/**
 * Shared shell for the legal pages (privacy, SMS terms). Plain reading
 * layout: a title, an effective date, then prose. No plates, no motion —
 * these pages exist to be read by carrier reviewers and careful customers.
 */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <main>
        <section className="section legal">
          <div className="container">
            <h1 className="wide t-2xl legal__title">{title}</h1>
            <p className="legal__updated">Last updated {updated}</p>
            <div className="legal__body">{children}</div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

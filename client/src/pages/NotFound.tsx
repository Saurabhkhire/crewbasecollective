import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto w-[90%] max-w-6xl px-4 py-24 pt-[130px] text-center">
      <h1 className="section-title">Page not found</h1>
      <p className="mt-3 text-[var(--muted)]">That page doesn&apos;t exist or may have moved.</p>
      <Link to="/" className="mt-6 inline-block text-[var(--cyan)] hover:underline">
        &larr; Back to home
      </Link>
    </div>
  );
}

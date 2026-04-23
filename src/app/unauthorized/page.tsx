import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <section className="mx-auto mt-20 max-w-xl rounded-xl bg-surface-container p-6 text-center">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p className="mt-2 text-sm text-on-surface/75">
        You do not have permission to view this page.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block rounded bg-primary-container px-4 py-2 font-semibold text-on-primary-fixed"
      >
        Back to home
      </Link>
    </section>
  );
}

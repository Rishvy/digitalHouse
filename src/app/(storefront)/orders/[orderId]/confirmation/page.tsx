export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="inline-block bg-primary-container px-2 py-1 text-xs font-semibold uppercase text-on-primary-fixed">
        Order placed
      </p>
      <h1 className="mt-4 text-4xl font-bold">Thank you for your order</h1>
      <p className="mt-3 text-on-surface/75">
        Your order ID is <span className="font-semibold">{orderId}</span>. We will update production status in your dashboard.
      </p>
    </section>
  );
}

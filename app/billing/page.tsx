export default function BillingPage() {
  return (
    <section className="max-w-xl rounded-lg border bg-white p-6">
      <h2 className="text-2xl font-semibold">Subscription</h2>
      <p className="mt-2 text-sm text-slate-600">Academic Life subscription is £12 / month with a 7-day trial.</p>
      <form action="/api/stripe/checkout" method="post" className="mt-5">
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">Start trial</button>
      </form>
    </section>
  );
}

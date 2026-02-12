import type { ReassuranceMessage } from "@/lib/reassurance";

export function ReassurancePanel({ result }: { result: ReassuranceMessage }) {
  return (
    <section className={`rounded-lg border p-4 ${result.level === "warning" ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
      <h3 className="mb-2 font-semibold">Reassurance</h3>
      <p className="text-sm text-slate-700">{result.message}</p>
    </section>
  );
}

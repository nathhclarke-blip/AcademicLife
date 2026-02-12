import { ReassurancePanel } from "@/components/reassurance-panel";
import { evaluateReassurance } from "@/lib/reassurance";
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: projects }, { data: chapters }, { data: subsections }, { data: papers }, { data: meetings }] = await Promise.all([
    supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    supabase.from("chapters").select("*").eq("project_id", (await supabase.from("projects").select("id").eq("user_id", user.id).limit(1).maybeSingle()).data?.id ?? ""),
    supabase
      .from("subsections")
      .select("*, chapters!inner(project_id)")
      .eq("chapters.project_id", (await supabase.from("projects").select("id").eq("user_id", user.id).limit(1).maybeSingle()).data?.id ?? ""),
    supabase.from("papers").select("*").eq("user_id", user.id),
    supabase.from("meetings").select("*").eq("user_id", user.id).gte("scheduled_date", new Date().toISOString()).order("scheduled_date")
  ]);

  const chapterList = chapters ?? [];
  const subsectionList = subsections ?? [];
  const completeChapters = chapterList.filter((chapter) => chapter.status === "complete").length;
  const completeSubsections = subsectionList.filter((subsection) => subsection.status === "complete").length;

  const chapterCompletionPct = chapterList.length ? Math.round((completeChapters / chapterList.length) * 100) : 0;
  const subsectionCompletionPct = subsectionList.length ? Math.round((completeSubsections / subsectionList.length) * 100) : 0;

  const activePapers = (papers ?? []).filter((paper) => !["accepted", "rejected"].includes(paper.status)).length;
  const lastCompletedSubsection = subsectionList
    .filter((subsection) => subsection.status === "complete")
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];

  const reassurance = evaluateReassurance({
    activePapers,
    lastSubsectionCompletedAt: lastCompletedSubsection?.created_at ?? null,
    fundingEndDate: projects?.[0]?.funding_end_date ?? null,
    chapterCompletionPct
  });

  const upcomingPaperDeadlines = (papers ?? []).filter((paper) => {
    if (!paper.deadline) return false;
    const deadline = new Date(paper.deadline);
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return deadline <= in30;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Active project</p>
          <p className="text-lg font-semibold">{projects?.[0]?.title ?? "No active project"}</p>
        </article>
        <article className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Chapter completion</p>
          <p className="text-lg font-semibold">{chapterCompletionPct}%</p>
        </article>
        <article className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">Subsection completion</p>
          <p className="text-lg font-semibold">{subsectionCompletionPct}%</p>
        </article>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 font-semibold">Upcoming deadlines (30 days)</h3>
          <ul className="space-y-2 text-sm">
            {upcomingPaperDeadlines.map((paper) => (
              <li key={paper.id} className="rounded bg-slate-50 px-2 py-1">{paper.title} · {paper.deadline}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-lg border bg-white p-4">
          <h3 className="mb-2 font-semibold">Upcoming meetings</h3>
          <ul className="space-y-2 text-sm">
            {(meetings ?? []).slice(0, 6).map((meeting) => (
              <li key={meeting.id} className="rounded bg-slate-50 px-2 py-1">{meeting.title} · {meeting.scheduled_date}</li>
            ))}
          </ul>
        </article>
      </div>
      <article className="rounded-lg border bg-white p-4">
        <p className="text-sm text-slate-500">Active papers</p>
        <p className="text-lg font-semibold">{activePapers}</p>
      </article>
      <ReassurancePanel result={reassurance} />
    </div>
  );
}

import { evaluateReassurance } from "@/lib/reassurance";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userProjects } = await supabase.from("projects").select("id,funding_end_date").eq("user_id", user.id).limit(1);
  const projectId = userProjects?.[0]?.id;

  const [{ data: chapters }, { data: subsections }, { data: papers }] = await Promise.all([
    supabase.from("chapters").select("status").eq("project_id", projectId),
    supabase.from("subsections").select("status,updated_at").eq("chapter_id", projectId ?? ""),
    supabase.from("papers").select("status").eq("user_id", user.id)
  ]);

  const chapterCompletionPct = chapters?.length
    ? Math.round((chapters.filter((chapter) => chapter.status === "complete").length / chapters.length) * 100)
    : 0;

  const result = evaluateReassurance({
    activePapers: papers?.filter((paper) => !["accepted", "rejected"].includes(paper.status)).length ?? 0,
    lastSubsectionCompletedAt: subsections?.find((subsection) => subsection.status === "complete")?.updated_at ?? null,
    fundingEndDate: userProjects?.[0]?.funding_end_date ?? null,
    chapterCompletionPct
  });

  return NextResponse.json(result);
}

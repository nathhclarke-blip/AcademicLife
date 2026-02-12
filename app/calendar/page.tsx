import { CalendarBoard } from "@/components/calendar-board";
import { createServerClient } from "@/lib/supabase/server";

export default async function CalendarPage() {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [subsections, papers, meetings] = await Promise.all([
    supabase.from("subsections").select("id,title,scheduled_date,chapters!inner(projects!inner(user_id))").eq("chapters.projects.user_id", user.id),
    supabase.from("papers").select("id,title,scheduled_date").eq("user_id", user.id),
    supabase.from("meetings").select("id,title,scheduled_date").eq("user_id", user.id)
  ]);

  const items = [
    ...(subsections.data ?? []).map((item) => ({ id: item.id, title: item.title, scheduled_date: item.scheduled_date, type: "subsection" as const })),
    ...(papers.data ?? []).map((item) => ({ id: item.id, title: item.title, scheduled_date: item.scheduled_date, type: "paper" as const })),
    ...(meetings.data ?? []).map((item) => ({ id: item.id, title: item.title, scheduled_date: item.scheduled_date, type: "meeting" as const }))
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Calendar</h2>
      <CalendarBoard items={items} />
    </div>
  );
}

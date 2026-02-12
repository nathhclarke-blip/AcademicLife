import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buildGoogleClient } from "@/lib/google-calendar";

type Type = "subsection" | "paper" | "meeting";

const mapTable = (type: Type) => {
  if (type === "subsection") return "subsections";
  if (type === "paper") return "papers";
  return "meetings";
};

async function syncGoogleEvent(userId: string, title: string, scheduledDate: string | null, existingEventId: string | null) {
  const { data: conn } = await supabaseAdmin.from("google_connections").select("refresh_token").eq("user_id", userId).maybeSingle();
  if (!conn?.refresh_token) return { googleEventId: existingEventId };

  const calendar = buildGoogleClient(conn.refresh_token);

  if (!scheduledDate && existingEventId) {
    await calendar.events.delete({ calendarId: "primary", eventId: existingEventId });
    return { googleEventId: null };
  }

  if (!scheduledDate) return { googleEventId: null };

  if (existingEventId) {
    await calendar.events.update({
      calendarId: "primary",
      eventId: existingEventId,
      requestBody: {
        summary: title,
        start: { date: scheduledDate },
        end: { date: scheduledDate }
      }
    });
    return { googleEventId: existingEventId };
  }

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      start: { date: scheduledDate },
      end: { date: scheduledDate }
    }
  });

  return { googleEventId: event.data.id ?? null };
}

export async function PATCH(request: NextRequest, { params }: { params: { type: Type; id: string } }) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { scheduledDate } = (await request.json()) as { scheduledDate: string | null };
  const table = mapTable(params.type);

  const { data: current } = await supabase.from(table).select("title,google_event_id").eq("id", params.id).single();
  const syncResult = await syncGoogleEvent(user.id, current?.title ?? "Academic Task", scheduledDate, current?.google_event_id ?? null);

  const { error } = await supabase
    .from(table)
    .update({ scheduled_date: scheduledDate, google_event_id: syncResult.googleEventId })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { type: Type; id: string } }) {
  const supabase = createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = mapTable(params.type);
  const { data: current } = await supabase.from(table).select("title,google_event_id").eq("id", params.id).single();
  const syncResult = await syncGoogleEvent(user.id, current?.title ?? "Academic Task", null, current?.google_event_id ?? null);

  await supabase.from(table).update({ scheduled_date: null, google_event_id: syncResult.googleEventId }).eq("id", params.id);
  return NextResponse.json({ ok: true });
}

"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import { useEffect, useMemo, useRef, useState } from "react";

type CalendarItem = {
  id: string;
  title: string;
  type: "subsection" | "paper" | "meeting";
  scheduled_date: string | null;
};

export function CalendarBoard({ items }: { items: CalendarItem[] }) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState(
    items.filter((i) => i.scheduled_date).map((i) => ({ id: `${i.type}:${i.id}`, title: i.title, start: i.scheduled_date! }))
  );

  const unscheduled = useMemo(() => items.filter((item) => !item.scheduled_date), [items]);

  useEffect(() => {
    if (!sidebarRef.current) return;
    const draggable = new Draggable(sidebarRef.current, {
      itemSelector: ".drag-item",
      eventData: (eventEl) => ({
        id: eventEl.getAttribute("data-id") ?? "",
        title: eventEl.getAttribute("data-title") ?? ""
      })
    });
    return () => draggable.destroy();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div ref={sidebarRef} className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Backlog</h3>
        <div className="space-y-2">
          {unscheduled.map((item) => (
            <div
              key={`${item.type}:${item.id}`}
              data-id={`${item.type}:${item.id}`}
              data-title={item.title}
              className="drag-item cursor-grab rounded-md border px-3 py-2 text-sm"
            >
              <p className="font-medium">{item.title}</p>
              <p className="text-xs uppercase text-slate-500">{item.type}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border bg-white p-3">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          editable
          droppable
          events={events}
          eventReceive={async (info) => {
            const [type, id] = info.event.id.split(":");
            await fetch(`/api/calendar/items/${type}/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduledDate: info.event.startStr })
            });
            setEvents((prev) => [...prev, { id: info.event.id, title: info.event.title, start: info.event.startStr }]);
          }}
          eventDrop={async (info) => {
            const [type, id] = info.event.id.split(":");
            await fetch(`/api/calendar/items/${type}/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduledDate: info.event.startStr })
            });
          }}
          eventClick={async (info) => {
            const shouldDelete = window.confirm(`Delete ${info.event.title}?`);
            if (!shouldDelete) return;
            const [type, id] = info.event.id.split(":");
            await fetch(`/api/calendar/items/${type}/${id}`, {
              method: "DELETE"
            });
            info.event.remove();
            setEvents((prev) => prev.filter((event) => event.id !== info.event.id));
          }}
        />
      </div>
    </div>
  );
}

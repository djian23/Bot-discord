import { prisma } from "@discord-manager/database";
import { EventsGrid } from "@/components/dashboard/events-grid";
import { CreateEventButton } from "@/components/forms/create-event-button";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { carts: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events</h1>
          <p className="text-sm text-white/50 mt-1">{events.length} events</p>
        </div>
        <CreateEventButton />
      </div>
      <EventsGrid events={events} />
    </div>
  );
}

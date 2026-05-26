import { prisma } from "@discord-manager/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSessionUser } from "@/lib/session";
import { CartsTable } from "@/components/dashboard/carts-table";
import { ExportButton } from "@/components/ui/export-button";

const PAGE_SIZE = 50;

interface CartsPageProps {
  searchParams: { status?: string; event?: string; page?: string };
}

export default async function CartsPage({ searchParams }: CartsPageProps) {
  const session = await getServerSession(authOptions);
  const userRole = getSessionUser(session)?.role ?? "STAFF";

  const status = searchParams.status && searchParams.status !== "ALL" ? searchParams.status : undefined;
  const eventId = searchParams.event || undefined;
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    ...(status ? { status } : {}),
    ...(eventId ? { event: { id: eventId } } : {}),
  };

  const [carts, total, events] = await Promise.all([
    prisma.cart.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      include: { event: { select: { name: true, id: true } } },
    }),
    prisma.cart.count({ where }),
    prisma.event.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Carts</h1>
          <p className="text-sm text-white/50 mt-1">{total} carts au total</p>
        </div>
        <ExportButton href="/api/export/claims" label="Exporter CSV" />
      </div>
      <CartsTable
        carts={carts}
        userRole={userRole}
        events={events}
        currentStatus={searchParams.status ?? "ALL"}
        currentEventId={eventId}
        page={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  );
}

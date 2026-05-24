import { prisma } from "@discord-manager/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CartsTable } from "@/components/dashboard/carts-table";

export default async function CartsPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role ?? "STAFF";

  const carts = await prisma.cart.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      event: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Carts</h1>
        <p className="text-sm text-white/50 mt-1">{carts.length} carts chargés</p>
      </div>
      <CartsTable carts={carts} userRole={userRole} />
    </div>
  );
}

import { WtsBuilder } from "@/components/dashboard/wts-builder";

export default function WtsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">WTS Generator</h1>
        <p className="text-sm text-white/50 mt-1">Génère des annonces WTS premium en quelques clics</p>
      </div>
      <WtsBuilder />
    </div>
  );
}

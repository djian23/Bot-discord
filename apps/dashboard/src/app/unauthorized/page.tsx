import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
      <div className="text-center space-y-4">
        <p className="text-5xl">🚫</p>
        <h1 className="text-2xl font-bold text-white">Accès refusé</h1>
        <p className="text-white/50">Tu n'as pas les permissions pour accéder au dashboard.</p>
        <Link href="/login" className="text-discord-blurple hover:underline text-sm">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

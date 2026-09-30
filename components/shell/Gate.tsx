"use client";
import { useAuth } from "@/lib/auth";
import Button from "@/components/ui/Button";

/* Ecran de connexion Google. Si Firebase n'est pas configure (.env.local absent),
   on laisse passer en mode local sans sauvegarde, pour developper l'interface. */
export default function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading, configure, connecter } = useAuth();
  if (!configure) return <>{children}</>;
  if (loading) return <div className="flex h-screen items-center justify-center text-sm text-gray-500">Chargement…</div>;
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm rounded-surface border border-gray-300 bg-white">
          <div className="plus-pattern h-1" />
          <div className="p-8 text-center">
            <h1 className="text-lg font-semibold text-gray-900">Deck2Editor</h1>
            <p className="mt-1 text-sm text-gray-500">Connectez-vous avec votre compte Google professionnel.</p>
            <Button variant="primary" pop className="mt-6 w-full" onClick={connecter}>Se connecter avec Google</Button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

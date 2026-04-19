"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAccount } from "@/lib/store/account";

/**
 * Synchronise le mode du store avec l'état de session.
 * À monter une fois en haut de chaque page applicative.
 */
export function AccountSync() {
  const { status, data } = useSession();
  const mode = useAccount((s) => s.mode);
  const setMode = useAccount((s) => s.setMode);
  const loadFromRemote = useAccount((s) => s.loadFromRemote);
  const clearLocal = useAccount((s) => s.clearLocal);

  useEffect(() => {
    if (status === "loading") return;
    const connected = !!data?.user;
    if (connected && mode !== "remote") {
      setMode("remote");
      // Le localStorage peut contenir des données d'un visiteur non connecté.
      // Après login, le composant de login a déjà tenté la migration. On
      // repart de zéro côté local pour ne pas afficher les anciens items.
      clearLocal();
      void loadFromRemote();
    } else if (!connected && mode !== "local") {
      setMode("local");
    } else if (connected) {
      // Déjà en mode remote — refetch au mount pour garder la liste à jour
      void loadFromRemote();
    }
  }, [status, data, mode, setMode, loadFromRemote, clearLocal]);

  return null;
}

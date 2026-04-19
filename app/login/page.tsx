"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { AuthLayout } from "@/components/AuthLayout";
import { useAccount } from "@/lib/store/account";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Connexion">
          <div className="text-sm text-stone-500">Chargement…</div>
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

/**
 * Whitelist le callbackUrl pour empêcher un open redirect.
 * N'autorise que les paths internes (commençant par "/") et rejette
 * les URLs protocol-relative ("//") et les URLs absolues ("http://").
 */
function sanitizeCallbackUrl(raw: string | null): string {
  const FALLBACK = "/app";
  if (!raw) return FALLBACK;
  // "//evil.com" ou "https://evil.com" → rejetés
  if (raw.startsWith("//")) return FALLBACK;
  if (!raw.startsWith("/")) return FALLBACK;
  // "/\\evil.com" (backslash trick sur certains browsers)
  if (raw.startsWith("/\\")) return FALLBACK;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Email ou mot de passe incorrect.");
        return;
      }
      await migrateLocalAssetsIfAny();
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accède à ton tableau de bord et à tes simulations."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-sun-700 font-medium hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base block">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base"
            placeholder="toi@exemple.fr"
          />
        </div>
        <div>
          <label className="label-base block">Mot de passe</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </AuthLayout>
  );
}

async function migrateLocalAssetsIfAny() {
  try {
    const local = useAccount.getState().list();
    if (local.length === 0) return;
    const payload = local.map((a) => ({
      name: a.name,
      kind: a.kind,
      status: a.status,
      inputs: a.inputs,
      snapshot: a.snapshot,
      realizedAt: a.realizedAt ? new Date(a.realizedAt).toISOString() : null,
    }));
    const res = await fetch("/api/assets/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assets: payload }),
    });
    if (res.ok) {
      useAccount.setState({ assets: {}, order: [] });
    }
  } catch (e) {
    console.warn("Migration localStorage → DB échouée", e);
  }
}

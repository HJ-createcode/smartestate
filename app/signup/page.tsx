"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { AuthLayout } from "@/components/AuthLayout";
import { useAccount } from "@/lib/store/account";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error ?? "Création impossible");
        return;
      }
      // Auto-login après création
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!loginRes || loginRes.error) {
        router.push("/login");
        return;
      }
      await migrateLocalAssetsIfAny();
      router.push("/");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="C'est gratuit. Tu conserves tes simulations d'un appareil à l'autre."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="text-sun-700 font-medium hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base block">Nom ou pseudo (facultatif)</label>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base"
            placeholder="Hugo"
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base"
            placeholder="8 caractères minimum"
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
          {loading ? "Création…" : "Créer mon compte"}
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

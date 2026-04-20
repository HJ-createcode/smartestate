"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { AuthLayout } from "@/components/AuthLayout";
import { useAccount } from "@/lib/store/account";
import {
  evaluatePassword,
  isValidPassword,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from "@/lib/password-policy";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwdFocused, setPwdFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwdRules = useMemo(() => evaluatePassword(password), [password]);
  const pwdValid = isValidPassword(password);
  // N'afficher la checklist qu'une fois que l'utilisateur a commencé à taper
  // ou quitté le champ avec une valeur invalide — évite de l'agresser à l'ouverture.
  const showChecklist = pwdFocused || password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Garde-fou client : le serveur re-vérifie de toute façon.
    if (!pwdValid) {
      setError("Le mot de passe ne respecte pas les règles ci-dessous.");
      return;
    }
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
      router.push("/app");
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
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPwdFocused(true)}
            onBlur={() => setPwdFocused(false)}
            className="input-base"
            placeholder={`Entre ${PASSWORD_MIN} et ${PASSWORD_MAX} caractères`}
            aria-describedby="pwd-rules"
          />
          {showChecklist && (
            <ul
              id="pwd-rules"
              className="mt-2 space-y-1 text-xs"
              aria-live="polite"
            >
              {pwdRules.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-center gap-2 ${
                    r.ok ? "text-emerald-700" : "text-stone-500"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                      r.ok
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-stone-100 text-stone-400"
                    }`}
                  >
                    {r.ok ? "✓" : "•"}
                  </span>
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !pwdValid || !email}
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

"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function Landing() {
  const { data: session, status } = useSession();
  const isAuthed = !!session?.user;

  return (
    <main className="bg-cream-50">
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-sun-800 bg-sun-100 px-3 py-1.5 rounded-full mb-6">
          <span aria-hidden>●</span>
          <span>Barèmes fiscaux 2026</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 leading-[1.1] tracking-tight">
          Investissement locatif&nbsp;:
          <br />
          <span className="text-sun-700">IR ou IS&nbsp;?</span> La réponse en
          chiffres, pas en slogans.
        </h1>
        <p className="mt-6 text-lg text-stone-700 max-w-2xl leading-relaxed">
          SmartEstate simule votre projet immobilier sur 10 ans. Il compare
          fiscalité des particuliers et impôt sur les sociétés, projette cash-flow
          et plus-value à la revente, et vous dit laquelle des deux structures
          coûte le moins cher — avec l&rsquo;écart exact en euros.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {isAuthed ? (
            <Link href="/app" className="btn-primary text-base px-5 py-3">
              Accéder à mon espace →
            </Link>
          ) : (
            <>
              <Link href="/app" className="btn-primary text-base px-5 py-3">
                Lancer une simulation
              </Link>
              <Link href="/signup" className="btn-secondary text-base px-5 py-3">
                Créer un compte gratuit
              </Link>
            </>
          )}
        </div>

        {!isAuthed && status !== "loading" && (
          <p className="mt-4 text-sm text-stone-500">
            Pas de carte bancaire. La première simulation démarre immédiatement,
            sans inscription.
          </p>
        )}
      </section>

      {/* CE QUE VOUS OBTENEZ */}
      <section className="border-t border-sun-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <h2 className="text-sm font-semibold text-sun-800 uppercase tracking-wider">
            Ce que vous obtenez
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900 max-w-3xl">
            Un seul formulaire. Trois questions essentielles pour un projet
            immobilier.
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureBlock
              number="01"
              title="Est-ce rentable&nbsp;?"
              body="Rendement brut, rendement net, TEG du prêt, frais de notaire détaillés, mensualité avec assurance. Les chiffres bruts sans enjolivure."
            />
            <FeatureBlock
              number="02"
              title="Quelle structure retenir&nbsp;?"
              body="IR en revenus fonciers ou IS en SCI à l'IS : comparaison année par année sur 10 ans, avec l'écart chiffré et la recommandation en sortie."
            />
            <FeatureBlock
              number="03"
              title="Et à la revente&nbsp;?"
              body="Plus-value IR avec abattements et surtaxe, plus-value professionnelle IS, capital restant dû. Vous voyez le net empoché selon l'horizon retenu."
            />
          </div>
        </div>
      </section>

      {/* COMMENT ÇA CALCULE */}
      <section className="bg-cream-50">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            <div className="md:col-span-2">
              <h2 className="text-sm font-semibold text-sun-800 uppercase tracking-wider">
                Comment ça calcule
              </h2>
              <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900">
                Les règles du Code général des impôts, rien de plus.
              </p>
              <p className="mt-4 text-stone-700 leading-relaxed">
                Aucune formule magique ni modèle propriétaire. Le moteur applique
                les barèmes en vigueur, point.
              </p>
            </div>
            <div className="md:col-span-3">
              <ul className="space-y-3">
                <RuleItem title="IR : barème progressif 2026">
                  Tranches 11 601&nbsp;/ 29 580&nbsp;/ 84 577&nbsp;/ 181 917 €.
                  Prélèvements sociaux 17,2 %. CSG déductible 6,8 %.
                </RuleItem>
                <RuleItem title="IS : taux PME">
                  15 % jusqu&rsquo;à 42 500 € de bénéfice, 25 % au-delà. Report
                  des déficits en avant.
                </RuleItem>
                <RuleItem title="Plus-value immobilière">
                  Abattements par année de détention (IR et prélèvements sociaux
                  calculés séparément), surtaxe au-dessus de 50 000 €.
                </RuleItem>
                <RuleItem title="Amortissement comptable">
                  Décomposition par composants (gros œuvre, toiture, façade,
                  agencements, installations). Utilisé uniquement sous IS.
                </RuleItem>
                <RuleItem title="Emprunt">
                  Tableau d&rsquo;amortissement mensuel complet, différé 6 mois,
                  calcul du TEG par méthode itérative.
                </RuleItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* POUR QUI / PAS POUR QUI */}
      <section className="bg-white border-t border-sun-100">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-sun-50 p-6 sm:p-8 border border-sun-100">
              <div className="text-2xl mb-3">👍</div>
              <h3 className="text-xl font-semibold text-stone-900">
                L&rsquo;outil est utile si…
              </h3>
              <ul className="mt-4 space-y-2.5 text-stone-700">
                <Li>Vous étudiez l&rsquo;achat d&rsquo;un bien locatif.</Li>
                <Li>
                  Vous hésitez entre détenir en direct, en SCI à l&rsquo;IR, ou en
                  SCI à l&rsquo;IS.
                </Li>
                <Li>
                  Vous voulez projeter votre cash-flow net d&rsquo;impôts sur 10 ans
                  avant de signer.
                </Li>
                <Li>
                  Vous préparez votre dossier pour un banquier ou votre expert-comptable.
                </Li>
              </ul>
            </div>
            <div className="rounded-2xl bg-stone-50 p-6 sm:p-8 border border-stone-200">
              <div className="text-2xl mb-3">👎</div>
              <h3 className="text-xl font-semibold text-stone-900">
                L&rsquo;outil ne remplace pas…
              </h3>
              <ul className="mt-4 space-y-2.5 text-stone-700">
                <Li>
                  Un conseil juridique ou fiscal personnalisé. Pour signer, voyez
                  un notaire et un expert-comptable.
                </Li>
                <Li>
                  L&rsquo;étude d&rsquo;un projet de promotion, de marchand de
                  biens ou de démembrement complexe.
                </Li>
                <Li>
                  Les cas transfrontaliers (résidence fiscale à l&rsquo;étranger,
                  bien hors France).
                </Li>
                <Li>
                  La négociation avec la banque&nbsp;: le TEG affiché est une
                  projection, pas une offre.
                </Li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream-50">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Questions fréquentes
          </h2>
          <div className="mt-8 divide-y divide-sun-100 border-y border-sun-100">
            <Faq q="Faut-il créer un compte pour essayer ?">
              Non. Vous pouvez lancer une simulation tout de suite&nbsp;;
              vos données restent dans votre navigateur. Le compte gratuit sert
              à retrouver vos simulations d&rsquo;un appareil à l&rsquo;autre et à
              les conserver durablement.
            </Faq>
            <Faq q="Qu'est-ce qui est gratuit, qu'est-ce qui sera payant ?">
              Aujourd&rsquo;hui tout est gratuit. Un abonnement à
              4,99 €/mois est prévu pour les fonctions avancées
              (comparateurs de crédit, simulations multi-associés complètes,
              exports PDF). Les simulations existantes resteront accessibles en
              lecture dans tous les cas.
            </Faq>
            <Faq q="Mes données sont-elles en sécurité ?">
              Hébergement Vercel (Frankfurt) et base Neon Postgres
              (Europe). Mot de passe stocké avec bcrypt. Aucune donnée n&rsquo;est
              partagée avec des tiers.
            </Faq>
            <Faq q="Les barèmes sont-ils à jour ?">
              Oui — barèmes IR, IS et plus-value applicables en 2026. En cas de
              changement législatif, le moteur est mis à jour avant que les
              nouvelles simulations n&rsquo;en tiennent compte.
            </Faq>
            <Faq q="Est-ce un conseil fiscal ?">
              Non. C&rsquo;est un outil de simulation pour éclairer votre
              décision. Avant de signer, confrontez les résultats à l&rsquo;avis
              de votre expert-comptable ou notaire.
            </Faq>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-sun-400">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">
            Prêt à chiffrer votre projet ?
          </h2>
          <p className="mt-4 text-stone-800 text-lg max-w-2xl mx-auto">
            Comptez cinq minutes pour saisir les inputs, quelques secondes
            pour obtenir le comparatif. Vous pourrez ensuite ajuster autant de
            fois que nécessaire.
          </p>
          <div className="mt-8">
            <Link
              href={isAuthed ? "/app" : "/app"}
              className="inline-flex items-center gap-2 bg-stone-900 text-white font-semibold px-6 py-3.5 rounded-lg hover:bg-stone-800 transition-colors text-base"
            >
              {isAuthed ? "Accéder à mon espace" : "Commencer une simulation"}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-stone-900 text-stone-300">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 font-semibold text-white">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-sun-300 text-stone-900 text-xs"
                  aria-hidden
                >
                  ◉
                </span>
                SmartEstate
              </div>
              <p className="mt-2 text-sm text-stone-400 max-w-md">
                Outil de simulation d&rsquo;investissement locatif. Ne constitue
                pas un conseil fiscal, juridique ou financier.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-x-8 gap-y-2 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">
                Se connecter
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Créer un compte
              </Link>
              <Link href="/app" className="hover:text-white transition-colors">
                Lancer une simulation
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-stone-800 text-xs text-stone-500">
            © {new Date().getFullYear()} SmartEstate. Barèmes fiscaux 2026.
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureBlock({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-cream-50 rounded-2xl p-6 border border-sun-100 h-full">
      <div className="text-xs font-bold text-sun-700 tracking-wider">
        {number}
      </div>
      <h3 className="mt-2 text-lg font-semibold text-stone-900">
        {title.replace(/&nbsp;/g, "\u00A0")}
      </h3>
      <p className="mt-2 text-stone-700 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function RuleItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 items-start">
      <span
        className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sun-400 shrink-0"
        aria-hidden
      />
      <div>
        <div className="font-semibold text-stone-900">{title}</div>
        <div className="text-sm text-stone-700 mt-0.5 leading-relaxed">
          {children}
        </div>
      </div>
    </li>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 items-start text-sm leading-relaxed">
      <span className="mt-1 text-sun-700" aria-hidden>
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group py-5">
      <summary className="flex cursor-pointer items-center justify-between list-none">
        <span className="font-semibold text-stone-900 pr-4">{q}</span>
        <span
          className="text-sun-700 text-xl transition-transform group-open:rotate-45 shrink-0"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="mt-3 text-stone-700 leading-relaxed">{children}</div>
    </details>
  );
}

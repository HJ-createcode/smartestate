/**
 * Crée (ou met à jour) un compte admin.
 *
 * Deux modes d'utilisation :
 *
 *   1. Interactif (recommandé, mot de passe jamais visible dans les logs
 *      ni l'historique shell) :
 *        npm run create-admin -- <email>
 *      → vous demande le mot de passe en prompt masqué.
 *
 *   2. Env var (scripts CI/CD) :
 *        ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin
 *
 *   ⚠️ L'ancien usage `npm run create-admin -- <email> <password>` reste
 *   accepté mais déprécié car le mot de passe persiste dans le bash history
 *   et la process list. Un avertissement s'affiche.
 *
 * Le statut "admin" n'est pas stocké en base : il est déterminé par
 * l'env var ADMIN_EMAILS. Ce script crée juste le compte ; l'email doit
 * figurer dans ADMIN_EMAILS pour que le panneau /admin soit accessible.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import * as readline from "readline";
import { Writable } from "stream";

function promptPassword(label: string): Promise<string> {
  return new Promise((resolve) => {
    // Writable muet : intercepte l'écho des caractères tapés pour masquer
    // le mot de passe dans le terminal.
    let muted = false;
    const mutedStdout = new Writable({
      write(chunk, _enc, cb) {
        if (!muted) process.stdout.write(chunk);
        cb();
      },
    });
    const rl = readline.createInterface({
      input: process.stdin,
      output: mutedStdout,
      terminal: true,
    });
    process.stdout.write(label);
    muted = true;
    rl.question("", (answer) => {
      muted = false;
      process.stdout.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let email = args[0] ?? process.env.ADMIN_EMAIL;
  let password = args[1] ?? process.env.ADMIN_PASSWORD;

  if (args.length >= 2) {
    console.warn(
      "⚠ Mot de passe passé en argv : visible dans l'historique shell et " +
        "la process list. Préférez `npm run create-admin -- <email>` pour " +
        "la prochaine fois (prompt masqué)."
    );
  }

  if (!email) {
    console.error(
      "Usage :\n" +
        "  npm run create-admin -- <email>                      (interactif)\n" +
        "  ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run create-admin (CI)\n" +
        "Exemple : npm run create-admin -- hugo.jentile@gmail.com"
    );
    process.exit(1);
  }

  if (!password) {
    password = await promptPassword(`Mot de passe pour ${email} : `);
    if (password.length < 8) {
      console.error("❌ Mot de passe trop court (min 8 caractères).");
      process.exit(1);
    }
  }

  const normalized = email.toLowerCase().trim();
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const prisma = new PrismaClient();
  const hash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email: normalized } });

  if (existing) {
    await prisma.user.update({
      where: { email: normalized },
      data: { passwordHash: hash },
    });
    console.log(`✔ Mot de passe mis à jour pour ${normalized}`);
  } else {
    await prisma.user.create({
      data: { email: normalized, passwordHash: hash },
    });
    console.log(`✔ Compte créé : ${normalized}`);
  }

  if (adminEmails.includes(normalized)) {
    console.log(`✔ ${normalized} est bien dans ADMIN_EMAILS → accès /admin OK`);
  } else {
    console.log(
      `⚠ ${normalized} n'est PAS dans ADMIN_EMAILS (valeur actuelle : "${process.env.ADMIN_EMAILS ?? ""}")\n` +
        `  Ajoute-le dans .env.local et dans Vercel → Environment Variables pour activer le panneau admin.`
    );
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

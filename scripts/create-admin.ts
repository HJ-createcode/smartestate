/**
 * Crée (ou met à jour) un compte admin.
 *
 * Usage :
 *   npm run create-admin -- <email> <password>
 *
 * Exemple :
 *   npm run create-admin -- hugo.jentile@gmail.com AdminSE123!
 *
 * Le statut "admin" n'est pas stocké en base : il est déterminé par
 * l'env var ADMIN_EMAILS. Ce script se contente donc de créer le compte ;
 * l'email doit figurer dans ADMIN_EMAILS pour que le panneau /admin soit
 * accessible.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error(
      "Usage : npm run create-admin -- <email> <password>\n" +
        "Exemple : npm run create-admin -- hugo.jentile@gmail.com AdminSE123!"
    );
    process.exit(1);
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

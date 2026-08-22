// One-time fix: reset teacher account password(s) from temporary
// environment variables, then does nothing once those variables are gone.
// Runs once as part of the Vercel build (which has real DB connectivity)
// and is removed from the build pipeline right after confirming it worked.
//
// No email or hash is ever hardcoded here or committed to git — set
// FIX_PASSWORD_EMAIL_N/FIX_PASSWORD_HASH_N (N = 1, 2, ...) as temporary
// Vercel env vars, deploy once, then delete them.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  for (let n = 1; ; n++) {
    const email = process.env[`FIX_PASSWORD_EMAIL_${n}`];
    const passwordHash = process.env[`FIX_PASSWORD_HASH_${n}`];
    if (!email || !passwordHash) {
      if (n === 1) console.log("[fix-passwords] no FIX_PASSWORD_* vars set, skipping.");
      break;
    }
    const result = await prisma.teacher.updateMany({
      where: { email },
      data: { passwordHash },
    });
    console.log(`[fix-passwords] ${email}: matched ${result.count} row(s)`);
  }
}

main()
  .catch((err) => {
    console.error("[fix-passwords] failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

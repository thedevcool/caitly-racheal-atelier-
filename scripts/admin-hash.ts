/**
 * Generates ADMIN_PASSWORD_HASH for the admin login.
 *   pnpm admin:hash                 (asks for the password, hidden)
 *   pnpm admin:hash "the password"  (non-interactive)
 * Prints a base64-encoded bcrypt hash: safe to paste into Vercel or .env.
 */
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";

async function ask(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  // Hide what is typed
  const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  out._writeToOutput = (s: string) => {
    if (s.includes("Password")) out.output.write(s);
  };
  return new Promise((resolve) =>
    rl.question("Password for the admin login: ", (a) => {
      rl.close();
      process.stdout.write("\n");
      resolve(a);
    }),
  );
}

(async () => {
  const pw = process.argv[2] ?? (await ask());
  if (pw.length < 10) {
    console.error("Please use at least 10 characters.");
    process.exit(1);
  }
  const hash = await bcrypt.hash(pw, 12);
  console.log("\nADMIN_PASSWORD_HASH=" + Buffer.from(hash).toString("base64"));
  console.log("\nPaste that line into Vercel → Settings → Environment Variables (and your local .env).");
})();

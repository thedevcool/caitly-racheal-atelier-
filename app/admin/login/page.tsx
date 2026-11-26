import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if ((await auth())?.user) redirect("/admin");
  const configured = !!(
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD_HASH &&
    process.env.AUTH_SECRET
  );
  return (
    <main className="a-login">
      <div className="a-login-card">
        <p className="a-brand">
          Caitly Racheal{" "}
          <span className="ko" lang="ko">
            아틀리에
          </span>
        </p>
        <h1>Welcome back.</h1>
        {configured ? (
          <LoginForm />
        ) : (
          <p className="a-note">
            The admin login isn’t set up yet. Add <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD_HASH</code>{" "}
            and <code>AUTH_SECRET</code> in Vercel’s environment variables (see the README), then redeploy.
          </p>
        )}
      </div>
    </main>
  );
}

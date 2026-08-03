import { AdminLoginForm } from "@/components/admin-login";
import { ADMIN_PATH, isAdminPath } from "@/lib/admin-path";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; passwordUpdated?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next && isAdminPath(params.next) ? params.next : ADMIN_PATH;
  const passwordUpdated = params.passwordUpdated === "1";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-rose-100 bg-white/85 p-6 shadow-xl shadow-rose-100/50 sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-rose-700 sm:text-sm">
          Venus Admin
        </p>
        <h1 className="mt-3 font-serif text-2xl text-rose-950 sm:text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-rose-800/70">
          Access your live sales ledger and record new bookings.
        </p>
        {passwordUpdated ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Password updated. Sign in with your new password.
          </p>
        ) : null}
        <div className="mt-8">
          <AdminLoginForm nextPath={nextPath} />
        </div>
      </div>
    </main>
  );
}

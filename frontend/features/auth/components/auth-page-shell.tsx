import { Map, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthPageShell({
  title,
  description,
  children,
  footer,
}: AuthPageShellProps) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#2d78ce] px-5 py-10 text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(111,181,246,0.46),transparent_36%),linear-gradient(145deg,#347fcf_0%,#2c75c9_52%,#2168bc_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 size-96 rounded-full bg-blue-950/15 blur-3xl"
      />

      <section className="relative w-full max-w-md rounded-3xl border border-white/50 bg-white p-6 shadow-[0_28px_70px_rgba(8,48,105,0.3)] sm:p-8">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-2.5 rounded-xl text-blue-700 transition hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <Map className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base font-bold tracking-tight">SCA Sitemap</span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        {children}
        {footer}
      </section>
    </main>
  );
}

export function AuthSessionLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#2d78ce] px-5 text-white">
      <div className="flex items-center gap-3 text-sm font-semibold text-blue-50">
        <ShieldCheck className="size-5 animate-pulse" aria-hidden="true" />
        Checking your session...
      </div>
    </main>
  );
}

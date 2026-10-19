import { Map, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  variant?: "default" | "hero";
};

export function AuthPageShell({
  title,
  description,
  children,
  footer,
  variant = "default",
}: AuthPageShellProps) {
  const isHero = variant === "hero";
  const BrandIcon = isHero ? Search : Map;

  return (
    <main
      className={`relative grid min-h-screen place-items-center overflow-hidden px-5 py-10 ${
        isHero ? "bg-[#031b4d] text-white" : "bg-[#2d78ce] text-slate-900"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${
          isHero
            ? "bg-[radial-gradient(ellipse_at_50%_0%,rgba(21,103,235,0.72),transparent_54%),radial-gradient(ellipse_at_8%_72%,rgba(0,93,255,0.34),transparent_28%),linear-gradient(135deg,#031942_0%,#052b70_48%,#03163d_100%)]"
            : "bg-[radial-gradient(circle_at_50%_12%,rgba(111,181,246,0.46),transparent_36%),linear-gradient(145deg,#347fcf_0%,#2c75c9_52%,#2168bc_100%)]"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -left-24 bottom-0 size-96 rounded-full ${
          isHero
            ? "border border-blue-500/35 shadow-[inset_0_0_0_3.5rem_rgba(16,95,228,0.12),inset_0_0_0_7rem_rgba(16,95,228,0.08)]"
            : "bg-blue-950/15 blur-3xl"
        }`}
      />
      {isHero ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-36 size-120 rounded-full border border-blue-400/40 shadow-[inset_0_0_0_5rem_rgba(21,104,255,0.2)]"
        />
      ) : null}

      <section
        className={`relative w-full max-w-md rounded-3xl border bg-white p-6 shadow-[0_28px_70px_rgba(0,13,45,0.38)] sm:p-8 ${
          isHero ? "border-blue-200/70" : "border-white/50"
        }`}
      >
        <Link
          href="/"
          className={`mx-auto flex w-fit items-center gap-3 rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-4 ${
            isHero
              ? "text-blue-800 hover:text-blue-950 focus-visible:outline-blue-600"
              : "text-blue-700 hover:text-blue-900 focus-visible:outline-blue-600"
          }`}
        >
          <span className="grid size-11 place-items-center rounded-2xl border border-sky-300 bg-blue-600 text-white shadow-[0_0_24px_rgba(38,149,255,0.25)]">
            <BrandIcon className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            {isHero ? "SCA Screen Finder" : "SCA Sitemap"}
          </span>
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

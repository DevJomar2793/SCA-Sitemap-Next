type AppFooterProps = {
  variant?: "light" | "brand";
};

export function AppFooter({ variant = "light" }: AppFooterProps) {
  const isBrand = variant === "brand";

  return (
    <footer
      className={`px-5 py-5 text-center text-xs font-medium sm:text-sm ${
        isBrand
          ? "text-blue-100/85"
          : "border-t border-slate-200 bg-white/70 text-slate-500"
      }`}
    >
      Developed by{" "}
      <span className={isBrand ? "font-bold text-white" : "font-bold text-blue-700"}>
        DevJMR
      </span>
      <span
        className={`mx-2 ${isBrand ? "text-blue-200/60" : "text-slate-300"}`}
        aria-hidden="true"
      >
        •
      </span>
      © {new Date().getFullYear()}
    </footer>
  );
}

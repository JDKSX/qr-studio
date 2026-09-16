import { useEffect } from "react";
import { useStudio } from "../state/store";

/** Mirrors the theme choice onto <html data-theme> so CSS can do the rest. */
export function useTheme(): void {
  const theme = useStudio((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      root.dataset["theme"] = resolved;
      root.style.colorScheme = resolved;
    };

    apply();
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
}

/** Keeps <html lang> in sync so screen readers pick the right pronunciation. */
export function useDocumentLang(): void {
  const lang = useStudio((state) => state.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
}

import { useMemo } from "react";
import type { Translate } from "../i18n";
import { translator } from "../i18n";
import { useStudio } from "../state/store";

/** The translator for the currently selected language. */
export function useT(): Translate {
  const lang = useStudio((state) => state.lang);
  return useMemo(() => translator(lang), [lang]);
}

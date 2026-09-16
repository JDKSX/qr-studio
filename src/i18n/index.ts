import { en } from "./en";
import type { TranslationKey } from "./en";
import { th } from "./th";

export type Lang = "th" | "en";
export type { TranslationKey };

export const LANGUAGES: ReadonlyArray<{ value: Lang; label: string }> = [
  { value: "th", label: "ไทย" },
  { value: "en", label: "EN" },
];

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { th, en };

export type TranslateParams = Record<string, string | number>;

/** `Translate` is passed into the pure domain code so it stays framework-free. */
export type Translate = (key: TranslationKey, params?: TranslateParams) => string;

export function translate(lang: Lang, key: TranslationKey, params?: TranslateParams): string {
  const template = DICTIONARIES[lang][key] ?? en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function translator(lang: Lang): Translate {
  return (key, params) => translate(lang, key, params);
}

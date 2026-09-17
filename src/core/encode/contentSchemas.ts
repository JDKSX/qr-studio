import type { TranslationKey } from "../../i18n/en";
import type { ContentSchema, ContentTypeId, ContentValues } from "./types";
import {
  crlf,
  digitsOnly,
  escapeICal,
  escapeVCard,
  escapeWifi,
  normalisePhone,
  toICalLocal,
} from "./escape";

const get = (values: ContentValues, key: string): string => (values[key] ?? "").trim();

/** A URL typed without a scheme is almost always meant to be https. */
function withScheme(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value}`;
}

function hostOf(raw: string): string {
  try {
    return new URL(withScheme(raw)).hostname.replace(/^www\./, "");
  } catch {
    return raw.trim();
  }
}

/**
 * Where this studio lives. Used as the sample URL so the very first code on
 * screen is a working one that points back at the tool itself — handy for
 * sharing it, and obviously safe to scan.
 */
export const SITE_URL = "https://jdksx.github.io/qr-studio/";

const urlSchema: ContentSchema = {
  id: "url",
  labelKey: "type.url",
  hintKey: "hint.url",
  defaults: { url: SITE_URL },
  fields: [
    {
      name: "url",
      labelKey: "field.url.url",
      kind: "url",
      placeholder: "https://example.com",
      required: true,
      wide: true,
      autoComplete: "url",
      helpKey: "field.url.url.help",
    },
  ],
  build: (v) => withScheme(get(v, "url")),
  slug: (v) => hostOf(get(v, "url")) || "url",
};

const textSchema: ContentSchema = {
  id: "text",
  labelKey: "type.text",
  hintKey: "hint.text",
  defaults: { text: "" },
  fields: [
    {
      name: "text",
      labelKey: "field.text.text",
      kind: "textarea",
      placeholderKey: "field.text.text.placeholder",
      required: true,
      wide: true,
      maxLength: 1200,
      helpKey: "field.text.text.help",
    },
  ],
  build: (v) => (v["text"] ?? "").trim(),
  slug: (v) => get(v, "text").slice(0, 24) || "text",
};

const wifiSchema: ContentSchema = {
  id: "wifi",
  labelKey: "type.wifi",
  hintKey: "hint.wifi",
  defaults: { ssid: "", password: "", encryption: "WPA", hidden: "" },
  fields: [
    { name: "ssid", labelKey: "field.wifi.ssid", kind: "text", placeholder: "MyHomeWiFi", required: true, wide: true },
    {
      name: "encryption",
      labelKey: "field.wifi.encryption",
      kind: "select",
      options: [
        { value: "WPA", labelKey: "field.wifi.encryption.wpa" },
        { value: "WEP", labelKey: "field.wifi.encryption.wep" },
        { value: "nopass", labelKey: "field.wifi.encryption.nopass" },
      ],
    },
    {
      name: "password",
      labelKey: "field.wifi.password",
      kind: "password",
      placeholder: "••••••••",
      showIf: (v) => get(v, "encryption") !== "nopass",
      helpKey: "field.wifi.password.help",
    },
    { name: "hidden", labelKey: "field.wifi.hidden", kind: "checkbox", wide: true },
  ],
  build: (v) => {
    const ssid = get(v, "ssid");
    if (!ssid) return "";
    const encryption = get(v, "encryption") || "WPA";
    const parts = [`T:${encryption}`, `S:${escapeWifi(ssid)}`];
    if (encryption !== "nopass") parts.push(`P:${escapeWifi(v["password"] ?? "")}`);
    if (get(v, "hidden") === "true") parts.push("H:true");
    return `WIFI:${parts.join(";")};;`;
  },
  slug: (v) => get(v, "ssid") || "wifi",
};

const emailSchema: ContentSchema = {
  id: "email",
  labelKey: "type.email",
  hintKey: "hint.email",
  defaults: { to: "", subject: "", body: "" },
  fields: [
    { name: "to", labelKey: "field.email.to", kind: "email", placeholder: "hello@example.com", required: true, wide: true },
    { name: "subject", labelKey: "field.email.subject", kind: "text", wide: true },
    { name: "body", labelKey: "field.email.body", kind: "textarea", wide: true, maxLength: 800 },
  ],
  build: (v) => {
    const to = get(v, "to");
    if (!to) return "";
    const query = new URLSearchParams();
    if (get(v, "subject")) query.set("subject", get(v, "subject"));
    if (get(v, "body")) query.set("body", v["body"] ?? "");
    const qs = query.toString().replace(/\+/g, "%20");
    return `mailto:${to}${qs ? `?${qs}` : ""}`;
  },
  slug: (v) => get(v, "to").split("@")[0] || "email",
};

const phoneSchema: ContentSchema = {
  id: "phone",
  labelKey: "type.phone",
  hintKey: "hint.phone",
  defaults: { phone: "" },
  fields: [
    {
      name: "phone",
      labelKey: "field.phone.phone",
      kind: "tel",
      placeholder: "+66812345678",
      required: true,
      wide: true,
      helpKey: "field.phone.phone.help",
    },
  ],
  build: (v) => {
    const phone = normalisePhone(get(v, "phone"));
    return phone ? `tel:${phone}` : "";
  },
  slug: (v) => digitsOnly(get(v, "phone")) || "phone",
};

const smsSchema: ContentSchema = {
  id: "sms",
  labelKey: "type.sms",
  hintKey: "hint.sms",
  defaults: { phone: "", message: "" },
  fields: [
    { name: "phone", labelKey: "field.sms.phone", kind: "tel", placeholder: "+66812345678", required: true, wide: true },
    { name: "message", labelKey: "field.sms.message", kind: "textarea", wide: true, maxLength: 500 },
  ],
  build: (v) => {
    const phone = normalisePhone(get(v, "phone"));
    if (!phone) return "";
    const message = (v["message"] ?? "").trim();
    return message ? `SMSTO:${phone}:${message}` : `SMSTO:${phone}:`;
  },
  slug: (v) => digitsOnly(get(v, "phone")) || "sms",
};

const vcardSchema: ContentSchema = {
  id: "vcard",
  labelKey: "type.vcard",
  hintKey: "hint.vcard",
  defaults: {
    firstName: "",
    lastName: "",
    organization: "",
    title: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    note: "",
  },
  fields: [
    { name: "firstName", labelKey: "field.vcard.firstName", kind: "text", required: true, autoComplete: "given-name" },
    { name: "lastName", labelKey: "field.vcard.lastName", kind: "text", autoComplete: "family-name" },
    { name: "organization", labelKey: "field.vcard.organization", kind: "text", autoComplete: "organization" },
    { name: "title", labelKey: "field.vcard.title", kind: "text", autoComplete: "organization-title" },
    { name: "phone", labelKey: "field.vcard.phone", kind: "tel", autoComplete: "tel" },
    { name: "email", labelKey: "field.vcard.email", kind: "email", autoComplete: "email" },
    { name: "website", labelKey: "field.vcard.website", kind: "url", wide: true, autoComplete: "url" },
    { name: "address", labelKey: "field.vcard.address", kind: "text", wide: true, autoComplete: "street-address" },
    { name: "note", labelKey: "field.vcard.note", kind: "textarea", wide: true, maxLength: 300 },
  ],
  build: (v) => {
    const first = get(v, "firstName");
    const last = get(v, "lastName");
    if (!first && !last) return "";
    const full = [first, last].filter(Boolean).join(" ");
    return crlf([
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${escapeVCard(last)};${escapeVCard(first)};;;`,
      `FN:${escapeVCard(full)}`,
      get(v, "organization") && `ORG:${escapeVCard(get(v, "organization"))}`,
      get(v, "title") && `TITLE:${escapeVCard(get(v, "title"))}`,
      get(v, "phone") && `TEL;TYPE=CELL:${normalisePhone(get(v, "phone"))}`,
      get(v, "email") && `EMAIL;TYPE=INTERNET:${escapeVCard(get(v, "email"))}`,
      get(v, "website") && `URL:${withScheme(get(v, "website"))}`,
      get(v, "address") && `ADR;TYPE=HOME:;;${escapeVCard(get(v, "address"))};;;;`,
      get(v, "note") && `NOTE:${escapeVCard(get(v, "note"))}`,
      "END:VCARD",
    ]);
  },
  slug: (v) => [get(v, "firstName"), get(v, "lastName")].filter(Boolean).join("-") || "contact",
};

const whatsappSchema: ContentSchema = {
  id: "whatsapp",
  labelKey: "type.whatsapp",
  hintKey: "hint.whatsapp",
  defaults: { phone: "", message: "" },
  fields: [
    {
      name: "phone",
      labelKey: "field.whatsapp.phone",
      kind: "tel",
      placeholder: "66812345678",
      required: true,
      wide: true,
      helpKey: "field.whatsapp.phone.help",
    },
    { name: "message", labelKey: "field.whatsapp.message", kind: "textarea", wide: true, maxLength: 400 },
  ],
  build: (v) => {
    const phone = digitsOnly(get(v, "phone"));
    if (!phone) return "";
    const message = (v["message"] ?? "").trim();
    return message
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${phone}`;
  },
  slug: (v) => `whatsapp-${digitsOnly(get(v, "phone"))}`.replace(/-$/, ""),
};

const geoSchema: ContentSchema = {
  id: "geo",
  labelKey: "type.geo",
  hintKey: "hint.geo",
  defaults: { latitude: "", longitude: "", label: "" },
  fields: [
    { name: "latitude", labelKey: "field.geo.latitude", kind: "text", placeholder: "13.7563", required: true },
    { name: "longitude", labelKey: "field.geo.longitude", kind: "text", placeholder: "100.5018", required: true },
    { name: "label", labelKey: "field.geo.label", kind: "text", wide: true, helpKey: "field.geo.label.help" },
  ],
  build: (v) => {
    const lat = Number.parseFloat(get(v, "latitude"));
    const lng = Number.parseFloat(get(v, "longitude"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
    const label = get(v, "label");
    return label ? `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})` : `geo:${lat},${lng}`;
  },
  slug: (v) => get(v, "label") || "location",
};

const eventSchema: ContentSchema = {
  id: "event",
  labelKey: "type.event",
  hintKey: "hint.event",
  defaults: { title: "", location: "", start: "", end: "", description: "" },
  fields: [
    { name: "title", labelKey: "field.event.title", kind: "text", required: true, wide: true },
    { name: "start", labelKey: "field.event.start", kind: "datetime", required: true },
    { name: "end", labelKey: "field.event.end", kind: "datetime" },
    { name: "location", labelKey: "field.event.location", kind: "text", wide: true },
    { name: "description", labelKey: "field.event.description", kind: "textarea", wide: true, maxLength: 400 },
  ],
  build: (v) => {
    const title = get(v, "title");
    const start = toICalLocal(get(v, "start"));
    if (!title || !start) return "";
    const end = toICalLocal(get(v, "end"));
    return crlf([
      "BEGIN:VEVENT",
      `SUMMARY:${escapeICal(title)}`,
      `DTSTART:${start}`,
      end && `DTEND:${end}`,
      get(v, "location") && `LOCATION:${escapeICal(get(v, "location"))}`,
      get(v, "description") && `DESCRIPTION:${escapeICal(get(v, "description"))}`,
      "END:VEVENT",
    ]);
  },
  slug: (v) => get(v, "title") || "event",
};

export const CONTENT_SCHEMAS: Record<ContentTypeId, ContentSchema> = {
  url: urlSchema,
  text: textSchema,
  wifi: wifiSchema,
  email: emailSchema,
  phone: phoneSchema,
  sms: smsSchema,
  vcard: vcardSchema,
  whatsapp: whatsappSchema,
  geo: geoSchema,
  event: eventSchema,
};

/** Display order of the type selector. */
export const CONTENT_TYPE_ORDER: ReadonlyArray<ContentTypeId> = [
  "url",
  "text",
  "wifi",
  "vcard",
  "email",
  "phone",
  "sms",
  "whatsapp",
  "geo",
  "event",
];

/**
 * The five people reach for most. The simple flow shows only these and keeps
 * the rest one click away, so the first thing you see is a short list rather
 * than ten choices.
 */
export const COMMON_CONTENT_TYPES: ReadonlyArray<ContentTypeId> = [
  "url",
  "text",
  "wifi",
  "vcard",
  "phone",
];

export function getSchema(id: ContentTypeId): ContentSchema {
  return CONTENT_SCHEMAS[id];
}

/** Fields that are currently visible for the given values. */
export function visibleFields(schema: ContentSchema, values: ContentValues) {
  return schema.fields.filter((field) => !field.showIf || field.showIf(values));
}

export function buildPayload(id: ContentTypeId, values: ContentValues): string {
  return getSchema(id).build(values);
}

export function missingRequired(id: ContentTypeId, values: ContentValues): TranslationKey[] {
  const schema = getSchema(id);
  return visibleFields(schema, values)
    .filter((field) => field.required && !(values[field.name] ?? "").trim())
    .map((field) => field.labelKey);
}

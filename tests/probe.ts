import { encodeMatrix } from "../src/core/encode/qrEngine";
import { buildPayload } from "../src/core/encode/contentSchemas";
import { renderQR } from "../src/core/render/renderer";
import { serialiseSvg } from "../src/core/render/serialize";
import { DOT_SHAPES } from "../src/core/render/dots";
import { EYE_INNER_SHAPES, EYE_OUTER_SHAPES } from "../src/core/render/eyes";
import { FRAMES } from "../src/core/render/frames";
import { solidPaint } from "../src/core/render/paint";
import type { DesignSpec } from "../src/core/render/types";

const design: DesignSpec = {
  dots: { shape: "square", paint: solidPaint("#000000") },
  eyes: { linked: true, outer: "square", inner: "square", outerPaint: null, innerPaint: null },
  background: { paint: solidPaint("#ffffff"), transparent: false },
  quietZone: 4,
  frame: { id: "square", label: "", labelColor: "#111827", cornerRadius: 0.25 },
  logo: null,
};

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (!ok) { failures += 1; console.log("FAIL", name, extra); }
  else console.log("  ok", name, extra);
};

// 1. Payload builders
console.log("--- payloads ---");
console.log(JSON.stringify(buildPayload("url", { url: "github.com" })));
console.log(JSON.stringify(buildPayload("wifi", { ssid: "My;Net", password: "p@ss,1", encryption: "WPA", hidden: "true" })));
console.log(JSON.stringify(buildPayload("vcard", { firstName: "สมชาย", lastName: "ใจดี", phone: "081 234 5678", email: "a@b.co", organization: "JDKS; Co" })));
console.log(JSON.stringify(buildPayload("sms", { phone: "+66812345678", message: "hi" })));
console.log(JSON.stringify(buildPayload("event", { title: "Launch, party", start: "2026-10-01T18:30", end: "2026-10-01T21:00" })));
console.log(JSON.stringify(buildPayload("geo", { latitude: "13.7563", longitude: "100.5018", label: "Bangkok" })));

// 2. Encoding
console.log("--- encode ---");
const r = encodeMatrix("https://github.com/", "M");
check("encode ok", r.ok);
if (!r.ok) process.exit(1);
const m = r.matrix;
console.log(`  version=${m.version} size=${m.size} mode=${m.mode}`);
check("size formula", m.size === m.version * 4 + 17);

const thai = encodeMatrix("สวัสดีครับ ทดสอบภาษาไทย", "H");
check("utf8 encode", thai.ok);

const huge = encodeMatrix("x".repeat(5000), "H");
check("over capacity handled", !huge.ok && huge.reason === "too-large", huge.ok ? "" : huge.reason);

// 3. Renderer structural integrity: painted modules must equal matrix dark modules
console.log("--- render coverage ---");
let darkTotal = 0, finderDark = 0;
for (let row = 0; row < m.size; row++) for (let col = 0; col < m.size; col++) {
  if (m.isDark(row, col)) { darkTotal++; if (m.isFinder(row, col)) finderDark++; }
}
const res = renderQR(m, design, { title: "QR code" });
const dotPathNode = (res.root.children ?? []).find((c) => c.tag === "path" && String(c.attrs?.["fill"]).includes("#000000"));
const subpaths = String(dotPathNode?.attrs?.["d"] ?? "").split("M").length - 1;
check("data modules drawn", subpaths === darkTotal - finderDark, `${subpaths} vs ${darkTotal - finderDark}`);
check("finder dark count", finderDark === 3 * 33, String(finderDark));
check("viewBox", res.root.attrs?.["viewBox"] === `0 0 ${m.size + 8} ${m.size + 8}`, String(res.root.attrs?.["viewBox"]));

// 4. Every shape combination renders without throwing and produces geometry
console.log("--- shape matrix ---");
let combos = 0;
for (const dot of DOT_SHAPES) for (const outer of EYE_OUTER_SHAPES) for (const inner of EYE_INNER_SHAPES) {
  const out = renderQR(m, { ...design, dots: { shape: dot.id, paint: solidPaint("#111827") }, eyes: { ...design.eyes, outer: outer.id, inner: inner.id } });
  if (!out.root.children?.length) { failures++; console.log("FAIL empty", dot.id, outer.id, inner.id); }
  combos++;
}
check("shape combinations", combos === DOT_SHAPES.length * EYE_OUTER_SHAPES.length * EYE_INNER_SHAPES.length, String(combos));

// 5. Frames keep the QR inside the viewBox
console.log("--- frames ---");
for (const frame of FRAMES) {
  const out = renderQR(m, { ...design, frame: { id: frame.id, label: "SCAN ME", labelColor: "#111827", cornerRadius: 0.3 } });
  const g = out.geometry;
  const fits = g.qrX >= 0 && g.qrY >= 0 && g.qrX + g.modules <= g.viewWidth && g.qrY + g.modules <= g.viewHeight;
  const quietOk = g.qrX >= g.quietZone - 1e-6 && g.qrY >= g.quietZone - 1e-6;
  check(`frame ${frame.id}`, fits && quietOk, `${g.viewWidth.toFixed(1)}x${g.viewHeight.toFixed(1)} @${g.qrX.toFixed(1)},${g.qrY.toFixed(1)}`);
}

// 6. Gradient + logo
console.log("--- gradient/logo ---");
const grad = renderQR(m, {
  ...design,
  dots: { shape: "rounded", paint: { mode: "gradient", color: "#000", gradient: { kind: "linear", from: "#2563eb", to: "#db2777", angle: 45 } } },
  logo: { src: "data:image/png;base64,iVBORw0KGgo=", aspect: 1, size: 0.22, position: "center", padding: 1, background: true, backgroundColor: "#ffffff", cornerRadius: 0.5 },
});
check("gradient def emitted", (grad.root.children ?? [])[1]?.tag === "defs" || (grad.root.children ?? []).some((c) => c.tag === "defs"));
check("logo knocked out modules", grad.obscuredModules > 0, String(grad.obscuredModules));
check("logo rect", grad.geometry.logoRect !== null);

// 7. Serialisation escaping
console.log("--- serialise ---");
const svg = serialiseSvg(renderQR(m, { ...design, frame: { id: "portrait", label: '<script>&"x"', labelColor: "#111827", cornerRadius: 0.2 } }, { title: "QR <code>" }).root, { width: 512, height: 512, standalone: true });
check("no raw script tag", !svg.includes("<script>"));
check("escaped amp", svg.includes("&amp;"));
check("xml prolog", svg.startsWith("<?xml"));
check("svg root", svg.includes("<svg"));
console.log("  svg bytes:", svg.length);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);

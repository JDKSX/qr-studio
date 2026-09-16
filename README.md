# JDKS QR Studio

**Create. Customize. Share.**

เครื่องมือออกแบบ QR Code บนเบราว์เซอร์ สำหรับสร้าง QR ที่สวย ปรับแต่งได้ละเอียด และ **ยังสแกนได้จริง**

ทำงานแบบ client-side ทั้งหมด — ไม่มี backend, ไม่มีฐานข้อมูล, ไม่มีระบบ login
ข้อมูล QR โลโก้ และดีไซน์ที่บันทึกไว้ อยู่ในเบราว์เซอร์ของผู้ใช้เท่านั้น deploy บน GitHub Pages ได้ทันที

---

## สองโหมด

**โหมดง่าย (ค่าเริ่มต้น)** — สามขั้นตอนในหน้าเดียว ไม่มีแท็บ

1. เลือกประเภทแล้วกรอกข้อมูล
2. เลือกสไตล์จากตัวอย่าง **QR จริง** ที่ render ด้วย preset นั้น ๆ คลิกเดียวเปลี่ยนทั้งรูปทรง สี และกรอบ
3. ใส่โลโก้ (ไม่บังคับ)

ปุ่ม **ดาวน์โหลด PNG** อยู่ใต้ตัวอย่างตลอดเวลา (บนมือถือปักอยู่ท้ายจอ) ผลตรวจสแกนย่อเหลือบรรทัดเดียว
แสดงเฉพาะข้อที่ต้องแก้ กดเพื่อดูรายละเอียดทั้งหมดได้

**โหมดปรับแต่งเอง** — กด "ปรับแต่งเองแบบละเอียด" เพื่อเปิดตัวเลือกทั้งหมด (ดีไซน์ / สี / โลโก้ / Preset /
ดาวน์โหลด) ไม่มีความสามารถใดถูกตัดออก แค่ไม่เป็นสิ่งแรกที่เห็น · ระบบจำโหมดที่เลือกไว้ใน LocalStorage

---

## สิ่งที่ระบบทำได้

| หมวด | รายละเอียด |
| --- | --- |
| ประเภทข้อมูล | URL, ข้อความ, Wi-Fi, นามบัตร (vCard), อีเมล, โทรศัพท์, SMS, WhatsApp, พิกัด, ปฏิทิน |
| Module shape | 10 แบบ — square, rounded, extra-rounded, circle, dot, diamond, classy, classy-rounded, hexagon, star |
| Finder pattern | กรอบนอก 5 แบบ × จุดกลาง 6 แบบ ปรับสีแยกจาก module ได้ |
| สี | สีเดียว หรือ gradient (linear / radial + องศา) แยกได้ที่ module, กรอบตา, จุดกลางตา และพื้นหลัง |
| โลโก้ | PNG / JPG / WebP / SVG · ปรับขนาด ระยะขอบ ตำแหน่ง 9 จุด พื้นหลังรอง และความโค้งมุม |
| Frame | none, square, rounded, circle, portrait, landscape พร้อมข้อความบนกรอบ |
| Quiet zone | 0–10 module พร้อม preset และคำเตือนเมื่อแคบเกินไป |
| Error correction | L / M / Q / H · ปรับเป็น H อัตโนมัติเมื่อใส่โลโก้ |
| Export | PNG, JPG, WebP (raster สูงสุด 8192px) และ SVG แบบ **vector จริง** |
| ตรวจสอบ | contrast, quiet zone, ขนาดโลโก้, ECC, ขนาด module และ **ถอดรหัส QR กลับจริง** ทุกครั้งที่แก้ดีไซน์ |
| อื่น ๆ | Light / Dark mode, ภาษาไทย / อังกฤษ, LocalStorage, Preset 10 แบบ, สุ่มสไตล์, ประวัติ QR ล่าสุด |

---

## 1. วิธีติดตั้ง

ต้องมี **Node.js 20 ขึ้นไป**

```bash
git clone https://github.com/JDKSX/qr-studio.git
cd qr-studio
npm install
```

## 2. วิธี Run Local

```bash
npm run dev
```

เปิด `http://localhost:5173/qr-studio/` — สังเกตว่ามี path `/qr-studio/` ต่อท้ายด้วย
เพราะ dev server ใช้ base path เดียวกับ production เพื่อให้เจอปัญหา path ตั้งแต่ตอน dev

## 3. วิธี Build

```bash
npm run build      # ตรวจ type ด้วย tsc แล้ว build ลง dist/
npm run preview    # ลองเปิดไฟล์ที่ build แล้วแบบ local
npm run typecheck  # ตรวจ type อย่างเดียว
```

ผลลัพธ์อยู่ใน `dist/` เป็น static file ล้วน วางบน static host ไหนก็ได้

## 4. วิธี Deploy GitHub Pages

มี workflow เตรียมไว้ที่ [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) แล้ว

1. push โค้ดขึ้น branch `main`
2. ไปที่ **Settings → Pages → Build and deployment → Source** แล้วเลือก **GitHub Actions**
3. รอ workflow เสร็จ จะได้ URL หน้าตาแบบนี้

   ```
   https://JDKSX.github.io/qr-studio/
   ```

workflow จะตั้ง `BASE_PATH` จากชื่อ repository ให้อัตโนมัติ ถ้าเปลี่ยนชื่อ repo ก็ไม่ต้องแก้อะไร

## 5. วิธีแก้ Base Path

base path ถูกอ่านจาก env `BASE_PATH` ใน [`vite.config.ts`](vite.config.ts) ค่า default คือ `/qr-studio/`

| ปลายทาง | คำสั่ง build |
| --- | --- |
| Project page (`JDKSX.github.io/qr-studio/`) | `npm run build` |
| User page (`user.github.io`) | `BASE_PATH=/ npm run build` |
| Custom domain (`qr.example.com`) | `BASE_PATH=/ npm run build` |
| Sub-path อื่น | `BASE_PATH=/my-path/ npm run build` |

> ไฟล์ `public/.nojekyll` มีไว้กัน Jekyll ของ GitHub Pages กินโฟลเดอร์ที่ขึ้นต้นด้วย `_` — อย่าลบ

## 6. วิธีเพิ่ม Library

```bash
npm install <package>
```

ข้อควรระวัง

- production ต้องเป็น static site เท่านั้น — อย่าเพิ่ม library ที่ต้องมี server
- ถ้า library มีไฟล์ asset (เช่น `.wasm`) ให้ import ผ่าน `?url` เพื่อให้ Vite ใส่ base path ให้ถูก
  ดูตัวอย่างจริงที่ [`src/core/validate/decode.ts`](src/core/validate/decode.ts)
- อย่าใช้ CDN `<script>` เพราะหน้าเว็บจะพังถ้า CDN ล่ม และเสีย offline support

## 7. วิธีเพิ่ม QR Shape

แต่ละ registry เพิ่มของใหม่ได้ด้วยการแก้ 3 จุด

**Module shape** — [`src/core/render/dots/index.ts`](src/core/render/dots/index.ts)

```ts
const triangleShape: DotShapeDef = {
  id: "triangle",
  labelKey: "shape.triangle",
  coverage: 0.5,                 // สัดส่วนพื้นที่ที่ทรงนี้เติมในหนึ่ง module
  experimental: true,            // ใส่เมื่อทรงนี้เสี่ยงต่อการสแกน
  path: ({ x, y }) => polygon(x + 0.5, y + 0.55, 0.55, 3, -90),
};
```

1. เขียน `DotShapeDef` ตัวใหม่ แล้วใส่ลง array `DOT_SHAPES`
2. เพิ่ม `"triangle"` ใน type `DotShapeId` ที่ [`src/core/render/types.ts`](src/core/render/types.ts)
3. เพิ่มคีย์ `"shape.triangle"` ใน [`src/i18n/en.ts`](src/i18n/en.ts) และ [`src/i18n/th.ts`](src/i18n/th.ts)

เท่านี้ picker, ปุ่มสุ่มสไตล์ และตัว validator จะรู้จักทรงใหม่เองทั้งหมด
`path()` ทำงานในหน่วย **module** (1 module = 1 หน่วย) และรับ `neighbors` มาให้ ถ้าอยากให้ทรงเชื่อมกับเพื่อนบ้าน

**Finder pattern** ทำแบบเดียวกันที่ [`src/core/render/eyes/index.ts`](src/core/render/eyes/index.ts)
**Frame** ที่ [`src/core/render/frames/index.ts`](src/core/render/frames/index.ts) — `layout()` ต้องคืนตำแหน่งที่ QR + quiet zone อยู่ครบเสมอ

> ทุกครั้งที่เพิ่มทรงใหม่ ให้ลองกดดูผล **Scan test** ในหน้าเว็บ ถ้าอ่านกลับไม่ได้ ระบบจะขึ้น error ให้ทันที

## 8. วิธีเพิ่ม Preset

แก้ [`src/core/presets/design.ts`](src/core/presets/design.ts)

```ts
preset("sunset", {
  dots: { shape: "extra-rounded", paint: gradientPaint("#f97316", "#db2777", 90) },
  eyes: { linked: true, outer: "circle", inner: "dot", outerPaint: solidPaint("#f97316"), innerPaint: null },
  background: { paint: solidPaint("#fffbeb"), transparent: false },
}),
```

แล้วเพิ่มคีย์ `"preset.sunset"` กับ `"preset.sunset.description"` ในไฟล์ภาษาทั้งสอง
ชุดสี (palette) เพิ่มที่ `COLOR_PALETTES` ในไฟล์เดียวกัน พร้อมคีย์ `"palette.<id>"`

---

## Architecture

```
src/
├─ core/                      Domain layer — TypeScript ล้วน ไม่มี React
│  ├─ encode/                 ฟอร์ม → payload string → QR matrix
│  │  ├─ contentSchemas.ts    นิยามฟอร์มของข้อมูลแต่ละประเภท (ขับ UI ทั้งหมด)
│  │  ├─ escape.ts            กฎ escape ของ WIFI: / vCard / iCalendar
│  │  └─ qrEngine.ts          ครอบ qrcode-generator + UTF-8 + cache
│  ├─ render/                 matrix + ดีไซน์ → SVG tree (pure function)
│  │  ├─ renderer.ts          ตัวประกอบร่างหลัก
│  │  ├─ dots/ eyes/ frames/  registry ของรูปทรง
│  │  ├─ serialize.ts         SVG tree → string (สำหรับ export)
│  │  └─ mount.ts             SVG tree → DOM (ไม่ใช้ innerHTML)
│  ├─ logo/                   อ่านไฟล์ ย่อขนาด และ sanitize SVG
│  ├─ validate/               ตรวจแบบ static + ถอดรหัสกลับจริง
│  ├─ export/                 PNG / JPG / WebP / SVG + ตั้งชื่อไฟล์
│  ├─ presets/                Preset, palette, ปุ่มสุ่ม
│  └─ storage/                LocalStorage (มี version prefix)
├─ i18n/                      พจนานุกรม ไทย / อังกฤษ (type-safe)
├─ state/                     Zustand store (เก็บโหมด simple / advanced ด้วย)
├─ hooks/                     useQrPipeline (data flow หลัก), useT, useTheme
├─ components/                React UI
│  ├─ layout/SimpleFlow.tsx   โหมดง่าย: สามขั้นตอน
│  └─ presets/PresetPicker    ตัวอย่างสไตล์ที่เป็น QR จริง (cache ไว้)
└─ styles/                    Design token + CSS
```

**Data flow**

```
ค่าในฟอร์ม → payload → QR matrix → SVG tree → preview
                                        ↓
                             static checks (ทันที)
                             round-trip decode (หน่วง 450ms)
```

**QR engine**: [`qrcode-generator`](https://www.npmjs.com/package/qrcode-generator) (MIT, ไม่มี dependency)
ทำหน้าที่ encode ตามมาตรฐาน ISO/IEC 18004 — ส่วนการวาดทั้งหมดเป็นของโปรเจกต์นี้เอง จึงปรับแต่งได้ทุกจุดโดยไม่แตะโครงสร้างข้อมูล QR

**Decoder**: `BarcodeDetector` ของเบราว์เซอร์ถ้ามี ไม่มีก็ lazy-load [`zxing-wasm`](https://www.npmjs.com/package/zxing-wasm)
ไฟล์ wasm ~414 KB (gzip) จะถูกโหลด **เฉพาะตอนที่จำเป็น** เท่านั้น ไม่ได้อยู่ใน bundle หลัก

---

## หลักการออกแบบ: Scanability มาก่อนความสวยงาม

ทุกครั้งที่ดีไซน์เปลี่ยน ระบบจะ render QR แล้ว **ถอดรหัสกลับด้วยตัวถอดรหัสจริง** เทียบกับ payload เดิม
ถ้าอ่านกลับไม่ได้ จะขึ้น error ทันที ไม่ปล่อยให้ดาวน์โหลด QR เสีย ๆ ออกไปโดยไม่รู้ตัว

นอกจากนี้ยังตรวจ

- **Contrast** — ต่ำกว่า 7:1 เตือน ต่ำกว่า 3:1 ขึ้น error
- **Quiet zone** — ต่ำกว่า 4 module เตือน ไม่มีเลยขึ้น error
- **ขนาดโลโก้** — เทียบกับงบ error correction จริง (ใช้เพดานประมาณครึ่งหนึ่งของค่าตามทฤษฎี เพราะการบังเป็นก้อนเดียวรุนแรงกว่าที่ตัวเลข ECC บอก)
- **โลโก้ทับ finder pattern** — error เสมอ
- **ขนาด module ที่ export** — ต่ำกว่า 3px ต่อ module เตือน

คำเตือนเกือบทุกข้อมี **ปุ่มแก้ให้ในคลิกเดียว**

## Privacy

- ไม่มีการส่งข้อมูล QR หรือโลโก้ออกจากเบราว์เซอร์
- ไม่มี analytics, ไม่มี tracker, ไม่มี webfont จากภายนอก
- โลโก้ถูก sanitize (สำหรับ SVG) และย่อขนาดในเครื่องก่อนนำไป render
- โลโก้ที่ใหญ่เกิน 200 KB จะไม่ถูกเขียนลง LocalStorage เพื่อไม่ให้ quota เต็ม

## Browser support

เบราว์เซอร์ที่รองรับ ES2022 — Chrome / Edge / Firefox / Safari รุ่นปัจจุบัน
`BarcodeDetector` ใช้ได้บน Chrome, Edge และ Android ส่วนที่เหลือใช้ zxing-wasm แทนอัตโนมัติ
การ export WebP ต้องใช้ Safari 14 ขึ้นไป ถ้าไม่รองรับปุ่มจะถูกปิดไว้

## License

MIT

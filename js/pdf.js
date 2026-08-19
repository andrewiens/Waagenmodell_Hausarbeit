const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const BOTTOM = 48;

const WIN_ANSI = new Map([
  ["€", 0x80], ["‚", 0x82], ["ƒ", 0x83], ["„", 0x84], ["…", 0x85],
  ["†", 0x86], ["‡", 0x87], ["ˆ", 0x88], ["‰", 0x89], ["Š", 0x8a],
  ["‹", 0x8b], ["Œ", 0x8c], ["Ž", 0x8e], ["‘", 0x91], ["’", 0x92],
  ["“", 0x93], ["”", 0x94], ["•", 0x95], ["–", 0x96], ["—", 0x97],
  ["˜", 0x98], ["™", 0x99], ["š", 0x9a], ["›", 0x9b], ["œ", 0x9c],
  ["ž", 0x9e], ["Ÿ", 0x9f],
]);

function pdfSafeText(value) {
  return String(value ?? "")
    .replaceAll("−", "-")
    .replaceAll("⁄", "/")
    .replaceAll("✓", "ja")
    .replaceAll("⚠", "Hinweis")
    .replaceAll("↺", "Wiederherstellung")
    .replaceAll("↶", "Wiederherstellung")
    .replaceAll("→", "->")
    .replaceAll("\u00a0", " ");
}

function encodeWinAnsi(value) {
  const output = [];
  for (const character of pdfSafeText(value)) {
    const code = character.codePointAt(0);
    if (WIN_ANSI.has(character)) output.push(WIN_ANSI.get(character));
    else if (code <= 0xff) output.push(code);
    else output.push(0x3f);
  }
  return output;
}

function literal(value) {
  const bytes = encodeWinAnsi(value);
  let result = "";
  for (const byte of bytes) {
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) {
      result += `\\${String.fromCharCode(byte)}`;
    } else if (byte < 0x20 || byte > 0x7e) {
      result += `\\${byte.toString(8).padStart(3, "0")}`;
    } else {
      result += String.fromCharCode(byte);
    }
  }
  return `(${result})`;
}

function wrapText(text, maxCharacters) {
  const paragraphs = pdfSafeText(text).split(/\n/u);
  const lines = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/u).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      if (word.length > maxCharacters) {
        if (line) lines.push(line);
        for (let index = 0; index < word.length; index += maxCharacters) {
          lines.push(word.slice(index, index + maxCharacters));
        }
        line = "";
      } else if (!line) {
        line = word;
      } else if (`${line} ${word}`.length <= maxCharacters) {
        line += ` ${word}`;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function createPageComposer() {
  const pages = [];
  let page;
  let y;

  function startPage() {
    page = [];
    pages.push(page);
    y = PAGE_HEIGHT - MARGIN;
  }

  function ensureSpace(height) {
    if (!page || y - height < BOTTOM + 18) startPage();
  }

  function rule() {
    ensureSpace(18);
    page.push(`0.75 w 0.76 0.80 0.84 RG ${MARGIN} ${y.toFixed(2)} m ${(PAGE_WIDTH - MARGIN).toFixed(2)} ${y.toFixed(2)} l S`);
    y -= 16;
  }

  function add(text, options = {}) {
    const size = options.size ?? 10;
    const leading = options.leading ?? size * 1.42;
    const maxChars = options.maxChars ?? Math.max(32, Math.floor((PAGE_WIDTH - 2 * MARGIN) / (size * 0.52)));
    const lines = wrapText(text, maxChars);
    const before = options.before ?? 0;
    const after = options.after ?? 5;
    ensureSpace(before + Math.max(1, lines.length) * leading + after);
    y -= before;
    for (const line of lines) {
      page.push(`BT /${options.bold ? "F2" : "F1"} ${size} Tf 0 0 0 rg ${MARGIN} ${y.toFixed(2)} Td ${literal(line)} Tj ET`);
      y -= leading;
    }
    y -= after;
  }

  return { pages, add, rule, keep: ensureSpace };
}

function solutionLabel(solution) {
  if (!solution) return "Nicht angegeben";
  if (solution.type === "unique") return `Genau eine Lösung: x = ${solution.value}`;
  if (solution.type === "infinite") return "Lösungsmenge: alle reellen Zahlen";
  if (solution.type === "none") return "Lösungsmenge: keine Lösung";
  return String(solution);
}

function buildPages(data) {
  const composer = createPageComposer();
  composer.add(data.title ?? "Mein Lösungsweg", { size: 23, bold: true, leading: 28, after: 3 });
  composer.add("Lineare Gleichungen im Waagenmodell", { size: 11, after: 12 });
  composer.rule();
  composer.add(`Erstellt am: ${data.createdAt}`, { size: 9, after: 10 });
  composer.add("Ausgangsgleichung", { size: 14, bold: true, before: 4, after: 3 });
  composer.add(data.initialEquation, { size: 15, bold: true, leading: 19, after: 12 });
  composer.add("Warum die Schritte gültig sind", { size: 13, bold: true, after: 3 });
  composer.add(
    "Eine Äquivalenzumformung führt auf beiden Seiten dieselbe zulässige Operation aus. Dadurch bleibt die Lösungsmenge erhalten. Einseitige Experimentierschritte sind ausdrücklich als nicht äquivalent markiert.",
    { after: 12 },
  );
  composer.add("Rechenweg", { size: 15, bold: true, after: 7 });

  if (!data.history?.length) {
    composer.add("Noch keine Umformung im Verlauf.", { after: 10 });
  } else {
    data.history.forEach((step, index) => {
      composer.keep(92);
      const status = step.type === "restore"
        ? "Steueraktion / Experiment verworfen"
        : step.equivalent ? "äquivalent" : "nicht äquivalent";
      composer.add(`Schritt ${index + 1}: ${status}`, { size: 11, bold: true, before: 5, after: 2 });
      composer.add(`Vorher: ${step.before}`, { after: 1 });
      composer.add(`Operation: ${step.operation}`, { bold: true, after: 1 });
      composer.add(`Nachher: ${step.after}`, { after: 1 });
      composer.add(step.explanation, { size: 9, after: 5 });
    });
  }

  composer.rule();
  composer.add("Aktueller Stand", { size: 14, bold: true, after: 3 });
  composer.add(data.finalEquation, { size: 14, bold: true, after: 6 });
  if (data.nonEquivalent) {
    composer.add(
      "Achtung: Im aktuellen Verlauf ist mindestens ein einseitiger Experimentierschritt enthalten. Der aktuelle Stand ist daher nicht als gültiger Lösungsweg zur Ausgangsgleichung bestätigt.",
      { bold: true, after: 8 },
    );
  }
  composer.add(solutionLabel(data.solution), { size: 11, bold: true, after: 8 });

  if (data.notes?.length) {
    composer.add("Hinweise, Fehler oder zurückgenommene Schritte", { size: 12, bold: true, before: 4, after: 3 });
    data.notes.forEach((note) => composer.add(`- ${note}`, { size: 9, after: 2 }));
  }
  return composer.pages;
}

function binaryStringToBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index) & 0xff;
  return bytes;
}

function serializePdf(pageStreams) {
  const objects = new Map();
  const pageIds = pageStreams.map((_, index) => 6 + index * 2);
  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.set(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  pageStreams.forEach((stream, index) => {
    const contentId = 5 + index * 2;
    const pageId = contentId + 1;
    objects.set(contentId, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
  });

  const objectCount = 4 + pageStreams.length * 2;
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  for (let id = 1; id <= objectCount; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= objectCount; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return binaryStringToBytes(pdf);
}

export function suggestPdfFilename(equation) {
  const slug = pdfSafeText(equation)
    .replaceAll("+", " plus ")
    .replaceAll("-", " minus ")
    .replaceAll("=", " gleich ")
    .replaceAll("·", " mal ")
    .replaceAll(":", " durch ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 54) || "gleichung";
  return `loesungsweg-${slug}.pdf`;
}

export function createSolutionPdf(data) {
  const pages = buildPages(data);
  const streams = pages.map((commands, index) => {
    const footer = `BT /F1 8 Tf 0.35 0.38 0.42 rg ${MARGIN} 24 Td ${literal(`Gleichungen im Gleichgewicht - Seite ${index + 1} von ${pages.length}`)} Tj ET`;
    return [...commands, footer].join("\n");
  });
  return Object.freeze({
    bytes: serializePdf(streams),
    pageCount: pages.length,
    filename: suggestPdfFilename(data.initialEquation),
  });
}

export function downloadSolutionPdf(data) {
  const document = createSolutionPdf(data);
  const url = URL.createObjectURL(new Blob([document.bytes], { type: "application/pdf" }));
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = document.filename;
  anchor.hidden = true;
  window.document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  return document;
}

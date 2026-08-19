import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { createSolutionPdf } from "../js/pdf.js";

const outputDirectory = fileURLToPath(new URL("../output/pdf/", import.meta.url));
const document = createSolutionPdf({
  title: "Gleichungen im Gleichgewicht – Mein Lösungsweg",
  createdAt: "19. August 2026 um 12:00",
  initialEquation: "3x + 2 = 11",
  finalEquation: "x = 3",
  history: [
    {
      before: "3x + 2 = 11",
      operation: "| -2",
      after: "3x = 9",
      equivalent: true,
      explanation: "Auf beiden Seiten wurde dieselbe zulässige Operation durchgeführt; die Lösungsmenge bleibt erhalten.",
    },
    {
      before: "3x = 9",
      operation: "| :3",
      after: "x = 3",
      equivalent: true,
      explanation: "Beide Seiten wurden durch dieselbe Zahl ungleich null dividiert; der Schritt ist äquivalent.",
    },
  ],
  solution: { type: "unique", value: "3" },
  nonEquivalent: false,
  notes: ["Prüfdatei für den vollständig lokalen PDF-Export mit deutschen Sonderzeichen: ä, ö, ü, ß."],
});

await mkdir(outputDirectory, { recursive: true });
const outputPath = `${outputDirectory}${document.filename}`;
await writeFile(outputPath, document.bytes);
process.stdout.write(`${outputPath}\n${document.pageCount} Seite(n)\n`);

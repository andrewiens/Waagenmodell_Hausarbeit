import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyHistoryOperation,
  applyOperation,
  createHistory,
  formatEquation,
  undoHistory,
} from "../js/math.js";
import { parseEquation, parseScalar } from "../js/parser.js";
import {
  createDirectOperation,
  validateDirectOperation,
} from "../js/scale-actions.js";
import { createSolutionPdf } from "../js/pdf.js";

const projectFile = (name) => new URL(`../${name}`, import.meta.url);

test("1. Alle mathematischen Operationen werden als Buttons angezeigt", async () => {
  const html = await readFile(projectFile("index.html"), "utf8");
  const kinds = [...html.matchAll(/data-operation-kind="([^"]+)"/gu)].map((match) => match[1]);
  assert.deepEqual(kinds, ["add", "subtract", "multiply", "divide", "addX", "subtractX"]);
  assert.doesNotMatch(html, /id="operation-select"/u);
});

test("2. Die Buttons führen die richtige Operation aus", () => {
  const equation = parseEquation("2x + 4 = 10");
  const cases = [
    ["add", "3", "2x + 7 = 13"],
    ["subtract", "3", "2x + 1 = 7"],
    ["multiply", "3", "6x + 12 = 30"],
    ["divide", "2", "x + 2 = 5"],
    ["addX", "1", "3x + 4 = x + 10"],
    ["subtractX", "1", "x + 4 = -x + 10"],
  ];
  for (const [kind, value, expected] of cases) {
    assert.equal(formatEquation(applyOperation(equation, { kind, value, side: "both" }).equation), expected);
  }
});

test("3. Eine Zahl kann vor der Operation eingegeben werden", () => {
  const value = parseScalar("3");
  const result = applyOperation(parseEquation("3x + 2 = 11"), {
    kind: "subtract", value, side: "both",
  });
  assert.equal(formatEquation(result.equation), "3x - 1 = 8");
});

test("4. Division durch null wird verhindert", () => {
  assert.throws(
    () => applyOperation(parseEquation("2x = 8"), { kind: "divide", value: 0, side: "both" }),
    (error) => error.code === "DIVISION_BY_ZERO",
  );
});

test("5. Ein Einheitsgewicht kann direkt hinzugefügt werden", () => {
  const equation = parseEquation("x = 2");
  const operation = createDirectOperation("addUnit", "left", "experiment");
  assert.equal(formatEquation(applyOperation(equation, operation).equation), "x + 1 = 2");
});

test("6. Ein Einheitsgewicht kann direkt entfernt werden", () => {
  const equation = parseEquation("x + 2 = 4");
  const operation = createDirectOperation("removeUnit", "left", "experiment");
  assert.equal(validateDirectOperation(equation, operation).ok, true);
  assert.equal(formatEquation(applyOperation(equation, operation).equation), "x + 1 = 4");
});

test("7. Eine x-Box kann direkt hinzugefügt werden", () => {
  const equation = parseEquation("x = 2");
  const operation = createDirectOperation("addX", "right", "experiment");
  assert.equal(formatEquation(applyOperation(equation, operation).equation), "x = x + 2");
});

test("8. Eine x-Box kann direkt entfernt werden", () => {
  const equation = parseEquation("2x = x + 3");
  const operation = createDirectOperation("removeX", "left", "experiment");
  assert.equal(validateDirectOperation(equation, operation).ok, true);
  assert.equal(formatEquation(applyOperation(equation, operation).equation), "x = x + 3");
});

test("9. Im Lernmodus wird eine direkte Handlung auf beiden Seiten ausgeführt", () => {
  const equation = parseEquation("2x + 1 = x + 5");
  const operation = createDirectOperation("removeX", "left", "learn");
  assert.equal(operation.side, "both");
  assert.equal(validateDirectOperation(equation, operation).ok, true);
  const result = applyOperation(equation, operation);
  assert.equal(result.equivalent, true);
  assert.equal(formatEquation(result.equation), "x + 1 = 5");

  const missingCounterpart = createDirectOperation("removeUnit", "left", "learn");
  const blocked = validateDirectOperation(parseEquation("x + 1 = x"), missingCounterpart);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.code, "COUNTERPART_MISSING");
  assert.match(blocked.message, /rechten Schale.*kein positives Einheitsgewicht/u);
});

test("10. Im Experimentiermodus ist eine einseitige Handlung möglich und nicht äquivalent", () => {
  const equation = parseEquation("3x + 2 = 11");
  const operation = createDirectOperation("addUnit", "left", "experiment");
  const result = applyOperation(equation, operation);
  assert.equal(operation.side, "left");
  assert.equal(result.equivalent, false);
  assert.equal(formatEquation(result.equation), "3x + 3 = 11");
});

test("11. Waage, Gleichung und Lösungsverlauf bleiben synchron", () => {
  const original = parseEquation("3x + 2 = 11");
  const operation = createDirectOperation("removeUnit", "left", "learn");
  const result = applyOperation(original, operation);
  const history = [{ before: formatEquation(original), after: formatEquation(result.equation) }];
  assert.equal(history[0].before, "3x + 2 = 11");
  assert.equal(history[0].after, "3x + 1 = 10");
  assert.equal(result.equation.left.constant.toString(), "1");
  assert.equal(result.equation.right.constant.toString(), "10");
});

test("12. Eine direkte Handlung kann rückgängig gemacht werden", () => {
  const original = parseEquation("3x + 2 = 11");
  const operation = createDirectOperation("removeUnit", "left", "learn");
  const changed = applyHistoryOperation(createHistory(original), operation);
  const undone = undoHistory(changed);
  assert.equal(formatEquation(changed.current), "3x + 1 = 10");
  assert.equal(formatEquation(undone.current), "3x + 2 = 11");
});

test("13. Der PDF-Button wird nach einem gültigen Schritt freigeschaltet", async () => {
  const [html, app] = await Promise.all([
    readFile(projectFile("index.html"), "utf8"),
    readFile(projectFile("js/app.js"), "utf8"),
  ]);
  assert.match(html, /id="pdf-download-button"[^>]*disabled/u);
  assert.match(app, /history\.some\(\(step\) => step\.equivalent === true\)/u);
  assert.match(app, /pdfDownload\.disabled = !hasEquivalentStep/u);
});

const pdfFixture = (history) => ({
  title: "Mein Lösungsweg",
  createdAt: "19. August 2026 um 12:00",
  initialEquation: "3x + 2 = 11",
  finalEquation: "x = 3",
  history,
  solution: { type: "unique", value: "3" },
  nonEquivalent: false,
  notes: [],
});

test("14. Die PDF enthält Ausgangsgleichung und alle Umformungsschritte", () => {
  const pdf = createSolutionPdf(pdfFixture([
    { before: "3x + 2 = 11", operation: "| -2", after: "3x = 9", equivalent: true, explanation: "Gültiger Schritt." },
    { before: "3x = 9", operation: "| :3", after: "x = 3", equivalent: true, explanation: "Gültiger Schritt." },
  ]));
  const binary = new TextDecoder("windows-1252").decode(pdf.bytes);
  assert.match(binary, /%PDF-1\.4/u);
  assert.match(binary, /3x \+ 2 = 11/u);
  assert.match(binary, /\| -2/u);
  assert.match(binary, /x = 3/u);
});

test("15. Lange Lösungswege werden in der PDF vollständig auf mehrere Seiten verteilt", () => {
  const history = Array.from({ length: 80 }, (_, index) => ({
    before: `x + ${index} = ${index + 3}`,
    operation: "| +1",
    after: `x + ${index + 1} = ${index + 4}`,
    equivalent: true,
    explanation: `Gültiger Testschritt ${index + 1}: auf beiden Seiten wurde 1 addiert.`,
  }));
  const pdf = createSolutionPdf(pdfFixture(history));
  const binary = new TextDecoder("windows-1252").decode(pdf.bytes);
  assert.ok(pdf.pageCount > 1);
  assert.match(binary, /Testschritt 80/u);
});

test("16. Der PDF-Export erzeugt vollständig lokal eine Browser-Blob-kompatible Datei", async () => {
  const pdf = createSolutionPdf(pdfFixture([]));
  const blob = new Blob([pdf.bytes], { type: "application/pdf" });
  assert.equal(blob.type, "application/pdf");
  assert.equal(blob.size, pdf.bytes.byteLength);
  assert.ok(pdf.filename.startsWith("loesungsweg-"));
  assert.ok(pdf.filename.endsWith(".pdf"));
  assert.equal(new TextDecoder().decode(await blob.slice(0, 5).arrayBuffer()), "%PDF-");
});

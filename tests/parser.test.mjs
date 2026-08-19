import test from "node:test";
import assert from "node:assert/strict";

import { formatEquation, solveEquation } from "../js/math.js";
import {
  EquationParseError,
  parseEquation,
  parseLinearExpression,
  parseScalar,
  tryParseEquation,
} from "../js/parser.js";

function expectUnique(input, expected) {
  const solution = solveEquation(parseEquation(input));
  assert.equal(solution.type, "unique");
  assert.equal(solution.value.toString(), expected);
}

test("Pflichtbeispiele werden korrekt eingelesen und gelöst", () => {
  expectUnique("3x + 2 = 11", "3");
  expectUnique("5x + 4 = 2x + 13", "3");
  expectUnique("x + 5 = 9", "4");
  expectUnique("2x = 8", "4");
  expectUnique("-x + 5 = 2", "3");
  expectUnique("2x - 4 = x + 5", "9");
});

test("allgemeingültige und unlösbare Eingaben werden korrekt klassifiziert", () => {
  assert.equal(solveEquation(parseEquation("2x + 1 = 2x + 1")).type, "infinite");
  assert.equal(solveEquation(parseEquation("2x + 1 = 2x + 3")).type, "none");
});

test("Leerzeichen, Großschreibung und fehlende Koeffizienten werden akzeptiert", () => {
  const parsed = parseEquation("  - X -  2 = +x + 4  ");
  assert.equal(formatEquation(parsed), "-x - 2 = x + 4");
  expectUnique("  - X -  2 = +x + 4  ", "-3");
});

test("gleichartige Terme werden bereits beim Einlesen exakt zusammengefasst", () => {
  const side = parseLinearExpression("x + 2x - 1/2x + 3 - 1");
  assert.equal(side.x.toString(), "5/2");
  assert.equal(side.constant.toString(), "2");
});

test("Brüche, Dezimalkomma und Malzeichen werden unterstützt", () => {
  assert.equal(formatEquation(parseEquation("1/2x + 1,5 = 2·x - 3/4")), "1/2x + 3/2 = 2x - 3/4");
  expectUnique("1/2x + 1,5 = 2·x - 3/4", "3/2");
  expectUnique("2*x=3", "3/2");
});

test("parseScalar verarbeitet Zahlen exakt und lehnt x-Terme ab", () => {
  assert.equal(parseScalar(" -6 / 8 ").toString(), "-3/4");
  assert.equal(parseScalar("0,125").toString(), "1/8");
  assert.throws(
    () => parseScalar("2x"),
    (error) => error instanceof EquationParseError && error.code === "VARIABLE_NOT_ALLOWED",
  );
});

test("leere Eingabe erhält eine konkrete Hilfestellung", () => {
  assert.throws(
    () => parseEquation("   "),
    (error) => error instanceof EquationParseError
      && error.code === "EMPTY_INPUT"
      && /3x \+ 2 = 11/u.test(error.message),
  );
});

test("ein fehlendes oder mehrfaches Gleichheitszeichen wird verständlich erklärt", () => {
  assert.throws(
    () => parseEquation("3x + 2"),
    (error) => error.code === "MISSING_EQUALS" && /Gleichheitszeichen/u.test(error.message),
  );
  assert.throws(
    () => parseEquation("x = 2 = 3"),
    (error) => error.code === "TOO_MANY_EQUALS" && /nur ein Gleichheitszeichen/u.test(error.message),
  );
});

test("eine leere Gleichungsseite wird benannt", () => {
  assert.throws(
    () => parseEquation("x + 1 ="),
    (error) => error.code === "EMPTY_SIDE" && error.side === "right" && /rechten Seite/u.test(error.message),
  );
});

test("Nullnenner wird beim Parsen verhindert", () => {
  assert.throws(
    () => parseEquation("1/0x = 2"),
    (error) => error.code === "ZERO_DENOMINATOR" && /Nenner.*null/u.test(error.message),
  );
  assert.throws(
    () => parseScalar("2/0"),
    (error) => error.code === "ZERO_DENOMINATOR",
  );
});

test("nichtlineare Terme und andere Variablen erhalten zielgerichtete Fehler", () => {
  assert.throws(
    () => parseEquation("x*x = 4"),
    (error) => error.code === "NON_LINEAR_TERM" && /nicht linear/u.test(error.message),
  );
  assert.throws(
    () => parseEquation("2y + 1 = 3"),
    (error) => /nur x|ungültiges Zeichen/u.test(error.message),
  );
});

test("fehlende Terme und Operatoren führen nicht zum Absturz", () => {
  assert.throws(
    () => parseEquation("x + = 3"),
    (error) => error.code === "MISSING_TERM" && /fehlt.*Term/u.test(error.message),
  );
  assert.throws(
    () => parseEquation("x 2 = 3"),
    (error) => error instanceof EquationParseError,
  );
});

test("HTML-ähnliche Eingabe wird nur als ungültiger Text behandelt", () => {
  assert.throws(
    () => parseEquation("<img src=x> = 2"),
    (error) => error instanceof EquationParseError && /ungültiges Zeichen/u.test(error.message),
  );
});

test("tryParseEquation liefert ein UI-freundliches Ergebnisobjekt", () => {
  const valid = tryParseEquation("2x=8");
  const invalid = tryParseEquation("2x 8");

  assert.equal(valid.ok, true);
  assert.equal(formatEquation(valid.value), "2x = 8");
  assert.equal(invalid.ok, false);
  assert.ok(invalid.error instanceof EquationParseError);
  assert.match(invalid.error.message, /Gleichheitszeichen/u);
});


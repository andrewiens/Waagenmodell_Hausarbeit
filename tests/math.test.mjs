import test from "node:test";
import assert from "node:assert/strict";

import {
  Fraction,
  MathOperationError,
  applyHistoryOperation,
  applyOperation,
  createEquation,
  createHistory,
  equationsEquivalent,
  evaluateEquation,
  evaluateSide,
  formatEquation,
  formatFraction,
  formatOperation,
  formatSide,
  resetHistory,
  solveEquation,
  undoHistory,
} from "../js/math.js";

function equation(a, b, c, d) {
  return createEquation(a, b, c, d);
}

test("Fraction rechnet mit Dezimalzahlen und Brüchen exakt", () => {
  assert.equal(Fraction.from("0.1").add("0.2").toString(), "3/10");
  assert.equal(Fraction.from("1,25").toString(), "5/4");
  assert.equal(Fraction.from("-6/-8").toString(), "3/4");
  assert.equal(new Fraction(10n, -20n).toString(), "-1/2");
  assert.equal(Fraction.from("1e-3").toString(), "1/1000");
});

test("Fraction lehnt einen Nullnenner und Division durch null ab", () => {
  assert.throws(() => Fraction.from("1/0"), /Nenner.*null/u);
  assert.throws(() => Fraction.from(2).divide(0), /Division durch null/u);
});

test("3x + 2 = 11 besitzt die Lösung x=3", () => {
  const solution = solveEquation(equation(3, 2, 0, 11));
  assert.equal(solution.type, "unique");
  assert.equal(solution.value.toString(), "3");
});

test("5x + 4 = 2x + 13 besitzt die Lösung x=3", () => {
  const solution = solveEquation(equation(5, 4, 2, 13));
  assert.equal(solution.type, "unique");
  assert.equal(solution.value.toString(), "3");
});

test("2x = 3 besitzt exakt die Bruchlösung x=3/2", () => {
  const solution = solveEquation(equation(2, 0, 0, 3));
  assert.equal(solution.type, "unique");
  assert.equal(solution.value.toString(), "3/2");
});

test("-x + 5 = 2 besitzt die Lösung x=3", () => {
  const solution = solveEquation(equation(-1, 5, 0, 2));
  assert.equal(solution.type, "unique");
  assert.equal(solution.value.toString(), "3");
});

test("allgemeingültige und widersprüchliche Gleichungen werden unterschieden", () => {
  assert.deepEqual(solveEquation(equation(2, 1, 2, 1)), { type: "infinite" });
  assert.deepEqual(solveEquation(equation(2, 1, 2, 3)), { type: "none" });
});

test("beidseitige Addition erhält die Lösungsmenge und mutiert die Eingabe nicht", () => {
  const original = equation(3, 2, 0, 11);
  const result = applyOperation(original, { kind: "add", value: 4, side: "both" });

  assert.equal(formatEquation(original), "3x + 2 = 11");
  assert.equal(formatEquation(result.equation), "3x + 6 = 15");
  assert.equal(result.equivalent, true);
  assert.equal(equationsEquivalent(original, result.equation), true);
});

test("beidseitige Subtraktion erhält die Lösungsmenge", () => {
  const original = equation(3, 2, 0, 11);
  const result = applyOperation(original, { kind: "subtract", value: 2, side: "both" });

  assert.equal(formatEquation(result.equation), "3x = 9");
  assert.equal(result.equivalent, true);
  assert.equal(equationsEquivalent(original, result.equation), true);
});

test("beidseitige Multiplikation mit einer Zahl ungleich null erhält die Lösungsmenge", () => {
  const original = equation(2, -1, 0, 4);
  const result = applyOperation(original, { kind: "multiply", value: "-3/2", side: "both" });

  assert.equal(formatEquation(result.equation), "-3x + 3/2 = -6");
  assert.equal(result.equivalent, true);
  assert.equal(equationsEquivalent(original, result.equation), true);
});

test("beidseitige Division mit einer Zahl ungleich null erzeugt exakte Brüche", () => {
  const original = equation(2, 1, 0, 3);
  const result = applyOperation(original, { kind: "divide", value: 2, side: "both" });

  assert.equal(formatEquation(result.equation), "x + 1/2 = 3/2");
  assert.equal(result.equivalent, true);
  assert.equal(equationsEquivalent(original, result.equation), true);
});

test("beidseitiges Addieren und Subtrahieren von x-Termen ist äquivalent", () => {
  const original = equation(5, 4, 2, 13);
  const subtract = applyOperation(original, { kind: "subtractX", value: 2, side: "both" });
  const add = applyOperation(subtract.equation, { kind: "addX", value: "1/2", side: "both" });

  assert.equal(formatEquation(subtract.equation), "3x + 4 = 13");
  assert.equal(formatEquation(add.equation), "7/2x + 4 = 1/2x + 13");
  assert.equal(subtract.equivalent, true);
  assert.equal(add.equivalent, true);
  assert.equal(equationsEquivalent(original, add.equation), true);
});

test("Division durch null wird mit einem verständlichen Fehler verhindert", () => {
  assert.throws(
    () => applyOperation(equation(2, 0, 0, 8), { kind: "divide", value: 0, side: "both" }),
    (error) => error instanceof MathOperationError
      && error.code === "DIVISION_BY_ZERO"
      && /Division durch null/u.test(error.message),
  );
});

test("beidseitige Multiplikation mit null wird nicht als Äquivalenzumformung zugelassen", () => {
  assert.throws(
    () => applyOperation(equation(2, 0, 0, 8), { kind: "multiply", value: 0, side: "both" }),
    (error) => error instanceof MathOperationError && error.code === "MULTIPLICATION_BY_ZERO",
  );
});

test("einseitige Veränderung ist nicht äquivalent und kippt am ursprünglichen Lösungswert", () => {
  const original = equation(3, 2, 0, 11);
  const result = applyOperation(original, { kind: "add", value: 1, side: "left" });
  const originalSolution = solveEquation(original);
  const balance = evaluateEquation(result.equation, originalSolution.value);

  assert.equal(result.equivalent, false);
  assert.equal(equationsEquivalent(original, result.equation), false);
  assert.equal(balance.left.toString(), "12");
  assert.equal(balance.right.toString(), "11");
  assert.equal(balance.balanced, false);
  assert.match(result.feedback, /nur die linke Seite/u);
});

test("eine einseitige Fixpunkt-Operation wird nicht künstlich als Kippen berechnet", () => {
  const original = equation(1, 0, 0, 0);
  const result = applyOperation(original, { kind: "multiply", value: 2, side: "left" });
  const balanceAtOriginalSolution = evaluateEquation(result.equation, 0);

  // Die Vorgehensweise ist weiterhin nicht als Äquivalenzumformung erlaubt.
  assert.equal(result.equivalent, false);
  // Bei x=0 ändern sich die sichtbaren Werte hier zufällig trotzdem nicht.
  assert.equal(balanceAtOriginalSolution.balanced, true);
});

test("evaluateSide berechnet ax+b exakt", () => {
  assert.equal(evaluateSide({ x: "2/3", constant: "1/6" }, "3/2").toString(), "7/6");
});

test("History-Helfer ermöglichen unveränderliches Rückgängigmachen und Zurücksetzen", () => {
  const initial = createHistory(equation(3, 2, 0, 11));
  const afterSubtract = applyHistoryOperation(initial, {
    kind: "subtract",
    value: 2,
    side: "both",
  });
  const afterDivide = applyHistoryOperation(afterSubtract, {
    kind: "divide",
    value: 3,
    side: "both",
  });
  const undone = undoHistory(afterDivide);
  const reset = resetHistory(afterDivide);

  assert.equal(formatEquation(initial.current), "3x + 2 = 11");
  assert.equal(initial.steps.length, 0);
  assert.equal(formatEquation(afterDivide.current), "x = 3");
  assert.equal(afterDivide.steps.length, 2);
  assert.equal(formatEquation(undone.current), "3x = 9");
  assert.equal(undone.steps.length, 1);
  assert.equal(formatEquation(reset.current), "3x + 2 = 11");
  assert.equal(reset.steps.length, 0);
});

test("Formatierung lässt 1 und 0 an didaktisch passenden Stellen weg", () => {
  assert.equal(formatSide({ x: 1, constant: 0 }), "x");
  assert.equal(formatSide({ x: -1, constant: 5 }), "-x + 5");
  assert.equal(formatSide({ x: 0, constant: 0 }), "0");
  assert.equal(formatEquation(equation(1, -5, 0, "3/2")), "x - 5 = 3/2");
  assert.equal(formatFraction("6/4"), "3/2");
  assert.equal(formatOperation({ kind: "subtract", value: 2, side: "both" }), "| -2");
  assert.equal(formatOperation({ kind: "addX", value: 3, side: "both" }), "| +3x");
  assert.equal(formatOperation({ kind: "divide", value: 3, side: "both" }), "| :3");
});

/**
 * Exakte mathematische Kernlogik für lineare Gleichungen der Form ax+b=cx+d.
 *
 * Alle öffentlichen Funktionen behandeln Gleichungen unveränderlich: Statt ein
 * übergebenes Objekt zu verändern, liefern sie ein neues, eingefrorenes Objekt.
 * Dadurch lassen sich Verlauf und Rückgängig-Funktion ohne versteckten Zustand
 * aufbauen und testen.
 */

const INTEGER_PATTERN = /^[+-]?\d+$/u;
const DECIMAL_PATTERN = /^([+-]?)(?:(\d+)(?:[.,](\d*))?|[.,](\d+))(?:[eE]([+-]?\d+))?$/u;
const MAX_DECIMAL_SCALE = 10_000;

function absBigInt(value) {
  return value < 0n ? -value : value;
}

function greatestCommonDivisor(first, second) {
  let a = absBigInt(first);
  let b = absBigInt(second);

  while (b !== 0n) {
    [a, b] = [b, a % b];
  }

  return a;
}

function toBigIntInteger(value, name) {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value);
  }

  if (typeof value === "string" && INTEGER_PATTERN.test(value.trim())) {
    return BigInt(value.trim());
  }

  throw new TypeError(`${name} muss eine ganze Zahl sein.`);
}

function powerOfTen(exponent) {
  if (!Number.isSafeInteger(exponent) || exponent < 0 || exponent > MAX_DECIMAL_SCALE) {
    throw new RangeError("Die Zahl enthält zu viele Dezimalstellen.");
  }

  return 10n ** BigInt(exponent);
}

function decimalToFractionParts(rawValue) {
  const value = rawValue.trim();
  const match = DECIMAL_PATTERN.exec(value);

  if (!match) {
    throw new TypeError(`„${rawValue}“ ist keine gültige Zahl.`);
  }

  const [, signToken, integerDigits = "0", trailingFraction, leadingFraction, exponentToken] = match;
  const fractionDigits = trailingFraction ?? leadingFraction ?? "";
  const unsignedDigits = `${integerDigits}${fractionDigits}`.replace(/^0+(?=\d)/u, "") || "0";
  const exponent = exponentToken === undefined ? 0 : Number(exponentToken);

  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_DECIMAL_SCALE) {
    throw new RangeError("Der Exponent der Zahl ist zu groß.");
  }

  const scale = fractionDigits.length - exponent;
  let numerator = BigInt(unsignedDigits);
  let denominator = 1n;

  if (scale >= 0) {
    denominator = powerOfTen(scale);
  } else {
    numerator *= powerOfTen(-scale);
  }

  if (signToken === "-") {
    numerator = -numerator;
  }

  return { numerator, denominator };
}

function stringToFractionParts(rawValue) {
  const value = rawValue.trim();
  const slashParts = value.split("/");

  if (slashParts.length > 2 || slashParts.some((part) => part.trim() === "")) {
    throw new TypeError(`„${rawValue}“ ist kein gültiger Bruch.`);
  }

  if (slashParts.length === 1) {
    return decimalToFractionParts(slashParts[0]);
  }

  const top = decimalToFractionParts(slashParts[0]);
  const bottom = decimalToFractionParts(slashParts[1]);

  if (bottom.numerator === 0n) {
    throw new RangeError("Der Nenner eines Bruchs darf nicht null sein.");
  }

  return {
    numerator: top.numerator * bottom.denominator,
    denominator: top.denominator * bottom.numerator,
  };
}

/** Ein vollständig gekürzter, exakter Bruch. */
export class Fraction {
  constructor(numerator = 0n, denominator = 1n) {
    let normalizedNumerator = toBigIntInteger(numerator, "Der Zähler");
    let normalizedDenominator = toBigIntInteger(denominator, "Der Nenner");

    if (normalizedDenominator === 0n) {
      throw new RangeError("Der Nenner eines Bruchs darf nicht null sein.");
    }

    if (normalizedDenominator < 0n) {
      normalizedNumerator = -normalizedNumerator;
      normalizedDenominator = -normalizedDenominator;
    }

    const divisor = greatestCommonDivisor(normalizedNumerator, normalizedDenominator);
    this.numerator = normalizedNumerator / divisor;
    this.denominator = normalizedDenominator / divisor;
    Object.freeze(this);
  }

  /** Wandelt Ganzzahlen, Dezimalzahlen, Bruchtexte und Fraction-Objekte exakt um. */
  static from(value) {
    if (value instanceof Fraction) {
      return value;
    }

    if (typeof value === "bigint") {
      return new Fraction(value);
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new TypeError("Die Zahl muss endlich sein.");
      }
      return Fraction.from(String(value));
    }

    if (typeof value === "string") {
      const { numerator, denominator } = stringToFractionParts(value);
      return new Fraction(numerator, denominator);
    }

    if (
      value !== null
      && typeof value === "object"
      && "numerator" in value
      && "denominator" in value
    ) {
      return new Fraction(value.numerator, value.denominator);
    }

    throw new TypeError("Der Wert muss eine Zahl oder ein Bruch sein.");
  }

  add(other) {
    const fraction = Fraction.from(other);
    return new Fraction(
      this.numerator * fraction.denominator + fraction.numerator * this.denominator,
      this.denominator * fraction.denominator,
    );
  }

  subtract(other) {
    return this.add(Fraction.from(other).negate());
  }

  multiply(other) {
    const fraction = Fraction.from(other);
    return new Fraction(
      this.numerator * fraction.numerator,
      this.denominator * fraction.denominator,
    );
  }

  divide(other) {
    const fraction = Fraction.from(other);

    if (fraction.isZero()) {
      throw new RangeError("Eine Division durch null ist nicht erlaubt.");
    }

    return new Fraction(
      this.numerator * fraction.denominator,
      this.denominator * fraction.numerator,
    );
  }

  negate() {
    return new Fraction(-this.numerator, this.denominator);
  }

  abs() {
    return this.numerator < 0n ? this.negate() : this;
  }

  reciprocal() {
    if (this.isZero()) {
      throw new RangeError("Null besitzt keinen Kehrwert.");
    }
    return new Fraction(this.denominator, this.numerator);
  }

  equals(other) {
    const fraction = Fraction.from(other);
    return this.numerator === fraction.numerator && this.denominator === fraction.denominator;
  }

  compare(other) {
    const fraction = Fraction.from(other);
    const difference = this.numerator * fraction.denominator
      - fraction.numerator * this.denominator;
    return difference < 0n ? -1 : difference > 0n ? 1 : 0;
  }

  isZero() {
    return this.numerator === 0n;
  }

  isInteger() {
    return this.denominator === 1n;
  }

  toNumber() {
    return Number(this.numerator) / Number(this.denominator);
  }

  toString() {
    return this.denominator === 1n
      ? this.numerator.toString()
      : `${this.numerator}/${this.denominator}`;
  }

  toJSON() {
    return this.toString();
  }
}

export class MathOperationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "MathOperationError";
    this.code = code;
  }
}

function firstDefined(object, keys) {
  for (const key of keys) {
    if (object[key] !== undefined) {
      return object[key];
    }
  }
  return undefined;
}

/** Erzeugt eine normalisierte Seite ax+b. */
export function createSide(x = 0, constant = 0) {
  let xValue = x;
  let constantValue = constant;

  if (arguments.length === 1 && x !== null && typeof x === "object" && !(x instanceof Fraction)) {
    xValue = firstDefined(x, ["x", "coefficient", "a"]);
    constantValue = firstDefined(x, ["constant", "b"]);
  }

  return Object.freeze({
    x: Fraction.from(xValue ?? 0),
    constant: Fraction.from(constantValue ?? 0),
  });
}

/**
 * Erzeugt eine Gleichung. Akzeptiert entweder (a,b,c,d), (left,right) oder ein
 * Objekt mit den Eigenschaften left und right.
 */
export function createEquation(first = 0, second = 0, third = 0, fourth = 0) {
  let left;
  let right;

  if (arguments.length === 1 && first !== null && typeof first === "object") {
    if (!("left" in first) || !("right" in first)) {
      throw new TypeError("Die Gleichung benötigt eine linke und eine rechte Seite.");
    }
    left = createSide(first.left);
    right = createSide(first.right);
  } else if (
    arguments.length === 2
    && first !== null
    && second !== null
    && typeof first === "object"
    && typeof second === "object"
  ) {
    left = createSide(first);
    right = createSide(second);
  } else {
    left = createSide(first, second);
    right = createSide(third, fourth);
  }

  return Object.freeze({ left, right });
}

function normalizeEquation(equation) {
  return createEquation(equation);
}

/** Berechnet den Wert einer Seite ax+b für einen vorgegebenen x-Wert. */
export function evaluateSide(side, xValue) {
  const normalizedSide = createSide(side);
  const x = Fraction.from(xValue);
  return normalizedSide.x.multiply(x).add(normalizedSide.constant);
}

/** Berechnet beide Seiten und deren Differenz für einen vorgegebenen x-Wert. */
export function evaluateEquation(equation, xValue) {
  const normalizedEquation = normalizeEquation(equation);
  const left = evaluateSide(normalizedEquation.left, xValue);
  const right = evaluateSide(normalizedEquation.right, xValue);
  const difference = left.subtract(right);

  return Object.freeze({
    left,
    right,
    difference,
    balanced: difference.isZero(),
    comparison: difference.compare(0),
  });
}

/**
 * Klassifiziert die Lösungsmenge exakt.
 * - unique: genau eine Lösung, abrufbar als value
 * - infinite: alle Zahlen sind Lösungen
 * - none: keine Zahl ist eine Lösung
 */
export function solveEquation(equation) {
  const normalizedEquation = normalizeEquation(equation);
  const coefficient = normalizedEquation.left.x.subtract(normalizedEquation.right.x);
  const constantDifference = normalizedEquation.right.constant
    .subtract(normalizedEquation.left.constant);

  if (!coefficient.isZero()) {
    return Object.freeze({
      type: "unique",
      value: constantDifference.divide(coefficient),
    });
  }

  return constantDifference.isZero()
    ? Object.freeze({ type: "infinite" })
    : Object.freeze({ type: "none" });
}

/** Vergleicht die Lösungsmengen zweier Gleichungen. */
export function equationsEquivalent(firstEquation, secondEquation) {
  const firstSolution = solveEquation(firstEquation);
  const secondSolution = solveEquation(secondEquation);

  if (firstSolution.type !== secondSolution.type) {
    return false;
  }

  return firstSolution.type !== "unique" || firstSolution.value.equals(secondSolution.value);
}

const OPERATION_KIND_ALIASES = Object.freeze({
  add: "add",
  addConstant: "add",
  subtract: "subtract",
  subtractConstant: "subtract",
  multiply: "multiply",
  divide: "divide",
  addX: "addX",
  addVariable: "addX",
  subtractX: "subtractX",
  subtractVariable: "subtractX",
  simplify: "simplify",
  combine: "simplify",
});

function normalizeOperation(operation) {
  if (operation === null || typeof operation !== "object") {
    throw new MathOperationError("INVALID_OPERATION", "Bitte wähle eine mathematische Operation aus.");
  }

  const kind = OPERATION_KIND_ALIASES[operation.kind];
  if (!kind) {
    throw new MathOperationError("UNKNOWN_OPERATION", "Diese mathematische Operation wird nicht unterstützt.");
  }

  const side = operation.side ?? "both";
  if (!new Set(["both", "left", "right"]).has(side)) {
    throw new MathOperationError(
      "INVALID_SIDE",
      "Die Operation muss auf beide Seiten, nur links oder nur rechts angewendet werden.",
    );
  }

  if (kind === "simplify") {
    return Object.freeze({ kind, side });
  }

  let value;
  try {
    value = Fraction.from(operation.value);
  } catch (error) {
    throw new MathOperationError(
      "INVALID_OPERATION_VALUE",
      `Bitte gib für die Operation eine gültige Zahl ein. ${error.message}`,
    );
  }

  if (kind === "divide" && value.isZero()) {
    throw new MathOperationError("DIVISION_BY_ZERO", "Eine Division durch null ist nicht erlaubt.");
  }

  if (kind === "multiply" && value.isZero() && side === "both") {
    throw new MathOperationError(
      "MULTIPLICATION_BY_ZERO",
      "Die Multiplikation beider Seiten mit null ist keine Äquivalenzumformung.",
    );
  }

  return Object.freeze({ kind, value, side });
}

function transformSide(side, operation) {
  switch (operation.kind) {
    case "add":
      return createSide(side.x, side.constant.add(operation.value));
    case "subtract":
      return createSide(side.x, side.constant.subtract(operation.value));
    case "multiply":
      return createSide(
        side.x.multiply(operation.value),
        side.constant.multiply(operation.value),
      );
    case "divide":
      return createSide(
        side.x.divide(operation.value),
        side.constant.divide(operation.value),
      );
    case "addX":
      return createSide(side.x.add(operation.value), side.constant);
    case "subtractX":
      return createSide(side.x.subtract(operation.value), side.constant);
    case "simplify":
      return createSide(side);
    default:
      throw new MathOperationError("UNKNOWN_OPERATION", "Diese Operation wird nicht unterstützt.");
  }
}

function operationFeedback(equivalent, side) {
  if (equivalent) {
    return "Das Gleichgewicht bleibt erhalten, weil du auf beiden Seiten dieselbe Operation durchgeführt hast.";
  }

  const sideName = side === "left" ? "linke" : "rechte";
  return `Du hast nur die ${sideName} Seite verändert. Deshalb ist diese Umformung nicht äquivalent.`;
}

/**
 * Wendet eine Operation rein funktional an und liefert neben der neuen Gleichung
 * alle Angaben, die Verlauf und Rückmeldung benötigen.
 */
export function applyOperation(equation, requestedOperation) {
  const before = normalizeEquation(equation);
  const operation = normalizeOperation(requestedOperation);
  let left = before.left;
  let right = before.right;

  if (operation.side === "both" || operation.side === "left") {
    left = transformSide(left, operation);
  }
  if (operation.side === "both" || operation.side === "right") {
    right = transformSide(right, operation);
  }

  const after = createEquation(left, right);
  const equivalent = operation.side === "both" && equationsEquivalent(before, after);

  return Object.freeze({
    equation: after,
    equivalent,
    operation,
    beforeSolution: solveEquation(before),
    afterSolution: solveEquation(after),
    feedback: operationFeedback(equivalent, operation.side),
  });
}

function freezeHistory(history) {
  return Object.freeze({
    initial: history.initial,
    current: history.current,
    steps: Object.freeze([...history.steps]),
  });
}

/** Erstellt einen unveränderlichen Verlauf für eine Ausgangsgleichung. */
export function createHistory(initialEquation) {
  const initial = normalizeEquation(initialEquation);
  return freezeHistory({ initial, current: initial, steps: [] });
}

/** Wendet eine Operation an und ergänzt einen neuen, unveränderlichen Verlaufsschritt. */
export function applyHistoryOperation(history, requestedOperation) {
  if (history === null || typeof history !== "object" || !("current" in history)) {
    throw new TypeError("Der Lösungsverlauf ist ungültig.");
  }

  const result = applyOperation(history.current, requestedOperation);
  const step = Object.freeze({
    before: normalizeEquation(history.current),
    after: result.equation,
    operation: result.operation,
    equivalent: result.equivalent,
    feedback: result.feedback,
  });

  return freezeHistory({
    initial: normalizeEquation(history.initial),
    current: result.equation,
    steps: [...(history.steps ?? []), step],
  });
}

/** Entfernt den letzten Schritt, ohne den bisherigen Verlauf zu verändern. */
export function undoHistory(history) {
  if (history === null || typeof history !== "object" || !("initial" in history)) {
    throw new TypeError("Der Lösungsverlauf ist ungültig.");
  }

  const remainingSteps = [...(history.steps ?? [])].slice(0, -1);
  const current = remainingSteps.length > 0
    ? remainingSteps[remainingSteps.length - 1].after
    : normalizeEquation(history.initial);

  return freezeHistory({
    initial: normalizeEquation(history.initial),
    current,
    steps: remainingSteps,
  });
}

/** Setzt den Verlauf auf seine Ausgangsgleichung zurück. */
export function resetHistory(history) {
  return createHistory(history.initial);
}

export const undoLastOperation = undoHistory;

/** Formatiert einen exakten Bruch ohne Dezimalrundung. */
export function formatFraction(value) {
  return Fraction.from(value).toString();
}

function formatVariableTerm(coefficient) {
  if (coefficient.equals(1)) {
    return "x";
  }
  if (coefficient.equals(-1)) {
    return "-x";
  }
  return `${coefficient.toString()}x`;
}

/** Formatiert eine normalisierte Seite, zum Beispiel -x + 5 oder 3/2x - 1. */
export function formatSide(side) {
  const normalizedSide = createSide(side);
  const pieces = [];

  if (!normalizedSide.x.isZero()) {
    pieces.push(formatVariableTerm(normalizedSide.x));
  }

  if (!normalizedSide.constant.isZero()) {
    if (pieces.length === 0) {
      pieces.push(normalizedSide.constant.toString());
    } else if (normalizedSide.constant.compare(0) > 0) {
      pieces.push(`+ ${normalizedSide.constant.toString()}`);
    } else {
      pieces.push(`- ${normalizedSide.constant.abs().toString()}`);
    }
  }

  return pieces.length === 0 ? "0" : pieces.join(" ");
}

/** Formatiert eine Gleichung in einer gut lesbaren, wieder einlesbaren Form. */
export function formatEquation(equation) {
  const normalizedEquation = normalizeEquation(equation);
  return `${formatSide(normalizedEquation.left)} = ${formatSide(normalizedEquation.right)}`;
}

/** Formatiert die senkrechte Operationsnotiz für den Lösungsverlauf. */
export function formatOperation(requestedOperation) {
  const operation = normalizeOperation(requestedOperation);

  if (operation.kind === "simplify") {
    return "| Terme zusammenfassen";
  }

  const value = operation.value;
  const absolute = value.abs().toString();
  const suffix = operation.kind === "addX" || operation.kind === "subtractX" ? "x" : "";

  switch (operation.kind) {
    case "add":
    case "addX":
      return value.compare(0) >= 0
        ? `| +${absolute}${suffix}`
        : `| -${absolute}${suffix}`;
    case "subtract":
    case "subtractX":
      return value.compare(0) >= 0
        ? `| -${absolute}${suffix}`
        : `| +${absolute}${suffix}`;
    case "multiply":
      return `| ·${value.toString()}`;
    case "divide":
      return `| :${value.toString()}`;
    default:
      return "|";
  }
}

/** Altersgerechter Text für eine klassifizierte Lösungsmenge. */
export function formatSolution(solutionOrEquation) {
  const solution = solutionOrEquation?.type
    ? solutionOrEquation
    : solveEquation(solutionOrEquation);

  if (solution.type === "unique") {
    return `x = ${solution.value.toString()}`;
  }
  if (solution.type === "infinite") {
    return "Die Gleichung ist für alle Zahlen erfüllt.";
  }
  return "Die Gleichung besitzt keine Lösung.";
}


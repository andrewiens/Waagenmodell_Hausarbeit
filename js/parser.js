/** Sichere Eingabeverarbeitung für lineare Gleichungen mit einer Unbekannten. */

import { Fraction, createEquation, createSide } from "./math.js";

const MAX_INPUT_LENGTH = 250;
const DECIMAL_TOKEN = String.raw`(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?`;
const NUMBER_AT_START = new RegExp(`^(${DECIMAL_TOKEN})(?:/([+-]?${DECIMAL_TOKEN}))?`, "u");

export class EquationParseError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "EquationParseError";
    this.code = code;
    this.position = details.position ?? null;
    this.side = details.side ?? null;
    this.input = details.input ?? null;
  }
}

function parserError(code, message, details) {
  return new EquationParseError(code, message, details);
}

function normalizeSymbols(value) {
  return value
    .replace(/[\u2212\u2013\u2014]/gu, "-")
    .replace(/[\u00d7\u22c5\u00b7]/gu, "*")
    .replace(/\s/gu, "")
    .toLowerCase();
}

function inputLabel(side) {
  return side === "left" ? "linken" : "rechten";
}

/**
 * Liest eine einzelne Zahl exakt. Erlaubt sind ganze Zahlen, endliche
 * Dezimalzahlen (Punkt oder Komma) und Brüche wie 3/4.
 */
export function parseScalar(input) {
  if (input instanceof Fraction) {
    return input;
  }

  if (typeof input === "number" || typeof input === "bigint") {
    try {
      return Fraction.from(input);
    } catch (error) {
      throw parserError("INVALID_NUMBER", `Bitte gib eine gültige Zahl ein. ${error.message}`, { input });
    }
  }

  if (typeof input !== "string") {
    throw parserError("INVALID_NUMBER", "Bitte gib eine Zahl ein.", { input });
  }

  const normalized = normalizeSymbols(input);
  if (normalized === "") {
    throw parserError("EMPTY_NUMBER", "Bitte gib eine Zahl ein.", { input });
  }

  if (normalized.includes("x")) {
    throw parserError(
      "VARIABLE_NOT_ALLOWED",
      "In diesem Feld wird nur eine Zahl ohne x benötigt.",
      { input },
    );
  }

  try {
    return Fraction.from(normalized);
  } catch (error) {
    const isZeroDenominator = /Nenner.*null|durch null/iu.test(error.message);
    throw parserError(
      isZeroDenominator ? "ZERO_DENOMINATOR" : "INVALID_NUMBER",
      isZeroDenominator
        ? "Der Nenner eines Bruchs darf nicht null sein."
        : "Bitte gib eine Zahl wie -2, 1,5 oder 3/4 ein.",
      { input },
    );
  }
}

function termError(expression, side, index) {
  const token = expression[index] ?? "";
  const details = { input: expression, side, position: index };

  if (token === "(" || token === ")") {
    return parserError(
      "PARENTHESES_NOT_SUPPORTED",
      "Klammern werden hier noch nicht unterstützt. Gib jede Seite in der Form ax + b ein.",
      details,
    );
  }

  if (token === "x" || token === "*" || token === "^" || token === "²") {
    return parserError(
      "NON_LINEAR_TERM",
      "Die Eingabe darf nur x-Terme der Form 3x oder -x enthalten; x² und Produkte mit x sind nicht linear.",
      details,
    );
  }

  if (/[a-z]/u.test(token)) {
    return parserError(
      "UNKNOWN_VARIABLE",
      "Verwende bitte nur x als Unbekannte.",
      details,
    );
  }

  return parserError(
    "INVALID_CHARACTER",
    `Auf der ${inputLabel(side)} Seite steht ein ungültiges Zeichen${token ? `: „${token}“` : ""}.`,
    details,
  );
}

/** Liest und fasst eine lineare Seite zusammen, zum Beispiel 2x-x+3. */
export function parseLinearExpression(input, side = "left") {
  if (typeof input !== "string") {
    throw parserError("INVALID_SIDE", "Eine Gleichungsseite muss als Text eingegeben werden.", {
      input,
      side,
    });
  }

  const expression = normalizeSymbols(input);
  if (expression === "") {
    throw parserError(
      "EMPTY_SIDE",
      `Auf der ${inputLabel(side)} Seite der Gleichung fehlt ein Term.`,
      { input, side },
    );
  }

  let index = 0;
  let xCoefficient = Fraction.from(0);
  let constant = Fraction.from(0);
  let termCount = 0;

  while (index < expression.length) {
    let sign = 1;

    if (expression[index] === "+" || expression[index] === "-") {
      sign = expression[index] === "-" ? -1 : 1;
      index += 1;
    } else if (termCount > 0) {
      throw parserError(
        "MISSING_OPERATOR",
        `Zwischen zwei Termen auf der ${inputLabel(side)} Seite fehlt ein Plus- oder Minuszeichen.`,
        { input, side, position: index },
      );
    }

    if (index >= expression.length || expression[index] === "+" || expression[index] === "-") {
      throw parserError(
        "MISSING_TERM",
        `Auf der ${inputLabel(side)} Seite fehlt nach dem Rechenzeichen ein Term.`,
        { input, side, position: index },
      );
    }

    let magnitude;
    let isVariable = false;

    if (expression[index] === "x") {
      magnitude = Fraction.from(1);
      isVariable = true;
      index += 1;
    } else {
      const numberMatch = NUMBER_AT_START.exec(expression.slice(index));
      if (!numberMatch) {
        throw termError(expression, side, index);
      }

      const numberToken = numberMatch[0];
      try {
        magnitude = Fraction.from(numberToken);
      } catch (error) {
        const isZeroDenominator = /Nenner.*null|durch null/iu.test(error.message);
        throw parserError(
          isZeroDenominator ? "ZERO_DENOMINATOR" : "INVALID_NUMBER",
          isZeroDenominator
            ? "Der Nenner eines Bruchs darf nicht null sein."
            : `Die Zahl „${numberToken}“ ist nicht gültig.`,
          { input, side, position: index },
        );
      }
      index += numberToken.length;

      if (expression[index] === "*") {
        if (expression[index + 1] !== "x") {
          throw parserError(
            "INVALID_MULTIPLICATION",
            "Ein Malzeichen darf hier nur zwischen einer Zahl und x stehen, zum Beispiel 3*x.",
            { input, side, position: index },
          );
        }
        index += 1;
      }

      if (expression[index] === "x") {
        isVariable = true;
        index += 1;
      }
    }

    const signedMagnitude = sign === -1 ? magnitude.negate() : magnitude;
    if (isVariable) {
      xCoefficient = xCoefficient.add(signedMagnitude);
    } else {
      constant = constant.add(signedMagnitude);
    }
    termCount += 1;

    if (index < expression.length && expression[index] !== "+" && expression[index] !== "-") {
      if (!/[\d.,]/u.test(expression[index])) {
        throw termError(expression, side, index);
      }
      throw parserError(
        "MISSING_OPERATOR",
        `Zwischen zwei Termen auf der ${inputLabel(side)} Seite fehlt ein Plus- oder Minuszeichen.`,
        { input, side, position: index },
      );
    }
  }

  return createSide(xCoefficient, constant);
}

/** Liest eine vollständige Gleichung mit genau einem Gleichheitszeichen. */
export function parseEquation(input) {
  if (typeof input !== "string") {
    throw parserError(
      "INVALID_INPUT_TYPE",
      "Bitte gib die Gleichung als Text ein, zum Beispiel 3x + 2 = 11.",
      { input },
    );
  }

  if (input.trim() === "") {
    throw parserError(
      "EMPTY_INPUT",
      "Bitte gib eine Gleichung ein, zum Beispiel 3x + 2 = 11.",
      { input },
    );
  }

  if (input.length > MAX_INPUT_LENGTH) {
    throw parserError(
      "INPUT_TOO_LONG",
      "Die Eingabe ist zu lang. Gib bitte eine einzelne lineare Gleichung ein.",
      { input },
    );
  }

  const normalized = normalizeSymbols(input);
  const unsafeCharacterIndex = normalized.search(/[<>{}\[\]"'`]/u);
  if (unsafeCharacterIndex >= 0) {
    throw parserError(
      "INVALID_CHARACTER",
      "Die Eingabe enthält ein ungültiges Zeichen. Verwende bitte nur Zahlen, x, Rechenzeichen und =.",
      { input, position: unsafeCharacterIndex },
    );
  }

  const equalsCount = [...normalized].filter((character) => character === "=").length;

  if (equalsCount === 0) {
    throw parserError(
      "MISSING_EQUALS",
      "Zwischen linker und rechter Seite fehlt das Gleichheitszeichen (=).",
      { input },
    );
  }

  if (equalsCount > 1) {
    throw parserError(
      "TOO_MANY_EQUALS",
      "Eine Gleichung darf hier nur ein Gleichheitszeichen (=) enthalten.",
      { input },
    );
  }

  const [leftInput, rightInput] = normalized.split("=");
  if (leftInput === "" || rightInput === "") {
    const side = leftInput === "" ? "left" : "right";
    throw parserError(
      "EMPTY_SIDE",
      `Auf der ${inputLabel(side)} Seite des Gleichheitszeichens fehlt ein Term.`,
      { input, side },
    );
  }

  const left = parseLinearExpression(leftInput, "left");
  const right = parseLinearExpression(rightInput, "right");
  return createEquation(left, right);
}

/** Fehlerfreundliche Alternative für Oberflächen ohne try/catch. */
export function tryParseEquation(input) {
  try {
    return Object.freeze({ ok: true, value: parseEquation(input) });
  } catch (error) {
    if (error instanceof EquationParseError) {
      return Object.freeze({ ok: false, error });
    }
    throw error;
  }
}

import { Fraction } from "./math.js";

const ACTIONS = Object.freeze({
  addUnit: Object.freeze({ kind: "add", piece: "unit", direction: "add" }),
  removeUnit: Object.freeze({ kind: "subtract", piece: "unit", direction: "remove" }),
  addX: Object.freeze({ kind: "addX", piece: "x", direction: "add" }),
  removeX: Object.freeze({ kind: "subtractX", piece: "x", direction: "remove" }),
});

function assertSide(side) {
  if (side !== "left" && side !== "right") {
    throw new TypeError("Die Waagschale muss links oder rechts sein.");
  }
}

export function createDirectOperation(action, requestedSide, mode = "learn") {
  const definition = ACTIONS[action];
  if (!definition) {
    throw new TypeError(`Unbekannte Waagenaktion: ${action}`);
  }
  assertSide(requestedSide);

  return Object.freeze({
    action,
    kind: definition.kind,
    piece: definition.piece,
    direction: definition.direction,
    value: Fraction.from(1),
    requestedSide,
    side: mode === "experiment" ? requestedSide : "both",
  });
}

function pieceAmount(equation, side, piece) {
  return piece === "x" ? equation[side].x : equation[side].constant;
}

function sideLabel(side) {
  return side === "left" ? "linken" : "rechten";
}

export function validateDirectOperation(equation, operation) {
  if (operation.direction !== "remove") {
    return Object.freeze({ ok: true });
  }

  const sides = operation.side === "both"
    ? [operation.requestedSide, operation.requestedSide === "left" ? "right" : "left"]
    : [operation.requestedSide];

  for (const side of sides) {
    if (pieceAmount(equation, side, operation.piece).compare(1) < 0) {
      const counterpart = side !== operation.requestedSide;
      const missingPiece = operation.piece === "x"
        ? "keine positive x-Box"
        : "kein positives Einheitsgewicht";
      const message = counterpart
        ? `Auf der ${sideLabel(side)} Schale fehlt das passende Gegenstück: Dort liegt ${missingPiece}. Im Lernmodus darfst du nur auf beiden Seiten dasselbe entfernen.`
        : `Auf der ${sideLabel(side)} Schale liegt ${missingPiece}. Deshalb kann dort nichts Passendes direkt entfernt werden.`;
      return Object.freeze({
        ok: false,
        code: counterpart ? "COUNTERPART_MISSING" : "PIECE_MISSING",
        side,
        message,
      });
    }
  }

  return Object.freeze({ ok: true });
}

export function directActionLabel(operation) {
  const symbol = operation.piece === "x" ? "x" : "1";
  const verb = operation.direction === "add" ? "hinzufügen" : "entfernen";
  return `${symbol} ${verb}`;
}

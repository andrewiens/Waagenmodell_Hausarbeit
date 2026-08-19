import {
  applyOperation,
  evaluateSide,
  formatEquation,
  formatOperation,
  formatSide,
  solveEquation,
} from "./math.js";
import { parseEquation, parseScalar } from "./parser.js";

const DEFAULT_EQUATION = "3x + 2 = 11";

const state = {
  initialEquation: null,
  equation: null,
  originalSolution: null,
  mode: "learn",
  targetSide: "both",
  history: [],
  undoStack: [],
  nonEquivalent: false,
  lastChangedSide: null,
  solutionRevealed: false,
  hintLevel: 0,
};

const byId = (id) => document.getElementById(id);

const elements = {
  equationForm: byId("equation-form"),
  equationInput: byId("equation-input"),
  inputError: byId("input-error"),
  equationDisplay: byId("equation-display"),
  balanceStatus: byId("balance-status"),
  scaleDescription: byId("scale-description"),
  leftExpression: byId("left-expression"),
  rightExpression: byId("right-expression"),
  currentOperation: byId("current-operation"),
  scale: byId("scale"),
  scaleBeam: byId("scale-beam"),
  leftPan: byId("left-pan"),
  rightPan: byId("right-pan"),
  leftItems: byId("left-items"),
  rightItems: byId("right-items"),
  modelNote: byId("model-note"),
  modelNoteText: byId("model-note-text"),
  modeLearn: byId("mode-learn"),
  modeExperiment: byId("mode-experiment"),
  modeDescription: byId("mode-description"),
  sideSelection: byId("side-selection"),
  operationForm: byId("operation-form"),
  operationSelect: byId("operation-select"),
  operationValue: byId("operation-value"),
  operationValueLabel: byId("operation-value-label"),
  operationPreview: byId("operation-preview"),
  operationError: byId("operation-error"),
  applyOperation: byId("apply-operation"),
  simplify: byId("simplify-button"),
  feedback: byId("feedback"),
  feedbackIcon: byId("feedback-icon"),
  feedbackTitle: byId("feedback-title"),
  feedbackMessage: byId("feedback-message"),
  historyList: byId("history-list"),
  stepCounter: byId("step-counter"),
  undo: byId("undo-button"),
  reset: byId("reset-button"),
  restore: byId("restore-button"),
  solution: byId("solution-button"),
  hint: byId("hint-button"),
  newEquation: byId("new-equation-button"),
  solutionPanel: byId("solution-panel"),
  solutionContent: byId("solution-content"),
  solutionExplanation: byId("solution-explanation"),
  hintPanel: byId("hint-panel"),
  hintContent: byId("hint-content"),
  hintLevel: byId("hint-level"),
  nextHint: byId("next-hint-button"),
  openHelp: byId("open-help"),
  closeHelp: byId("close-help"),
  helpDialog: byId("help-dialog"),
  resetDialog: byId("reset-dialog"),
  confirmReset: byId("confirm-reset-button"),
};

function requiredElementsPresent() {
  const required = [
    "equationForm",
    "equationInput",
    "equationDisplay",
    "scale",
    "leftItems",
    "rightItems",
    "operationSelect",
    "operationValue",
    "feedback",
    "historyList",
  ];
  const missing = required.filter((name) => !elements[name]);
  if (missing.length > 0) {
    throw new Error(`In der Oberfläche fehlen benötigte Bereiche: ${missing.join(", ")}`);
  }
}

function prettyMath(text) {
  return String(text)
    .replaceAll("-", "−")
    .replace(/(-?\d+)\/(\d+)/gu, "$1⁄$2");
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setFeedback(message, kind = "info") {
  if (!elements.feedback) return;
  const icons = { success: "✓", warning: "⚠", error: "!", info: "i" };
  const titles = {
    success: "Guter Schritt",
    warning: "Achtung, Experiment",
    error: "Das geht noch nicht",
    info: "Dein nächster Schritt",
  };
  elements.feedback.dataset.kind = kind;
  elements.feedback.dataset.tone = kind;
  elements.feedback.className = `feedback feedback--${kind}`;
  if (elements.feedbackIcon && elements.feedbackMessage) {
    elements.feedbackIcon.textContent = icons[kind] ?? "i";
    setText(elements.feedbackTitle, titles[kind] ?? titles.info);
    elements.feedbackMessage.textContent = message;
  } else {
    elements.feedback.textContent = `${icons[kind] ?? "i"} ${message}`;
  }
}

function clearInputError() {
  setText(elements.inputError, "");
  if (elements.inputError) elements.inputError.hidden = true;
  elements.equationInput.removeAttribute("aria-invalid");
}

function showInputError(message) {
  setText(elements.inputError, message);
  if (elements.inputError) elements.inputError.hidden = false;
  elements.equationInput.setAttribute("aria-invalid", "true");
  setFeedback(message, "error");
}

function makeSnapshot() {
  return Object.freeze({
    equation: state.equation,
    historyLength: state.history.length,
    nonEquivalent: state.nonEquivalent,
    lastChangedSide: state.lastChangedSide,
    solutionRevealed: state.solutionRevealed,
    hintLevel: state.hintLevel,
  });
}

function restoreSnapshot(snapshot) {
  state.equation = snapshot.equation;
  state.history = state.history.slice(0, snapshot.historyLength);
  state.nonEquivalent = snapshot.nonEquivalent;
  state.lastChangedSide = snapshot.lastChangedSide;
  state.solutionRevealed = snapshot.solutionRevealed;
  state.hintLevel = snapshot.hintLevel;
}

function formatValue(value) {
  return prettyMath(value.toString());
}

function currentEquationText() {
  return prettyMath(formatEquation(state.equation));
}

function isNegative(value) {
  return value.compare(0) < 0;
}

function hasNegativeTerms(equation) {
  return [
    equation.left.x,
    equation.left.constant,
    equation.right.x,
    equation.right.constant,
  ].some(isNegative);
}

function isVariableIsolated(equation) {
  const leftIsX = equation.left.x.equals(1)
    && equation.left.constant.isZero()
    && equation.right.x.isZero();
  const rightIsX = equation.right.x.equals(1)
    && equation.right.constant.isZero()
    && equation.left.x.isZero();
  return leftIsX || rightIsX;
}

function appendTile(container, text, classNames, label) {
  const tile = document.createElement("span");
  tile.className = `term-tile ${classNames}`;
  tile.textContent = text;
  tile.setAttribute("aria-label", label ?? text);
  container.append(tile);
}

function renderVariableTiles(coefficient, container) {
  if (coefficient.isZero()) return;

  const negative = isNegative(coefficient);
  const absolute = coefficient.abs();
  const smallPositiveInteger = !negative
    && absolute.isInteger()
    && absolute.numerator <= 4n;

  if (smallPositiveInteger) {
    const count = Number(absolute.numerator);
    for (let index = 0; index < count; index += 1) {
      appendTile(container, "x", "x-tile", "eine x-Box");
    }
    return;
  }

  const coefficientText = absolute.equals(1) ? "" : `${formatValue(absolute)} · `;
  const visibleText = `${negative ? "−" : ""}${coefficientText}x`;
  const className = negative ? "x-tile symbolic-tile negative-tile" : "x-tile grouped-tile";
  appendTile(
    container,
    visibleText,
    className,
    `${negative ? "negativer " : ""}Variablenterm ${visibleText}`,
  );
}

function renderConstantTiles(constant, container) {
  if (constant.isZero()) return;

  const negative = isNegative(constant);
  const absolute = constant.abs();
  const smallPositiveInteger = !negative
    && absolute.isInteger()
    && absolute.numerator <= 4n;

  if (smallPositiveInteger) {
    const count = Number(absolute.numerator);
    for (let index = 0; index < count; index += 1) {
      appendTile(container, "1", "unit-tile", "Einheitsgewicht 1");
    }
    return;
  }

  const visibleText = `${negative ? "−" : ""}${formatValue(absolute)}`;
  const className = negative ? "unit-tile symbolic-tile negative-tile" : "unit-tile grouped-tile";
  appendTile(
    container,
    visibleText,
    className,
    `${negative ? "negativer symbolischer Term" : "zusammengefasstes Gewicht"} ${visibleText}`,
  );
}

function renderSide(side, container, sideName) {
  container.replaceChildren();
  renderVariableTiles(side.x, container);
  renderConstantTiles(side.constant, container);

  if (container.childElementCount === 0) {
    appendTile(container, "0", "zero-tile", "Termwert null");
  }

  container.setAttribute(
    "aria-label",
    `${sideName} Seite: ${prettyMath(formatSide(side))}`,
  );
}

function modelExplanation() {
  const reasons = [];
  const solution = state.originalSolution;

  if (solution.type !== "unique") {
    reasons.push(
      "Hier gibt es keine einzelne Zahl, die sinnvoll als Masse der x-Box eingesetzt werden kann.",
    );
  } else if (isNegative(solution.value)) {
    reasons.push(
      `Die Ausgangslösung für x ist negativ (${formatValue(solution.value)}). Eine reale Masse kann nicht negativ sein.`,
    );
  }

  if (hasNegativeTerms(state.equation)) {
    reasons.push(
      "Negative Terme sind keine echten negativen Gewichte; sie werden deshalb als gestrichelte Symbolkarten gezeigt.",
    );
  }

  if (reasons.length === 0) return null;
  return `Modellgrenze – symbolische Darstellung: ${reasons.join(" ")}`;
}

function computeBalance() {
  if (state.originalSolution.type === "unique") {
    const xValue = state.originalSolution.value;
    const left = evaluateSide(state.equation.left, xValue);
    const right = evaluateSide(state.equation.right, xValue);
    const difference = left.subtract(right);

    if (difference.isZero()) {
      return {
        state: "balanced",
        angle: 0,
        accidental: state.nonEquivalent,
        text: state.nonEquivalent
          ? "Bei der ursprünglichen Lösung sind beide Seiten zufällig noch gleich. Der einseitige Rechenschritt bleibt trotzdem keine zulässige Äquivalenzumformung."
          : "Die Waage ist im Gleichgewicht: Beide Seiten haben bei der ursprünglichen Lösung denselben Wert.",
      };
    }

    const leftHeavy = difference.compare(0) > 0;
    return {
      state: leftHeavy ? "left-heavy" : "right-heavy",
      angle: leftHeavy ? -4 : 4,
      accidental: false,
      text: leftHeavy
        ? "Die linke Seite ist bei der ursprünglichen Lösung größer und sinkt deshalb ab."
        : "Die rechte Seite ist bei der ursprünglichen Lösung größer und sinkt deshalb ab.",
    };
  }

  const coefficientDifference = state.equation.left.x.subtract(state.equation.right.x);
  if (coefficientDifference.isZero()) {
    const constantDifference = state.equation.left.constant.subtract(
      state.equation.right.constant,
    );
    if (constantDifference.isZero()) {
      return {
        state: "balanced",
        angle: 0,
        accidental: state.nonEquivalent,
        text: "Die Seiten stimmen symbolisch überein. Es wird keine bestimmte Masse für x eingesetzt.",
      };
    }
    const leftHeavy = constantDifference.compare(0) > 0;
    return {
      state: leftHeavy ? "left-heavy" : "right-heavy",
      angle: leftHeavy ? -4 : 4,
      accidental: false,
      text: "Nach dem symbolischen Kürzen gleicher x-Terme bleiben unterschiedliche Konstanten übrig.",
    };
  }

  if (state.nonEquivalent && state.lastChangedSide) {
    return {
      state: "symbolic-invalid",
      angle: 0,
      accidental: false,
      text: "Die deutliche Warnmarkierung kennzeichnet eine einseitige Veränderung. Ohne einzelne Ausgangslösung lässt sich keine schwerere Seite bestimmen; es wird deshalb keine Richtung behauptet.",
    };
  }

  return {
    state: "symbolic",
    angle: 0,
    accidental: false,
    text: "Die Waage wird hier symbolisch gelesen; eine einzelne numerische x-Masse wird nicht angenommen.",
  };
}

function renderScale() {
  renderSide(state.equation.left, elements.leftItems, "Linke");
  renderSide(state.equation.right, elements.rightItems, "Rechte");

  const explanation = modelExplanation();
  if (elements.modelNote) {
    elements.modelNote.hidden = !explanation;
    if (elements.modelNoteText) {
      elements.modelNoteText.textContent = explanation ?? "";
    } else {
      elements.modelNote.textContent = explanation ?? "";
    }
  }

  const balance = computeBalance();
  elements.scale.dataset.balance = balance.state;
  elements.scale.dataset.balanceState = balance.state;
  elements.scale.dataset.visualMode = explanation ? "symbolic" : "concrete";
  elements.scale.classList.toggle("is-balanced", balance.state === "balanced");
  elements.scale.classList.toggle("is-left-heavy", balance.state === "left-heavy");
  elements.scale.classList.toggle("is-right-heavy", balance.state === "right-heavy");
  elements.scale.classList.toggle("is-symbolic-invalid", balance.state === "symbolic-invalid");
  elements.scale.classList.toggle("is-symbolic", Boolean(explanation));
  elements.scale.classList.toggle("is-accidentally-balanced", balance.accidental);
  elements.scale.style.setProperty("--beam-angle", `${balance.angle}deg`);
  elements.scale.setAttribute("aria-label", balance.text);
  setText(elements.scaleDescription, balance.text);

  if (elements.balanceStatus) {
    const statusLabels = {
      balanced: state.nonEquivalent ? "⚠ Zufällig ausgeglichen" : "✓ Im Gleichgewicht",
      "left-heavy": "⚠ Links ist tiefer",
      "right-heavy": "⚠ Rechts ist tiefer",
      symbolic: "◇ Symbolischer Vergleich",
      "symbolic-invalid": "⚠ Einseitig verändert",
    };
    const tone = balance.state === "balanced" && !state.nonEquivalent
      ? "balanced"
      : balance.state === "symbolic" ? "symbolic" : "warning";
    elements.balanceStatus.textContent = statusLabels[balance.state];
    elements.balanceStatus.dataset.state = balance.state;
    elements.balanceStatus.className = `status-badge status-badge--${tone}`;
  }

  if (elements.scaleBeam) {
    elements.scaleBeam.setAttribute("aria-label", balance.text);
  }
}

function renderEquation() {
  elements.equationDisplay.textContent = currentEquationText();
  elements.equationDisplay.setAttribute(
    "aria-label",
    `Aktuelle Gleichung: ${formatEquation(state.equation)}`,
  );
  setText(elements.leftExpression, prettyMath(formatSide(state.equation.left)));
  setText(elements.rightExpression, prettyMath(formatSide(state.equation.right)));
  if (elements.currentOperation) {
    const lastStep = state.history.at(-1);
    elements.currentOperation.textContent = lastStep
      ? prettyMath(lastStep.operation)
      : "Wähle unten deine erste Operation.";
  }

}

function renderHistory() {
  elements.historyList.replaceChildren();

  if (state.history.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-step history-step--initial";
    const marker = document.createElement("span");
    marker.className = "history-step__marker";
    marker.textContent = "Start";
    const body = document.createElement("div");
    body.className = "history-step__body";
    const equation = document.createElement("p");
    equation.className = "history-step__equation";
    equation.textContent = prettyMath(formatEquation(state.initialEquation));
    const note = document.createElement("p");
    note.className = "history-step__note";
    note.textContent = "Ausgangsgleichung";
    body.append(equation, note);
    empty.append(marker, body);
    elements.historyList.append(empty);
    setText(elements.stepCounter, "0 Schritte");
    return;
  }

  state.history.forEach((step, index) => {
    const isRestore = step.type === "restore";
    const item = document.createElement("li");
    item.className = `history-step ${isRestore
      ? "history-step--restore"
      : step.equivalent ? "history-step--equivalent" : "history-step--experiment"}`;

    const marker = document.createElement("span");
    marker.className = "history-step__marker";
    marker.textContent = String(index + 1);

    const body = document.createElement("div");
    body.className = "history-step__body";

    const heading = document.createElement("div");
    heading.className = "history-step__heading";
    const status = isRestore
      ? "↺ Steueraktion"
      : step.equivalent ? "✓ äquivalent" : "⚠ nicht äquivalent";
    heading.textContent = `Schritt ${index + 1} · ${status}`;

    const before = document.createElement("p");
    before.className = "history-step__before";
    before.textContent = prettyMath(step.before);

    const operation = document.createElement("p");
    operation.className = "history-step__operation";
    operation.textContent = prettyMath(step.operation);

    const after = document.createElement("p");
    after.className = "history-step__equation";
    after.textContent = prettyMath(step.after);

    const explanation = document.createElement("p");
    explanation.className = "history-step__note";
    explanation.textContent = step.explanation;

    const statusLabel = document.createElement("span");
    statusLabel.className = "history-step__status";
    statusLabel.textContent = isRestore
      ? "↺ zurück"
      : step.equivalent ? "✓ gültig" : "⚠ Versuch";

    body.append(heading, before, operation, after, explanation);
    item.append(marker, body, statusLabel);
    elements.historyList.append(item);
  });
  setText(
    elements.stepCounter,
    `${state.history.length} ${state.history.length === 1 ? "Schritt" : "Schritte"}`,
  );
}

function solutionText() {
  const solution = state.originalSolution;
  if (solution.type === "unique") {
    return `Genau eine Lösung: x = ${formatValue(solution.value)}. Setzt du diesen Wert in die Ausgangsgleichung ein, sind beide Seiten gleich.`;
  }
  if (solution.type === "infinite") {
    return "Unendlich viele Lösungen: Beide Seiten beschreiben denselben Term. Deshalb ist die Gleichung für jede Zahl x erfüllt.";
  }
  return "Keine Lösung: Nach dem Zusammenfassen stehen auf beiden Seiten gleiche x-Terme, aber verschiedene Zahlen. Dieser Widerspruch kann durch keinen Wert für x behoben werden.";
}

function renderSolutionPanel() {
  if (!elements.solutionPanel) return;
  elements.solutionPanel.hidden = !state.solutionRevealed;
  if (!state.solutionRevealed) {
    setText(elements.solutionContent, "");
    setText(elements.solutionExplanation, "");
    return;
  }

  if (elements.solutionContent) {
    const solution = state.originalSolution;
    elements.solutionContent.textContent = solution.type === "unique"
      ? `x = ${formatValue(solution.value)}`
      : solution.type === "infinite" ? "Alle Zahlen sind Lösungen" : "Keine Zahl ist eine Lösung";
    elements.solutionExplanation.textContent = `${state.nonEquivalent
      ? "Wichtig: Dies ist die Lösung der Ausgangsgleichung; der aktuelle Experimentzustand ist kein gültiger Lösungsweg. "
      : ""}${solutionText()}`;
  } else {
    elements.solutionPanel.textContent = solutionText();
  }
}

function renderControls() {
  if (elements.undo) elements.undo.disabled = state.undoStack.length === 0;
  if (elements.restore) {
    elements.restore.disabled = state.history.length === 0
      && formatEquation(state.equation) === formatEquation(state.initialEquation);
  }
  if (elements.solution) {
    elements.solution.textContent = state.solutionRevealed
      ? "Lösung ausblenden"
      : "Lösung anzeigen";
    elements.solution.setAttribute("aria-expanded", String(state.solutionRevealed));
  }

  const experiment = state.mode === "experiment";
  if (elements.sideSelection) elements.sideSelection.hidden = !experiment;
  document.querySelectorAll('input[name="target-side"]').forEach((input) => {
    input.disabled = !experiment;
  });

  if (elements.modeLearn) elements.modeLearn.checked = state.mode === "learn";
  if (elements.modeExperiment) elements.modeExperiment.checked = experiment;
  document.body.dataset.mode = state.mode;
  setText(
    elements.modeDescription,
    experiment
      ? "Im Experimentiermodus kannst du eine Seite einzeln verändern. Solche Schritte werden als nicht äquivalent markiert und lassen sich rückgängig machen."
      : "Im Lernmodus wird jede Operation automatisch auf beide Seiten angewendet. So bleibt die Lösungsmenge erhalten.",
  );
}

function render() {
  if (!state.equation) return;
  renderEquation();
  renderScale();
  renderHistory();
  renderSolutionPanel();
  renderControls();
}

function hideHint() {
  state.hintLevel = 0;
  if (!elements.hintPanel) return;
  elements.hintPanel.hidden = true;
  setText(elements.hintContent, "");
  setText(elements.hintLevel, "1");
}

function loadEquation(rawEquation, source = "input") {
  let parsed;
  try {
    parsed = parseEquation(rawEquation);
  } catch (error) {
    showInputError(error?.message ?? "Die Gleichung konnte nicht gelesen werden.");
    return false;
  }

  clearInputError();
  state.initialEquation = parsed;
  state.equation = parsed;
  state.originalSolution = solveEquation(parsed);
  state.history = [];
  state.undoStack = [];
  state.nonEquivalent = false;
  state.lastChangedSide = null;
  state.solutionRevealed = false;
  state.hintLevel = 0;
  clearOperationError();
  hideHint();
  elements.equationInput.value = formatEquation(parsed);
  document.querySelectorAll("[data-equation]").forEach((button) => {
    const selected = button.dataset.equation === rawEquation
      || button.dataset.equation === formatEquation(parsed);
    button.classList.toggle("example-chip--active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  setFeedback(
    source === "example"
      ? "Die Beispielgleichung ist bereit. Überlege zuerst, welchen Term du auf beiden Seiten verändern möchtest."
      : "Die Gleichung ist bereit. Beide Seiten werden gleichberechtigt dargestellt.",
    "info",
  );
  render();
  return true;
}

function selectedTargetSide() {
  if (state.mode === "learn") return "both";
  return document.querySelector('input[name="target-side"]:checked')?.value ?? "left";
}

function normalizedOperationKind(value) {
  const aliases = {
    "add-constant": "add",
    "subtract-constant": "subtract",
    "multiply-constant": "multiply",
    "divide-constant": "divide",
    "add-x": "addX",
    "subtract-x": "subtractX",
  };
  return aliases[value] ?? value;
}

function operationNeedsValue(kind) {
  return kind !== "simplify";
}

function clearOperationError() {
  elements.operationValue?.removeAttribute("aria-invalid");
  if (elements.operationError) {
    elements.operationError.hidden = true;
    elements.operationError.textContent = "";
  }
}

function showOperationError(message) {
  elements.operationValue?.setAttribute("aria-invalid", "true");
  if (elements.operationError) {
    elements.operationError.hidden = false;
    elements.operationError.textContent = message;
  }
  setFeedback(message, "error");
}

function applySelectedOperation(event, explicitKind = null, explicitSide = null) {
  event?.preventDefault();
  const kind = explicitKind ?? normalizedOperationKind(elements.operationSelect.value);
  const side = explicitSide ?? selectedTargetSide();
  let value;

  if (operationNeedsValue(kind)) {
    try {
      value = parseScalar(elements.operationValue.value);
    } catch (error) {
      showOperationError(error?.message ?? "Bitte gib eine gültige Zahl ein.");
      elements.operationValue.focus();
      return;
    }

    clearOperationError();
    if (kind === "divide" && value.isZero()) {
      showOperationError("Eine Division durch null ist nicht erlaubt. Wähle eine andere Zahl.");
      return;
    }
    if (kind === "multiply" && value.isZero()) {
      showOperationError(
        "Mit null zu multiplizieren würde die ursprüngliche Information löschen und ist deshalb hier nicht erlaubt.",
      );
      return;
    }
  }

  const before = formatEquation(state.equation);
  const snapshot = makeSnapshot();
  let result;

  try {
    result = applyOperation(state.equation, { kind, value, side });
  } catch (error) {
    setFeedback(error?.message ?? "Die Operation konnte nicht ausgeführt werden.", "error");
    return;
  }

  state.undoStack.push(snapshot);
  state.equation = result.equation;
  const stepEquivalent = result.equivalent;
  if (!stepEquivalent) {
    state.nonEquivalent = true;
    state.lastChangedSide = side === "both" ? state.lastChangedSide : side;
  }

  const operationLabel = formatOperation(result.operation);
  state.history.push(Object.freeze({
    before,
    operation: operationLabel,
    after: formatEquation(result.equation),
    equivalent: stepEquivalent,
    explanation: stepEquivalent
      ? "Auf beiden Seiten wurde dieselbe zulässige Operation durchgeführt; die Lösungsmenge bleibt erhalten."
      : `Nur die ${side === "left" ? "linke" : "rechte"} Seite wurde verändert. Dieser Schritt gehört nur zum Experiment und ist keine Äquivalenzumformung.`,
  }));
  hideHint();

  const balance = computeBalance();
  if (!stepEquivalent) {
    const accidentalNote = balance.state === "balanced"
      ? " Bei der ursprünglichen Lösung bleibt sie in diesem Sonderfall zufällig ausgeglichen; die einseitige Regel ist dennoch nicht allgemein erlaubt."
      : balance.state === "symbolic-invalid"
        ? " Da es keine einzelne Ausgangslösung als Vergleichswert gibt, zeigt die Waage eine richtungsneutrale Warnmarkierung."
        : " Die Waage zeigt die Verletzung des Gleichgewichts sichtbar an.";
    setFeedback(
      `Du hast nur die ${side === "left" ? "linke" : "rechte"} Seite verändert. Diese Umformung ist nicht äquivalent.${accidentalNote}`,
      "warning",
    );
  } else if (state.nonEquivalent) {
    setFeedback(
      "Die aktuelle Operation wurde auf beiden Seiten ausgeführt. Der frühere einseitige Experimentierschritt bleibt aber bestehen – nutze Rückgängig oder Ursprung wiederherstellen.",
      "warning",
    );
  } else {
    const currentSolution = solveEquation(state.equation);
    if (isVariableIsolated(state.equation) && currentSolution.type === "unique") {
      setFeedback(
        "Die Variable ist auf einer Seite isoliert. Du hast die Gleichung mit gültigen Äquivalenzumformungen gelöst.",
        "success",
      );
    } else if (currentSolution.type === "infinite") {
      setFeedback(
        "Beide Seiten enthalten jetzt denselben Term. Prüfe mit „Lösung anzeigen“, welcher Lösungsfall vorliegt.",
        "success",
      );
    } else if (currentSolution.type === "none") {
      setFeedback(
        "Es bleibt ein Widerspruch zwischen den Seiten. Prüfe mit „Lösung anzeigen“, was das für die Lösungsmenge bedeutet.",
        "success",
      );
    } else {
      setFeedback(
        "Das Gleichgewicht bleibt erhalten, weil du auf beiden Seiten dieselbe Operation durchgeführt hast.",
        "success",
      );
    }
  }

  render();
}

function combineTerms() {
  applySelectedOperation(undefined, "simplify", "both");
}

function undo() {
  const snapshot = state.undoStack.pop();
  if (!snapshot) {
    setFeedback("Es gibt noch keinen Schritt zum Rückgängigmachen.", "info");
    return;
  }
  restoreSnapshot(snapshot);
  hideHint();
  setFeedback("Der letzte Schritt wurde rückgängig gemacht.", "info");
  render();
}

function resetExercise() {
  state.equation = state.initialEquation;
  state.history = [];
  state.undoStack = [];
  state.nonEquivalent = false;
  state.lastChangedSide = null;
  state.solutionRevealed = false;
  clearOperationError();
  hideHint();
  setFeedback("Alle Schritte wurden zurückgesetzt. Du startest wieder bei der Ausgangsgleichung.", "info");
  render();
}

function restoreOriginal() {
  const before = formatEquation(state.equation);
  state.undoStack.push(makeSnapshot());
  state.equation = state.initialEquation;
  state.nonEquivalent = false;
  state.lastChangedSide = null;
  hideHint();
  state.history.push(Object.freeze({
    type: "restore",
    before,
    operation: "↶ Ursprung wiederherstellen",
    after: formatEquation(state.initialEquation),
    equivalent: null,
    explanation: "Dies ist keine Umformung: Der Experimentzustand wurde verworfen und die Ausgangsgleichung neu eingesetzt.",
  }));
  setFeedback("Die ursprüngliche Gleichung wurde wiederhergestellt.", "info");
  render();
}

function toggleSolution() {
  state.solutionRevealed = !state.solutionRevealed;
  renderSolutionPanel();
  renderControls();
  if (state.solutionRevealed) {
    elements.solutionPanel.tabIndex = -1;
    elements.solutionPanel?.focus();
  }
}

function suggestionForCurrentEquation() {
  const equation = state.equation;
  if (!equation.right.x.isZero()) {
    return formatOperation({ kind: "subtractX", value: equation.right.x, side: "both" });
  }
  if (!equation.left.constant.isZero()) {
    return formatOperation({ kind: "subtract", value: equation.left.constant, side: "both" });
  }
  if (!equation.left.x.equals(1) && !equation.left.x.isZero()) {
    return formatOperation({ kind: "divide", value: equation.left.x, side: "both" });
  }
  if (!equation.left.x.isZero() && equation.right.x.isZero()) {
    return "Die Variable steht bereits allein. Prüfe deinen Lösungsweg.";
  }
  return "Fasse auf beiden Seiten gleichartige Terme zusammen und vergleiche die verbleibenden Zahlen.";
}

function showHint() {
  if (!elements.hintPanel) return;
  if (state.nonEquivalent) {
    elements.hintPanel.hidden = false;
    setText(elements.hintLevel, "–");
    setText(elements.hintContent, "Mache zuerst den einseitigen Experimentierschritt rückgängig oder stelle den Ursprung wieder her. Danach kannst du mit einem gültigen Lösungsweg fortfahren.");
    return;
  }

  state.hintLevel = (state.hintLevel % 3) + 1;
  let hint;
  if (state.hintLevel === 1) {
    hint = "Hinweis 1: Versuche, alle x-Terme auf eine Seite und alle Zahlen auf die andere Seite zu bringen.";
  } else if (state.hintLevel === 2) {
    const hasXOnBothSides = !state.equation.left.x.isZero() && !state.equation.right.x.isZero();
    hint = hasXOnBothSides
      ? "Hinweis 2: Entferne zuerst einen x-Term von beiden Seiten, damit x nur noch auf einer Seite vorkommt."
      : "Hinweis 2: Entferne zuerst die zusätzliche Zahl auf der Seite mit dem x-Term.";
  } else {
    hint = `Hinweis 3 – mögliche nächste Operation: ${prettyMath(suggestionForCurrentEquation())}`;
  }
  elements.hintPanel.hidden = false;
  setText(elements.hintLevel, String(state.hintLevel));
  setText(elements.hintContent, hint);
  elements.hintPanel.tabIndex = -1;
  elements.hintPanel.focus();
}

function updateOperationInput() {
  const kind = normalizedOperationKind(elements.operationSelect.value);
  const needsValue = operationNeedsValue(kind);
  clearOperationError();
  elements.operationValue.disabled = !needsValue;
  if (elements.operationValueLabel) {
    const labels = {
      add: "Zahl, die addiert wird",
      subtract: "Zahl, die subtrahiert wird",
      multiply: "Faktor (nicht 0)",
      divide: "Divisor (nicht 0)",
      addX: "Koeffizient vor x",
      subtractX: "Koeffizient vor x",
      simplify: "Keine Zahl nötig",
    };
    elements.operationValueLabel.textContent = labels[kind] ?? "Zahl oder Bruch";
  }
  updateOperationPreview();
}

function updateOperationPreview() {
  if (!elements.operationPreview) return;
  const kind = normalizedOperationKind(elements.operationSelect.value);
  if (!operationNeedsValue(kind)) {
    elements.operationPreview.textContent = "Terme zusammenfassen";
    return;
  }
  try {
    const value = parseScalar(elements.operationValue.value);
    elements.operationPreview.textContent = prettyMath(
      formatOperation({ kind, value, side: "both" }),
    );
  } catch {
    elements.operationPreview.textContent = "| ?";
  }
}

function changeMode(event) {
  state.mode = event.target.value === "experiment" ? "experiment" : "learn";
  hideHint();
  if (state.mode === "learn") {
    state.targetSide = "both";
    const both = byId("target-both");
    if (both) both.checked = true;
    setFeedback(
      state.nonEquivalent
        ? "Lernmodus aktiv. Der frühere Experimentierschritt bleibt markiert; mache ihn rückgängig oder stelle den Ursprung wieder her."
        : "Lernmodus aktiv: Jede Operation wird auf beide Seiten angewendet.",
      state.nonEquivalent ? "warning" : "info",
    );
  } else {
    const checked = document.querySelector('input[name="target-side"]:checked');
    if (!checked || checked.value === "both") {
      const left = byId("target-left");
      if (left) left.checked = true;
    }
    setFeedback(
      "Experimentiermodus aktiv: Einseitige Schritte sind Versuche und werden deutlich als nicht äquivalent markiert.",
      "warning",
    );
  }
  renderControls();
}

function showHelp() {
  if (!elements.helpDialog) return;
  if (typeof elements.helpDialog.showModal === "function") {
    elements.helpDialog.showModal();
  } else {
    elements.helpDialog.setAttribute("open", "");
  }
}

function closeHelp() {
  if (!elements.helpDialog) return;
  if (typeof elements.helpDialog.close === "function") {
    elements.helpDialog.close();
  } else {
    elements.helpDialog.removeAttribute("open");
  }
  elements.openHelp?.focus();
}

function bindEvents() {
  elements.equationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadEquation(elements.equationInput.value, "input");
  });

  elements.equationInput.addEventListener("input", clearInputError);

  document.querySelectorAll("[data-equation]").forEach((button) => {
    button.addEventListener("click", () => {
      loadEquation(button.dataset.equation, "example");
    });
  });

  document.querySelectorAll('input[name="mode"]').forEach((input) => {
    input.addEventListener("change", changeMode);
  });

  document.querySelectorAll('input[name="target-side"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      state.targetSide = event.target.value;
    });
  });

  elements.operationForm?.addEventListener("submit", applySelectedOperation);
  if (!elements.operationForm) {
    elements.applyOperation?.addEventListener("click", applySelectedOperation);
  }
  elements.operationSelect.addEventListener("change", updateOperationInput);
  elements.operationValue.addEventListener("input", updateOperationPreview);
  elements.simplify?.addEventListener("click", combineTerms);
  elements.undo?.addEventListener("click", undo);
  elements.reset?.addEventListener("click", () => {
    if (typeof elements.resetDialog?.showModal === "function") {
      elements.resetDialog.showModal();
    } else {
      resetExercise();
    }
  });
  elements.confirmReset?.addEventListener("click", () => {
    resetExercise();
    elements.resetDialog?.close();
  });
  elements.restore?.addEventListener("click", restoreOriginal);
  elements.solution?.addEventListener("click", toggleSolution);
  elements.hint?.addEventListener("click", showHint);
  elements.openHelp?.addEventListener("click", showHelp);
  elements.closeHelp?.addEventListener("click", closeHelp);
  elements.nextHint?.addEventListener("click", showHint);
  document.querySelectorAll("[data-close-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = byId(button.dataset.closePanel);
      if (panel) panel.hidden = true;
      if (panel === elements.solutionPanel) {
        state.solutionRevealed = false;
        renderControls();
      }
    });
  });
  document.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = byId(button.dataset.dialogClose);
      if (dialog === elements.helpDialog) {
        closeHelp();
      } else if (dialog?.open) {
        dialog.close();
        elements.reset?.focus();
      }
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (elements.helpDialog?.open) {
      event.preventDefault();
      closeHelp();
    } else if (elements.resetDialog?.open) {
      event.preventDefault();
      elements.resetDialog.close();
      elements.reset?.focus();
    }
  });
  elements.helpDialog?.addEventListener("click", (event) => {
    if (event.target === elements.helpDialog) closeHelp();
  });
}

function initialize() {
  requiredElementsPresent();
  bindEvents();
  updateOperationInput();
  const initialText = elements.equationInput.value.trim() || DEFAULT_EQUATION;
  loadEquation(initialText, "initial");
}

initialize();

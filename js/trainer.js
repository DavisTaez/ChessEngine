// js/trainer.js - Módulo de Entrenamiento "Guess the Move"

let trainingGame = null;
let targetMoves = [];
let currentMoveIndex = 0;
let userSide = 'w';
let isTrainingMode = false;
let score = 0;
let totalUserMoves = 0;
let failedAttempts = 0;
let pgnTerminationMessage = ""; // Para guardar la razón de fin de partida


function startTraining() {
  const pgnInput = document.getElementById('pgn-input').value.trim();
  if (!pgnInput) {
    alert("Por favor pega un PGN válido primero.");
    return;
  }

  const tempGame = new Chess();
  if (!tempGame.load_pgn(pgnInput)) {
    alert("Error al cargar el PGN. Verifica el formato.");
    return;
  }

  targetMoves = tempGame.history();
  userSide = document.getElementById('side-select').value;

  // --- LEER EL RESULTADO Y MOTIVO DE FINALIZACIÓN DEL PGN ---
  const header = tempGame.header();
  const result = header.Result || "*";
  const termination = header.Termination || "";

  pgnTerminationMessage = getGameEndingReason(tempGame, result, termination);

  removeSquareHighlight();
  game.reset();
  board.position('start');

  if (typeof historyStack !== 'undefined') {
    historyStack = [game.fen()];
    currentIndex = 0;
  }

  currentMoveIndex = 0;
  score = 0;
  failedAttempts = 0;
  isTrainingMode = true;

  totalUserMoves = targetMoves.filter((_, idx) => (idx % 2 === (userSide === 'w' ? 0 : 1))).length;

  updateTrainerUI(`Entrenamiento iniciado. Juegas con ${userSide === 'w' ? 'Blancas' : 'Negras'}.`);
  updateScoreUI();

  if (userSide === 'b') {
    setTimeout(playOpponentMove, 600);
  }
}

function getGameEndingReason(chessObj, result, terminationTag) {
  // 1. Si el tablero termina en un estado de regla estricta (Mate, Tablas, Ahogado)
  if (chessObj.in_checkmate()) {
    const winner = chessObj.turn() === 'w' ? 'Negras' : 'Blancas';
    return `🏆 **¡Jaque Mate!** Ganaron las ${winner}.`;
  }
  if (chessObj.in_stalemate()) {
    return "🤝 **Tablas por Ahogado** (Rey sin movimientos legales).";
  }
  if (chessObj.in_threefold_repetition()) {
    return "🤝 **Tablas por triple repetición** de jugadas.";
  }
  if (chessObj.insufficient_material()) {
    return "🤝 **Tablas por insuficiencia material** para dar mate.";
  }
  if (chessObj.in_draw()) {
    return "🤝 **Partida finalizada en tablas**.";
  }

  // 2. Si la partida no termina en mate pero el PGN indica un resultado explícito
  let reason = "";

  // Si el PGN trae una razón explícita de terminación (ej. "Time forfeiture", "Normal", "Rules infraction")
  if (terminationTag) {
    reason = ` (${terminationTag})`;
  }

  if (result === '1-0') {
    return `🏁 **Partida finalizada. Ganaron las Blancas** (Abandono/Rendición de las Negras${reason}).`;
  } else if (result === '0-1') {
    return `🏁 **Partida finalizada. Ganaron las Negras** (Abandono/Rendición de las Blancas${reason}).`;
  } else if (result === '1/2-1/2') {
    return `🤝 **Partida finalizada en Tablas por acuerdo o decisión mutua**${reason}.`;
  }

  return "🏁 **Partida completada** (Fin del historial del PGN).";
}

function playOpponentMove() {
  removeSquareHighlight();
  failedAttempts = 0;

  if (currentMoveIndex >= targetMoves.length) {
    updateTrainerUI(`🎉 <b>Partida completada.</b><br>${pgnTerminationMessage}`);
    return;
  }

  const expectedMove = targetMoves[currentMoveIndex];
  game.move(expectedMove);
  board.position(game.fen());
  currentMoveIndex++;

  if (typeof historyStack !== 'undefined') {
    historyStack.push(game.fen());
    currentIndex = historyStack.length - 1;
  }

  // Si con el movimiento del rival termina la partida:
  if (currentMoveIndex >= targetMoves.length) {
    updateTrainerUI(`El rival jugó: <b>${expectedMove}</b>.<br><br>🎉 <b>Partida completada.</b><br>${pgnTerminationMessage}`);
  } else {
    updateTrainerUI(`El rival jugó: <b>${expectedMove}</b>. ¡Tu turno!`);
  }
}

function handleUserMove(source, target) {
  const moveAttempt = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  if (moveAttempt === null) return false;

  const expectedMoveSAN = targetMoves[currentMoveIndex];
  const userSAN = moveAttempt.san;

  // --- CASO: JUGADA INCORRECTA ---
  if (userSAN !== expectedMoveSAN) {
    game.undo();
    failedAttempts++;

    setTimeout(() => {
      board.position(game.fen(), true);
    }, 50);

    // Al 3.er intento fallido se muestran AMBAS pistas (Origen en rojo + Destino en azul)
    if (failedAttempts >= 3) {
      highlightCorrectMove();
      updateTrainerUI(`❌ Intentos: ${failedAttempts}. 💡 <b>Pista:</b> Mueve la pieza <b style="color:#ef4444;">roja</b> hacia la casilla <b style="color:#3b82f6;">azul</b>.`);
    } else {
      updateTrainerUI(`❌ La jugada <b>${userSAN}</b> no es la correcta (${failedAttempts}/3 intentos para pista).`);
    }

    return false;
  }

  // --- CASO: JUGADA CORRECTA ---
  removeSquareHighlight();
  failedAttempts = 0;
  score++;
  currentMoveIndex++;
  updateScoreUI();
  updateTrainerUI(`✅ ¡Correcto! Jugaste <b>${userSAN}</b>.`);

  if (typeof historyStack !== 'undefined') {
    historyStack.push(game.fen());
    currentIndex = historyStack.length - 1;
  }

  if (currentMoveIndex < targetMoves.length) {
    setTimeout(playOpponentMove, 600);
  } else {
    updateTrainerUI(`🎉 <b>¡Felicidades! Completaste la partida.</b><br>${pgnTerminationMessage}`);
  }

  return true;
}

// Función para resaltar origen (rojo) y destino (azul) simultáneamente
function highlightCorrectMove() {
  removeSquareHighlight();

  const tempGame = new Chess(game.fen());
  const expectedMoveObj = tempGame.move(targetMoves[currentMoveIndex]);

  if (expectedMoveObj) {
    // 1. Casilla de Origen (Rojo semi-transparente)
    if (expectedMoveObj.from) {
      const fromEl = document.querySelector(`[data-square="${expectedMoveObj.from}"]`);
      if (fromEl) {
        fromEl.classList.add('highlight-red');
        fromEl.style.setProperty('background-color', 'rgba(255, 135, 135, 0.77)', 'important');
        fromEl.style.setProperty('box-shadow', 'inset 0 0 10px rgba(255, 49, 49, 0.95)', 'important');
      }
    }

    // 2. Casilla de Destino (Azul semi-transparente)
    if (expectedMoveObj.to) {
      const toEl = document.querySelector(`[data-square="${expectedMoveObj.to}"]`);
      if (toEl) {
        toEl.classList.add('highlight-blue');
        toEl.style.setProperty('background-color', 'rgba(120, 224, 255, 0.55)', 'important');
        toEl.style.setProperty('box-shadow', 'inset 0 0 10px rgba(34, 19, 255, 0.93)', 'important');
      }
    }
  }
}

function removeSquareHighlight() {
  const highlighted = document.querySelectorAll('.highlight-red, .highlight-blue, [data-square]');
  highlighted.forEach(el => {
    el.classList.remove('highlight-red', 'highlight-blue');
    el.style.removeProperty('background-color');
    el.style.removeProperty('box-shadow');
  });
}

function stopTraining() {
  isTrainingMode = false;
  removeSquareHighlight();
  game.reset();
  board.position('start');
  updateTrainerUI("Modo entrenamiento detenido.");
}

function updateTrainerUI(msg) {
  const statusElem = document.getElementById('trainer-status');
  if (statusElem) statusElem.innerHTML = msg;
}

function updateScoreUI() {
  const scoreElem = document.getElementById('trainer-score');
  if (scoreElem) scoreElem.textContent = `Puntuación: ${score} / ${totalUserMoves}`;
}
// js/board.js - Historial, Persistencia y Control Visual

let game = null;
let board = null;

let historyStack = [];
let currentIndex = 0;
let userColor = 'w';
let boardOrientation = 'white';
let isEditingAI = false;

function initBoard(isReset = false) {
  game = new Chess();
  isEditingAI = false;

  // Si se presiona "Nueva Partida" o es la primera vez sin guardar
  if (isReset || !localStorage.getItem('saved_chess_game')) {
    userColor = document.getElementById('user-color').value;
    boardOrientation = userColor === 'w' ? 'white' : 'black';
    historyStack = [game.fen()];
    currentIndex = 0;
    saveGameState();
  } else {
    // Restaurar desde LocalStorage al recargar la página (F5)
    loadGameState();
  }

  const config = {
    draggable: true,
    position: historyStack[currentIndex] || 'start',
    orientation: boardOrientation,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  };

  board = Chessboard('board', config);
  
  // Sincronizar el motor con el FEN actual
  game.load(historyStack[currentIndex]);
  
  // Actualizar UI y selector de color
  document.getElementById('user-color').value = userColor;
  updateStatus();
  updateCorrectionButton();

  // Si es inicio de partida nueva y el usuario juega con Negras, la IA inicia
  if (isReset && userColor === 'b' && historyStack.length === 1) {
    window.setTimeout(makeAIMove, 300);
  }
  // Al final de la función initBoard() en js/board.js:
  window.setTimeout(() => {
    if (board) {
      board.resize();
    }
  }, 200);
}

// Guardar estado en memoria local del navegador
function saveGameState() {
  const state = {
    fenStack: historyStack,
    index: currentIndex,
    color: userColor,
    orientation: boardOrientation
  };
  localStorage.setItem('saved_chess_game', JSON.stringify(state));
}

// Cargar estado desde LocalStorage
function loadGameState() {
  const saved = localStorage.getItem('saved_chess_game');
  if (saved) {
    const state = JSON.parse(saved);
    historyStack = state.fenStack || [game.fen()];
    currentIndex = state.index || 0;
    userColor = state.color || 'w';
    boardOrientation = state.orientation || 'white';
  }
}

// Función para Girar el Tablero en vivo (sin reiniciar)
function flipBoard() {
  if (board) {
    board.flip();
    boardOrientation = board.orientation();
    saveGameState(); // Mantiene la perspectiva elegida al recargar
  }
}

function onDragStart(source, piece, boardPosition, orientation) {
  if (game.game_over()) return false;

  if (isEditingAI) {
    const aiColor = (userColor === 'w') ? 'b' : 'w';
    if (game.turn() !== aiColor) return false;
    if ((aiColor === 'w' && piece.search(/^b/) !== -1) ||
        (aiColor === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
    return true;
  }

  if (game.turn() !== userColor) return false;
  if ((userColor === 'w' && piece.search(/^b/) !== -1) ||
      (userColor === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop(source, target) {
  // 1. Si el modo entrenamiento está activo, delega todo a trainer.js
  if (typeof isTrainingMode !== 'undefined' && isTrainingMode) {
    return handleUserMove(source, target) ? undefined : 'snapback';
  }

  // 2. Lógica normal del juego contra la IA
  const move = game.move({
    from: source,
    to: target,
    promotion: 'q'
  });

  // Si el movimiento es ilegal según chess.js, devuelve la pieza
  if (move === null) return 'snapback';

  // Sobreescribir variantes posteriores en el historial
  historyStack = historyStack.slice(0, currentIndex + 1);
  historyStack.push(game.fen());
  currentIndex = historyStack.length - 1;

  saveGameState();
  updateStatus();

  // Turno de la IA si corresponde
  if (!isEditingAI && game.turn() !== userColor) {
    window.setTimeout(() => {
      if (typeof makeAIMove === 'function') {
        makeAIMove();
      }
    }, 250);
  }
}

function onSnapEnd() {
  board.position(game.fen());
}

// ----------------------------------------------------
// NAVEGACIÓN Y EDICIÓN
// ----------------------------------------------------

function toggleAICorrection() {
  const btn = document.getElementById('btn-undo-ai');

  if (!isEditingAI) {
    if (game.turn() === userColor && currentIndex > 0) {
      goToMove(currentIndex - 1);
      historyStack = historyStack.slice(0, currentIndex + 1);
      saveGameState();
    }

    isEditingAI = true;
    if (btn) {
      btn.textContent = '📤 Enviar Jugada IA';
      btn.style.backgroundColor = '#2a9d8f';
    }
    updateStatus('Modo Edición: Mueve la pieza de la IA en el tablero');
  } else {
    isEditingAI = false;
    if (btn) {
      btn.textContent = '✏️ Corregir Jugada IA';
      btn.style.backgroundColor = '#e07a5f';
    }
    updateStatus();

    if (game.turn() !== userColor) {
      window.setTimeout(makeAIMove, 250);
    }
  }
}

function updateCorrectionButton() {
  const btn = document.getElementById('btn-undo-ai');
  if (btn) {
    btn.textContent = '✏️ Corregir Jugada IA';
    btn.style.backgroundColor = '#e07a5f';
  }
}

function goToMove(index) {
  if (index < 0 || index >= historyStack.length) return;

  currentIndex = index;
  const fen = historyStack[currentIndex];
  game.load(fen);
  board.position(fen);
  saveGameState();
  updateStatus();
}

function updateStatus(customMessage = null) {
  if (customMessage) {
    document.getElementById('status').textContent = customMessage;
    return;
  }

  let statusText = '';
  const moveColor = game.turn() === 'w' ? 'Blancas' : 'Negras';

  if (game.in_checkmate()) {
    statusText = `Jaque mate. Ganan las ${game.turn() === 'w' ? 'Negras' : 'Blancas'}.`;
  } else if (game.in_draw()) {
    statusText = 'Tablas (Empate).';
  } else {
    statusText = `Estado: Turno de las ${moveColor}`;
    if (game.in_check()) {
      statusText += ' (¡Jaque!)';
    }
  }

  document.getElementById('status').textContent = statusText;
}

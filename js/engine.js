// js/engine.js - El cerebro del motor de ajedrez (RagnusEngine - Personalizado con PGNs de Davis_Taez)

// Libro de Aperturas Flexible
const OPENING_BOOK = {
  // --- NEGRAS ---
  // Defensa Francesa & Franco-Siciliana (1...e6 / 1...c5)
  "e4": "e6",
  "e4 e6 2. d4": "d5",
  "e4 e6 2. d4 d5 3. e5": "c5",
  "e4 e6 2. d4 d5 3. e5 c5 4. c3": "Nc6",
  "e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. f4": "cxd4",
  "e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. f4 cxd4 6. cxd4": "Bb4+",
  
  // Transposición Franco-Siciliana (1.e4 c5 2.d4 e6)
  "e4 c5": "d4",
  "e4 c5 2. d4": "e6",
  "e4 c5 2. d4 e6 3. Be3": "d5",
  "e4 c5 2. d4 e6 3. Be3 d5 4. Nc3": "Nc6",
  "e4 c5 2. d4 e6 3. Be3 d5 4. Nc3 Nc6 5. dxc5": "d4", // Tenedor característico de Davis_Taez
  
  // Contra 1.d4 o 1.c4
  "d4": "e6",
  "c4": "e6",
  "c4 e6 2. d4": "d5",
  "c4 e6 2. d4 d5 3. e3": "Nf6",

  // Apertura Abierta (1.e4 e5) & Cuatro Caballos / Italiana - Táctica del Tenedor en e4
  "e4 e5": "Nf3",
  "e4 e5 2. Nf3 Nc6": "Nc3",
  "e4 e5 2. Nf3 Nc6 3. Nc3 Nf6": "Bc4", 
  "e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bc4": "Nxe4", 
  "e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. Bc4 Nxe4 5. Nxe4": "d5",

  // --- BLANCAS ---
  // Ataque Táctico en la Italiana (Bxf7+)
  "e4 e5": "Nf3",
  "e4 e5 2. Nf3 Nc6": "Bc4",
  "e4 e5 2. Nf3 Nc6 3. Bc4 Bc5": "d3",
  "e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nge7": "Bxf7+", // ¡Ataque característico de Davis_Taez con Blancas!
  "e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nge7 5. Bxf7+ Kxf7": "Ng5+",
  "e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nge7 5. Bxf7+ Kxf7 6. Ng5+ Kg8": "Qf3"
};

const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Recompensa al avance de peones en flanco de dama (a4, b4, b5) y rupturas c5/d5
const PAWN_TABLE = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [30, 25, 20, 15, 15, 10, 10, 10],
  [25, 30, 35, 25, 25, 10,  5,  5], // Bonus alto en b5 y c5
  [15, 25, 30, 20, 20,  0,  0,  0], // Bonus alto en a4 y b4
  [ 5, -5,-10, 15, 15,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0]
];

// Bonus a Caballos agresivos saltando a g5/f5
const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 20, 20, 25,  0,-30], // Premium en f5 y g5
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const ROOK_TABLE = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0, 15, 20, 20, 15,  0, -5],
  [ 0,  0,  5, 15, 15,  5,  0,  0]
];

let aiMoveCounter = 0;

function evaluateEndgame(board, isWhite) {
  let endgameScore = 0;
  let whiteKingPos = null;
  let blackKingPos = null;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === 'k') {
        if (piece.color === 'w') whiteKingPos = { r, c };
        else blackKingPos = { r, c };
      }
    }
  }

  if (!whiteKingPos || !blackKingPos) return 0;

  const enemyKing = isWhite ? blackKingPos : whiteKingPos;
  const ownKing = isWhite ? whiteKingPos : blackKingPos;

  const dstFromCenterR = Math.max(3 - enemyKing.r, enemyKing.r - 4);
  const dstFromCenterC = Math.max(3 - enemyKing.c, enemyKing.c - 4);
  endgameScore += (dstFromCenterR + dstFromCenterC) * 10;

  const dstBetweenKings = Math.abs(ownKing.r - enemyKing.r) + Math.abs(ownKing.c - enemyKing.c);
  endgameScore += (14 - dstBetweenKings) * 4;

  return isWhite ? endgameScore : -endgameScore;
}

// Evaluación refinada para replicar las decisiones de Davis_Taez
function evaluateBoard(gameBoard) {
  let totalEvaluation = 0;
  let materialCount = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = gameBoard[r][c];
      if (piece) {
        let val = PIECE_VALUES[piece.type] || 0;
        if (piece.type !== 'k') materialCount += val;

        if (piece.type === 'p') {
          val += piece.color === 'w' ? PAWN_TABLE[r][c] : PAWN_TABLE[7 - r][c];
        } else if (piece.type === 'n') {
          val += piece.color === 'w' ? KNIGHT_TABLE[r][c] : KNIGHT_TABLE[7 - r][c];
        } else if (piece.type === 'r') {
          val += piece.color === 'w' ? ROOK_TABLE[r][c] : ROOK_TABLE[7 - r][c];
        } else if (piece.type === 'b') {
          // Bonus alfil activo en diagonales b6/c5 o d7/e6
          if ((piece.color === 'b' && ((r === 2 && c === 1) || (r === 2 && c === 3))) ||
              (piece.color === 'w' && ((r === 5 && c === 1) || (r === 5 && c === 3)))) {
            val += 25;
          }
        } else if (piece.type === 'q') {
          // Bonus por Dama en f3 (Ataques rápidos) o en d7/e7 (Consolidación)
          if ((piece.color === 'w' && r === 5 && c === 5) || (piece.color === 'b' && r === 1 && c === 4)) {
            val += 20;
          }
        }

        totalEvaluation += (piece.color === 'w') ? val : -val;
      }
    }
  }

  if (materialCount < 1500) {
    const isWhiteWinning = totalEvaluation > 0;
    totalEvaluation += evaluateEndgame(gameBoard, isWhiteWinning);
  }

  return totalEvaluation;
}

function minimax(currentGame, depth, alpha, beta, isMaximizingPlayer) {
  if (depth === 0 || currentGame.game_over()) {
    return evaluateBoard(currentGame.board());
  }

  const moves = currentGame.moves();

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      currentGame.move(move);
      const evalVal = minimax(currentGame, depth - 1, alpha, beta, false);
      currentGame.undo();

      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      currentGame.move(move);
      const evalVal = minimax(currentGame, depth - 1, alpha, beta, true);
      currentGame.undo();

      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getBestMove(currentGame, defaultDepth = 3) {
  aiMoveCounter++;

  // 1. Verificación del libro de aperturas
  const history = currentGame.history().join(" ");
  if (OPENING_BOOK[history]) {
    console.log(`📖 Jugada de libro encontrada: ${OPENING_BOOK[history]}`);
    return { move: OPENING_BOOK[history], score: 0 };
  }

  const fenPieces = currentGame.fen().split(' ')[0].replace(/[/1-8]/g, '');
  const isEndgame = fenPieces.length <= 12;
  const isBrilliantMove = (aiMoveCounter % 3 === 0);

  let searchDepth = defaultDepth;

  if (isEndgame) {
    searchDepth = isBrilliantMove ? 5 : 1;
  }

  const moves = currentGame.moves();
  if (moves.length === 0) return null;

  const isMaximizing = currentGame.turn() === 'w';
  let bestMove = null;
  let bestValue = isMaximizing ? -Infinity : Infinity;

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    currentGame.move(move);

    const boardValue = minimax(currentGame, searchDepth - 1, -Infinity, Infinity, !isMaximizing);
    game.undo();

    if (isMaximizing) {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
  }

  return { move: bestMove, score: bestValue };
}

function makeAIMove() {
  if (game.game_over()) return;

  if (game.turn() === userColor) return;

  const result = getBestMove(game, 3);

  if (result && result.move) {
    game.move(result.move);
    board.position(game.fen());

    historyStack = historyStack.slice(0, currentIndex + 1);
    historyStack.push(game.fen());
    currentIndex = historyStack.length - 1;

    updateStatus();

    const formattedEval = (result.score / 100).toFixed(1);
    const evalElem = document.getElementById('eval');
    if (evalElem) {
      evalElem.textContent = formattedEval > 0 ? `+${formattedEval}` : formattedEval;
    }
  }
}
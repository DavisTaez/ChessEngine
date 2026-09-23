// js/app.js - Eventos UI y persistencia

document.addEventListener('DOMContentLoaded', () => {
  initBoard();

  // 1. Botón para Girar el Tablero (Sin reiniciar)
  document.getElementById('btn-flip')?.addEventListener('click', () => {
    if (typeof flipBoard === 'function') flipBoard();
  });

  // 2. Selector de Color (Solo afecta al reiniciar partida)
  document.getElementById('user-color')?.addEventListener('change', (e) => {
    userColor = e.target.value;
    boardOrientation = userColor === 'w' ? 'white' : 'black';
  });

  // 3. Botón: Corregir / Enviar Jugada IA
  document.getElementById('btn-undo-ai')?.addEventListener('click', () => {
    if (typeof toggleAICorrection === 'function') toggleAICorrection();
  });

  // 4. Botones de Navegación del Historial
  document.getElementById('btn-first')?.addEventListener('click', () => goToMove(0));
  document.getElementById('btn-prev')?.addEventListener('click', () => goToMove(currentIndex - 1));
  document.getElementById('btn-next')?.addEventListener('click', () => goToMove(currentIndex + 1));
  document.getElementById('btn-last')?.addEventListener('click', () => goToMove(historyStack.length - 1));

  // 5. Botón: Nueva Partida (Fuerza borrado de memoria)
  document.getElementById('btn-reset')?.addEventListener('click', () => {
    localStorage.removeItem('saved_chess_game');
    initBoard(true);
    const evalEl = document.getElementById('eval');
    if (evalEl) evalEl.textContent = '0.0';
  });

  // 6. Botón: Mover IA
  document.getElementById('btn-ai')?.addEventListener('click', () => {
    if (typeof makeAIMove === 'function') makeAIMove();
  });
});
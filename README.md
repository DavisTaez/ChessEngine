# ♟️ RagnusEngine - Motor de Ajedrez Personalizado

Un motor de ajedrez interactivo en JavaScript diseñado para modelar y replicar el estilo de juego del usuario (**Mongo12345** / **Davis_Taez**). El proyecto utiliza un algoritmo de búsqueda Minimax con poda Alfa-Beta combinado con un libro de aperturas flexible y tablas de evaluación posicional adaptadas a patrones reales de partidas en Lichess.

---

## 🌟 Características Principales

- **Libro de Aperturas Flexible (`OPENING_BOOK`):**
  - Reconocimiento de aperturas principales en notación SAN para Blancas y Negras.
  - Secuencias preparadas basadas en partidas reales (Defensa Francesa, Transposiciones Franco-Siciliana y Ataque Táctico en la Italiana).

- **Evaluación Posicional Personalizada (PST - Piece-Square Tables):**
  - **Estructura de Peones:** Prioriza la expansión y ganancia de espacio en el flanco de dama ($a4$, $b4$, $b5$, $c5$).
  - **Caballos Agresivos:** Bonificación por saltos ofensivos hacia casillas avanzadas ($f5$, $g5$).
  - **Control de Torres:** Premia la colocación de torres en columnas centrales abiertas y semiabiertas ($d$, $e$).
  - **Alfiles y Dama:** Puntuación optimizada para diagonales activas ($b6$, $c5$, $d7$, $e6$) y dama centralizada o al ataque ($f3$, $d7$, $e7$).

- **Búsqueda Minimax con Poda Alfa-Beta:**
  - Búsqueda a profundidad adaptable (profundidad estándar = 3, extendida en finales).
  - Algoritmo de simplificación y técnica de persecución de reyes en finales con poco material.

---

## 📂 Estructura del Proyecto

```text
├── index.html        # Interfaz de usuario (Tablero HTML/CSS)
├── css/
│   └── styles.css    # Estilos de la interfaz y elementos visuales
└── js/
    ├── chessboard.js # Renderizado y control visual del tablero
    ├── chess.js      # Validación de reglas de ajedrez y FEN
    └── engine.js     # Cerebro del motor (RagnusEngine)

📜 Historial de Versiones y Changelogv1.2.0 - Ajuste Táctico y Patrones RealesAperturas Integradas:Blancas: Añadida la línea agresiva de la Italiana con sacrificio en $f7$ (5.Bxf7+!, 6.Ng5+, 7.Qf3).Negras: Añadida la variante de avance de la Defensa Francesa (1...e6, c5, d5) y la respuesta táctica del tenedor central (5...d4!).Negras: Registrada la jugada característica del tenedor en $e4$ contra la Italiana/4 Caballos (4...Nxe4! 5.Nxe4 d5).Ajuste de Evaluaciones:Reprogramadas las tablas PAWN_TABLE, KNIGHT_TABLE y ROOK_TABLE con pesos tácticos basados en partidas de Lichess.v1.1.0 - Normalización del Libro de AperturasCorrección de la consulta del libro de aperturas a notación SAN para evitar desconexiones tempranas.Incorporación de evaluaciones posicionales iniciales para el avance del flanco de dama.v1.0.0 - Versión InicialImplementación base de Minimax con Poda Alfa-Beta.Interfaz gráfica básica con chessboard.js y chess.js.🧪 Cómo Continuar el EntrenamientoPara seguir refinando el motor con más partidas:Exporta tus archivos PGN desde Lichess.Analiza o comparte las partidas para extraer nuevas secuencias de apertura o finales recurrentes.Actualiza el objeto OPENING_BOOK o las bonificaciones dentro de evaluateBoard() en js/engine.js.
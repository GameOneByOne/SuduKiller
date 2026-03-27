(function () {
  const SIZE = 9;
  const BOX = 3;
  const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const CLASSIC_HOLES = {
    easy: [34, 40],
    medium: [43, 49],
    hard: [52, 58]
  };

  const state = {
    difficulty: "hard",
    seed: "",
    puzzleId: null,
    puzzle: null,
    solution: null,
    board: emptyGrid(0),
    fixed: emptyGrid(false),
    initialCandidates: emptyGrid(null),
    candidateStates: emptyGrid(null),
    selected: null,
    showNotes: true,
    elapsed: 0,
    timerStarted: false,
    timerId: null
  };

  const elements = {
    clearCellButton: document.getElementById("clearCellButton"),
    boardLoading: document.getElementById("boardLoading"),
    boardRoot: document.getElementById("boardRoot"),
    storageBadge: document.getElementById("storageBadge"),
    timerPill: document.getElementById("timerPill"),
    keypad: document.getElementById("keypad"),
    notesPanel: document.getElementById("notesPanel"),
    notesCellLabel: document.getElementById("notesCellLabel"),
    notesPanelGrid: document.getElementById("notesPanelGrid")
  };

  init();

  function init() {
    renderKeypad();
    bindEvents();
    generateDailyPuzzle();
  }

  function bindEvents() {
    elements.clearCellButton.addEventListener("click", () => applyValue(0));

    document.addEventListener("keydown", handleKeyboardInput);
    document.addEventListener("click", handleDocumentClick);
    window.addEventListener("resize", syncBoardMetrics);
  }

  function renderKeypad() {
    elements.keypad.innerHTML = "";
    DIGITS.forEach((digit) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(digit);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        applyValue(digit);
      });
      elements.keypad.appendChild(button);
    });
  }

  function syncStats() {
    if (elements.timerPill) {
      elements.timerPill.textContent = `耗时 ${formatElapsed(state.elapsed)}`;
    }
  }

  function generateDailyPuzzle() {
    stopTimer();
    clearSelectionSilently();
    state.difficulty = "hard";
    state.seed = getSeedString();
    elements.boardLoading.style.display = "grid";
    elements.boardLoading.textContent = "正在生成今日数独...";
    elements.boardRoot.innerHTML = "";

    window.setTimeout(() => {
      const generated = createClassicPuzzle(state.difficulty, state.seed);
      state.puzzleId = generated.id;
      state.puzzle = cloneGrid(generated.puzzle);
      state.solution = cloneGrid(generated.solution);
      state.board = cloneGrid(generated.puzzle);
      state.fixed = generated.fixed.map((row) => row.slice());
      state.initialCandidates = buildInitialCandidates(state.puzzle, state.fixed);
      state.candidateStates = buildCandidateStates(state.initialCandidates);
      state.selected = null;
      state.elapsed = 0;
      state.timerStarted = false;

      elements.storageBadge.textContent = `日期 ${state.seed}`;
      elements.boardLoading.style.display = "none";
      render();
    }, 20);
  }

  function createClassicPuzzle(difficulty, seed) {
    const rng = createSeededRandom(`${seed}-${difficulty}-classic`);
    const solution = generateSolvedBoard(rng);
    const puzzle = cloneGrid(solution);
    const [minHoles, maxHoles] = CLASSIC_HOLES[difficulty] || CLASSIC_HOLES.hard;
    const holes = randomInt(minHoles, maxHoles, rng);
    const cells = shuffle(range(81), rng);

    for (let index = 0; index < holes; index += 1) {
      const cell = cells[index];
      const row = Math.floor(cell / 9);
      const col = cell % 9;
      puzzle[row][col] = 0;
    }

    return {
      id: `classic-${difficulty}-${seed}`,
      puzzle,
      solution,
      fixed: puzzle.map((row) => row.map((value) => value !== 0))
    };
  }

  function handleKeyboardInput(event) {
    if (!state.selected || !state.puzzleId) {
      return;
    }

    if (event.key >= "1" && event.key <= "9") {
      applyValue(Number(event.key));
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      applyValue(0);
      return;
    }

    const directionMap = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1]
    };
    if (directionMap[event.key]) {
      event.preventDefault();
      moveSelection(directionMap[event.key][0], directionMap[event.key][1]);
    }
  }

  function moveSelection(deltaRow, deltaCol) {
    if (!state.selected) {
      return;
    }
    const nextRow = clamp(state.selected.row + deltaRow, 0, 8);
    const nextCol = clamp(state.selected.col + deltaCol, 0, 8);
    selectCell(nextRow, nextCol);
  }

  function applyValue(value) {
    if (!state.selected || !state.puzzleId) {
      return;
    }

    const { row, col } = state.selected;
    if (state.fixed[row][col]) {
      return;
    }

    state.board[row][col] = value;

    syncStats();
    renderBoard();
    maybeComplete();
  }

  function maybeComplete() {
    if (!state.solution) {
      return;
    }
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (state.board[row][col] !== state.solution[row][col]) {
          return;
        }
      }
    }

    stopTimer();
    syncStats();
    elements.boardRoot.classList.remove("pulse");
    void elements.boardRoot.offsetWidth;
    elements.boardRoot.classList.add("pulse");
  }

  function render() {
    renderBoard();
    syncStats();
    syncBoardMetrics();
    renderNotesPanel();
  }

  function renderBoard() {
    if (!state.puzzleId) {
      elements.boardRoot.innerHTML = "";
      elements.boardLoading.style.display = "grid";
      return;
    }

    elements.boardLoading.style.display = "none";
    const table = document.createElement("table");
    table.className = "board classic";

    for (let row = 0; row < SIZE; row += 1) {
      const tr = document.createElement("tr");
      for (let col = 0; col < SIZE; col += 1) {
        const td = document.createElement("td");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cell-button";

        const value = state.board[row][col];
        if (value !== 0) {
          button.textContent = String(value);
        }

        if (state.fixed[row][col]) {
          button.classList.add("fixed");
        } else if (value !== 0) {
          button.classList.add("entered");
        }

        if (state.selected && state.selected.row === row && state.selected.col === col) {
          button.classList.add("selected");
        } else if (state.selected && shouldHighlightSameValueCell(row, col)) {
          button.classList.add("same-value");
        } else if (state.selected && shouldHighlightRelatedCell(row, col)) {
          button.classList.add("related");
        }

        if (value !== 0 && hasConflictAt(row, col)) {
          button.classList.add("conflict");
        }

        button.addEventListener("click", (event) => {
          event.stopPropagation();
          maybeStartTimer();
          selectCell(row, col);
        });

        td.appendChild(button);
        tr.appendChild(td);
      }
      table.appendChild(tr);
    }

    elements.boardRoot.innerHTML = "";
    elements.boardRoot.appendChild(table);
    syncBoardMetrics();
  }

  function selectCell(row, col) {
    state.selected = { row, col };
    renderBoard();
    renderNotesPanel();
  }

  function clearSelection() {
    state.selected = null;
    renderBoard();
    renderNotesPanel();
  }

  function clearSelectionSilently() {
    state.selected = null;
  }

  function startTimer(forceReset) {
    if (forceReset) {
      state.elapsed = 0;
    }
    stopTimer();
    state.timerId = window.setInterval(() => {
      state.elapsed += 1;
      syncStats();
    }, 1000);
  }

  function maybeStartTimer() {
    if (state.timerStarted || !state.puzzleId) {
      return;
    }
    state.timerStarted = true;
    startTimer(true);
  }

  function stopTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function generateSolvedBoard(rng) {
    const digits = shuffle(DIGITS.slice(), rng);
    const rowGroups = shuffle([0, 1, 2], rng);
    const colGroups = shuffle([0, 1, 2], rng);
    const rows = [];
    const cols = [];

    rowGroups.forEach((group) => {
      shuffle([0, 1, 2], rng).forEach((offset) => {
        rows.push(group * 3 + offset);
      });
    });

    colGroups.forEach((group) => {
      shuffle([0, 1, 2], rng).forEach((offset) => {
        cols.push(group * 3 + offset);
      });
    });

    return rows.map((row) => cols.map((col) => digits[pattern(row, col)]));
  }

  function getClassicCandidates(board, row, col) {
    const used = new Set();
    for (let index = 0; index < 9; index += 1) {
      if (board[row][index]) {
        used.add(board[row][index]);
      }
      if (board[index][col]) {
        used.add(board[index][col]);
      }
    }

    const boxRow = Math.floor(row / BOX) * BOX;
    const boxCol = Math.floor(col / BOX) * BOX;
    for (let currentRow = boxRow; currentRow < boxRow + BOX; currentRow += 1) {
      for (let currentCol = boxCol; currentCol < boxCol + BOX; currentCol += 1) {
        if (board[currentRow][currentCol]) {
          used.add(board[currentRow][currentCol]);
        }
      }
    }
    return DIGITS.filter((digit) => !used.has(digit));
  }

  function buildInitialCandidates(board, fixed) {
    return board.map((rowValues, row) => rowValues.map((value, col) => {
      if (fixed[row][col] || value !== 0) {
        return [];
      }
      return getClassicCandidates(board, row, col);
    }));
  }

  function buildCandidateStates(initialCandidates) {
    return initialCandidates.map((row) => row.map((candidates) => {
      const candidateState = {};
      candidates.forEach((digit) => {
        candidateState[digit] = true;
      });
      return candidateState;
    }));
  }

  function isClassicValid(board, row, col, value) {
    return getClassicCandidates(board, row, col).includes(value);
  }

  function pattern(row, col) {
    return (row * 3 + Math.floor(row / 3) + col) % 9;
  }


  function isRelatedCell(row, col, targetRow, targetCol) {
    if (row === targetRow || col === targetCol) {
      return true;
    }
    return Math.floor(row / 3) === Math.floor(targetRow / 3) && Math.floor(col / 3) === Math.floor(targetCol / 3);
  }

  function shouldHighlightRelatedCell(row, col) {
    if (!state.selected) {
      return false;
    }
    const { row: selectedRow, col: selectedCol } = state.selected;
    if (state.fixed[selectedRow][selectedCol] && state.board[selectedRow][selectedCol] !== 0) {
      return false;
    }
    return isRelatedCell(row, col, selectedRow, selectedCol);
  }

  function shouldHighlightSameValueCell(row, col) {
    if (!state.selected) {
      return false;
    }
    const selectedValue = state.board[state.selected.row][state.selected.col];
    if (!selectedValue) {
      return false;
    }
    return state.board[row][col] === selectedValue;
  }

  function difficultyLabel(difficulty) {
    return {
      easy: "简单",
      medium: "中等",
      hard: "困难"
    }[difficulty] || "简单";
  }

  function emptyGrid(fillValue) {
    return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => fillValue));
  }

  function cloneGrid(grid) {
    return grid.map((row) => row.slice());
  }

  function countHoles(grid) {
    return grid.flat().filter((value) => value === 0).length;
  }

  function range(length) {
    return Array.from({ length }, (_, index) => index);
  }

  function shuffle(array, rng) {
    const result = array.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rand(rng) * (index + 1));
      const temp = result[index];
      result[index] = result[swapIndex];
      result[swapIndex] = temp;
    }
    return result;
  }

  function randomInt(min, max, rng) {
    return Math.floor(rand(rng) * (max - min + 1)) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatElapsed(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function rand(rng) {
    return rng ? rng() : Math.random();
  }

  function createSeededRandom(seedInput) {
    let seed = xmur3(String(seedInput))();
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function xmur3(str) {
    let hash = 1779033703 ^ str.length;
    for (let index = 0; index < str.length; index += 1) {
      hash = Math.imul(hash ^ str.charCodeAt(index), 3432918353);
      hash = (hash << 13) | (hash >>> 19);
    }
    return function () {
      hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
      hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
      return (hash ^= hash >>> 16) >>> 0;
    };
  }

  function getSeedString() {
    const querySeed = new URLSearchParams(window.location.search).get("seed");
    if (querySeed && /^\d{8}$/.test(querySeed)) {
      return querySeed;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  function handleDocumentClick(event) {
    if (!state.selected) {
      return;
    }
    if (elements.keypad.contains(event.target) || elements.clearCellButton.contains(event.target)) {
      return;
    }
    if (elements.notesPanel && elements.notesPanel.contains(event.target)) {
      return;
    }
    if (elements.boardRoot.contains(event.target)) {
      return;
    }
    state.selected = null;
    renderBoard();
    renderNotesPanel();
  }

  function renderNotesPanel() {
    if (!elements.notesPanelGrid || !elements.notesCellLabel) {
      return;
    }

    elements.notesPanelGrid.innerHTML = "";

    if (!state.showNotes) {
      elements.notesCellLabel.textContent = "已隐藏";
      appendEmptyNotes("候选数已隐藏");
      return;
    }

    if (!state.selected) {
      elements.notesCellLabel.textContent = "未选中";
      appendEmptyNotes("请选择可填写的格子");
      return;
    }

    if (state.fixed[state.selected.row][state.selected.col]) {
      elements.notesCellLabel.textContent = `R${state.selected.row + 1} C${state.selected.col + 1}`;
      appendEmptyNotes("该格为题面数字");
      return;
    }

    const { row, col } = state.selected;
    const candidates = state.initialCandidates[row][col] || [];
    const candidateState = state.candidateStates[row][col] || {};

    elements.notesCellLabel.textContent = `R${row + 1} C${col + 1}`;

    if (!candidates.length) {
      appendEmptyNotes("该格开局无候选数");
      return;
    }

    candidates.forEach((digit) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = candidateState[digit] === false ? "note-chip muted" : "note-chip";
      button.textContent = String(digit);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleCandidateState(row, col, digit);
      });
      elements.notesPanelGrid.appendChild(button);
    });
  }

  function appendEmptyNotes(message) {
    const chip = document.createElement("div");
    chip.className = "note-chip empty note-chip-message";
    chip.textContent = message;
    elements.notesPanelGrid.appendChild(chip);
  }

  function toggleCandidateState(row, col, digit) {
    const candidateState = state.candidateStates[row][col];
    if (!candidateState || !(digit in candidateState)) {
      return;
    }
    candidateState[digit] = !candidateState[digit];
    renderNotesPanel();
  }

  function hasConflictAt(row, col) {
    const value = state.board[row][col];
    if (value === 0) {
      return false;
    }

    for (let index = 0; index < SIZE; index += 1) {
      if (index !== col && state.board[row][index] === value) {
        return true;
      }
      if (index !== row && state.board[index][col] === value) {
        return true;
      }
    }

    const boxRow = Math.floor(row / BOX) * BOX;
    const boxCol = Math.floor(col / BOX) * BOX;
    for (let currentRow = boxRow; currentRow < boxRow + BOX; currentRow += 1) {
      for (let currentCol = boxCol; currentCol < boxCol + BOX; currentCol += 1) {
        if ((currentRow !== row || currentCol !== col) && state.board[currentRow][currentCol] === value) {
          return true;
        }
      }
    }

    return false;
  }

  function syncBoardMetrics() {
    const board = elements.boardRoot.querySelector(".board");
    if (!board) {
      return;
    }
    const cellSize = Math.floor(board.clientWidth / 9);
    if (cellSize > 0) {
      document.documentElement.style.setProperty("--cell-size", `${cellSize}px`);
    }
  }
}());

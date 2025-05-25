function resetGame() {
    document.querySelectorAll('#sudoku td').forEach(cell => {
        if (!cell.classList.contains('fixed')) {
            cell.textContent = '';
        }
    });

    const sudoku = document.getElementById('sudoku');
    sudoku.dataset.startTime = null;
}

function showHint() {
    document.querySelectorAll('#sudoku-hint').forEach(cell => {
        if (!cell.classList.contains('hidden')) {
            cell.classList.add('hidden');
        } else {
            cell.classList.remove('hidden');
        }
    });
}

function resetGame(button) {
    document.querySelectorAll('#sudoku td').forEach(cell => {
        if (!cell.classList.contains('fixed')) {
            cell.textContent = '';
        }
    });

    const sudoku = document.getElementById('sudoku');
    sudoku.dataset.usedTime = null;
}

function showHint(button) {
    document.querySelectorAll('#sudoku-hint').forEach(cell => {
        if (!cell.classList.contains('hidden')) {
            cell.classList.add('hidden');
            button.textContent = "开启提示";
        } else {
            cell.classList.remove('hidden');
            button.textContent = "关闭提示";
        }
    });
}

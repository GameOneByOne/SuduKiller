let selectedCell = null;

document.querySelectorAll('#sudoku td').forEach(cell => {
    cell.addEventListener('click', function() {
        // 如果已经有选中的单元格，先取消其选中状态
        if (selectedCell) {
            selectedCell.classList.remove('selected');
        }
        
        // 如果点击的是同一个单元格，则取消选中
        if (selectedCell === this) {
            selectedCell = null;
            return;
        }
        
        // 选中新单元格
        this.classList.add('selected');
        selectedCell = this;
    });
});
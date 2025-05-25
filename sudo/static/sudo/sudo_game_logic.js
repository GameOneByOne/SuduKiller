document.addEventListener('DOMContentLoaded', function () {
    // 检查数独是否完成
    function checkSudokuComplete() {
        // 检查所有单元格是否填满且无冲突
        const cells = document.querySelectorAll('#sudoku td');
        for (const cell of cells) {
            // 检查单元格是否为空或存在冲突
            if (cell.textContent.trim() === '' || cell.classList.contains('conflict')) {
                return false;
            }
        }
        
        // 检查行、列、宫格是否符合规则
        for (let i = 0; i < 9; i++) {
            const rowValues = new Set();
            const colValues = new Set();
            const boxValues = new Set();
            
            for (let j = 0; j < 9; j++) {
                // 检查行
                const rowCell = document.querySelector(`#sudoku tr:nth-child(${i+1}) td:nth-child(${j+1})`);
                if (rowValues.has(rowCell.textContent)) return false;
                rowValues.add(rowCell.textContent);
                
                // 检查列
                const colCell = document.querySelector(`#sudoku tr:nth-child(${j+1}) td:nth-child(${i+1})`);
                if (colValues.has(colCell.textContent)) return false;
                colValues.add(colCell.textContent);
                
                // 检查3x3宫格
                const boxCell = document.querySelector(`#sudoku tr:nth-child(${Math.floor(i/3)*3 + Math.floor(j/3) + 1}) td:nth-child(${(i%3)*3 + (j%3) + 1})`);
                if (boxValues.has(boxCell.textContent)) return false;
                boxValues.add(boxCell.textContent);
            }
        }
        
        return true;
    }

    // 检查数独规则冲突
    function checkSudokuRules(cell) {
        const sudokuMark = document.getElementById('sudoku').dataset.mark;
        const value = cell.textContent;
        if (!value) return;

        const row = cell.parentElement;
        const colIndex = Array.from(row.children).indexOf(cell);
        const gridRow = Math.floor(Array.from(row.parentElement.children).indexOf(row) / 3);
        const gridCol = Math.floor(colIndex / 3);

        // 检查行冲突
        for (const td of row.querySelectorAll('td')) {
            if (td !== cell && td.textContent.trim() === value.trim()) {
                cell.classList.add('conflict');
                return;
            }
        }

        for (const tr of document.querySelectorAll('#sudoku tr')) {
            const td = tr.children[colIndex];
            if (td && td !== cell && td.textContent.trim() === value.trim()) {
                cell.classList.add('conflict');
                return;
            }
        }

        // 去除冲突标记
        cell.classList.remove('conflict');

        // 检查3x3宫格冲突
        document.querySelectorAll('#sudoku tr').forEach((tr, rowIndex) => {
            const currentGridRow = Math.floor(rowIndex / 3);
            if (currentGridRow === gridRow) {
                tr.querySelectorAll('td').forEach((td, tdIndex) => {
                    const currentGridCol = Math.floor(tdIndex / 3);
                    if (currentGridCol === gridCol && td !== cell && td.textContent.trim() === value.trim()) {
                        cell.classList.add('conflict');
                        return;
                    }
                });
            }
        });

        // 检查完成后触发成功检测
        if (checkSudokuComplete()) {
            send_data_to_server_when_complete();
        }
    }

    // 获取可填入的数字
    function getPossibleNumbers(cell) {
        const row = cell.parentElement;
        const colIndex = Array.from(row.children).indexOf(cell);
        const gridRow = Math.floor(Array.from(row.parentElement.children).indexOf(row) / 3);
        const gridCol = Math.floor(colIndex / 3);

        const usedNumbers = new Set();

        // 检查行
        row.querySelectorAll('td').forEach(td => {
            if (td.textContent.trim() !== '') {
                usedNumbers.add(td.textContent.trim());
            }
        });

        // 检查列
        document.querySelectorAll('#sudoku tr').forEach(tr => {
            const td = tr.children[colIndex];
            if (td && td.textContent.trim() !== '') {
                usedNumbers.add(td.textContent.trim());
            }
        });

        // 检查3x3宫格
        document.querySelectorAll('#sudoku tr').forEach((tr, rowIndex) => {
            const currentGridRow = Math.floor(rowIndex / 3);
            if (currentGridRow === gridRow) {
                tr.querySelectorAll('td').forEach((td, tdIndex) => {
                    const currentGridCol = Math.floor(tdIndex / 3);
                    if (currentGridCol === gridCol && td.textContent.trim() !== '') {
                        usedNumbers.add(td.textContent.trim());
                    }
                });
            }
        });

        // 返回1-9中未使用的数字
        return Array.from({ length: 9 }, (_, i) => (i + 1).toString()).filter(num => !usedNumbers.has(num));
    }

    // 标记预填数字的单元格
    document.querySelectorAll('#sudoku td').forEach(cell => {
        if (cell.textContent.trim() !== '') {
            cell.classList.add('fixed');
        }
    });


    let selectedCell = null;
    let startTime = null;
    
    // 恢复保存的数据
    restoreFromStorage();

    // 添加键盘事件监听
    document.addEventListener('keydown', function (e) {
        if (!selectedCell) return;

        // 只处理数字1-9
        if (e.key >= '1' && e.key <= '9') {
            selectedCell.textContent = e.key;
            selectedCell.classList.add('user-input');
            checkSudokuRules(selectedCell);
            saveToStorage();
        }
        // 处理退格和删除键
        else if (e.key === 'Backspace' || e.key === 'Delete') {
            selectedCell.textContent = '';
            selectedCell.classList.remove('user-input');
            checkSudokuRules(selectedCell);
            saveToStorage();
        }
    });

    document.querySelectorAll('#sudoku td').forEach(cell => {
        cell.addEventListener('click', function () {
            // 如果已经有选中的单元格，先取消其选中状态
            if (selectedCell) {
                selectedCell.classList.remove('selected');
                selectedCell = null;
            }
            // 清除之前的高亮
            document.querySelectorAll('.row-highlight, .col-highlight').forEach(el => {
                el.classList.remove('row-highlight', 'col-highlight');
            });

            // 如果是预填单元格则跳过
            if (this.classList.contains('fixed')) return;

            // 清除之前的高亮
            document.querySelectorAll('.row-highlight, .col-highlight').forEach(el => {
                el.classList.remove('row-highlight', 'col-highlight');
            });

            // 如果点击的是同一个单元格，则取消选中
            if (selectedCell === this) {
                selectedCell = null;
                return;
            }

            // 如果是第一次点击，开始计时并发送请求
            const sudoku = document.getElementById('sudoku');
            if (!sudoku.dataset.startTime || sudoku.dataset.startTime === 'null') {
                sudoku.dataset.startTime = (new Date()).toISOString();
                startTime = new Date();
                send_data_to_server_when_begin();
            }
            
            // 选中新单元格
            this.classList.add('selected');
            selectedCell = this;

            // 获取行和列索引
            const row = this.parentElement;
            const colIndex = Array.from(row.children).indexOf(this);

            // 高亮整行
            row.querySelectorAll('td').forEach(td => {
                td.classList.add('row-highlight');
            });

            // 高亮整列
            document.querySelectorAll('#sudoku tr').forEach(tr => {
                if (tr.children[colIndex]) {
                    tr.children[colIndex].classList.add('col-highlight');
                }
            });

            // 获取可填入的数字
            const possibleNumbers = getPossibleNumbers(this);
            const sudoku_hint = document.getElementById('sudoku-hint');
            sudoku_hint.textContent = "可填入数字: " + possibleNumbers.join(', ');

            // 在单元格上显示可填入的数字（可根据需求调整显示方式）
            this.setAttribute('data-possible', possibleNumbers.join(', '));
        });
    });
});


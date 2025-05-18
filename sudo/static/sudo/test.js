document.addEventListener('DOMContentLoaded', function () {
    let selectedCell = null;
    let startTime = null;
    const sudokuMark = document.getElementById('sudoku').dataset.mark;
    const storageKey = `sudoku_${sudokuMark}`;
    console.log('Current Sudoku Mark:', sudokuMark);

    // 从本地存储恢复数据
    function restoreFromStorage() {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                document.querySelectorAll('#sudoku td').forEach((cell, index) => {
                    if (data.userInput[index]) {
                        cell.textContent = data.userInput[index].value;
                        if (data.userInput[index].isUserInput) {
                            cell.classList.add('user-input');
                        }
                    }
                });
                console.log('从本地存储恢复数据成功');
            } catch (e) {
                console.error('恢复数据失败:', e);
            }
        }
    }

    // 保存数据到本地存储
    function saveToStorage() {
        const cells = document.querySelectorAll('#sudoku td');
        const userInput = Array.from(cells).map(cell => ({
            value: cell.textContent,
            isUserInput: cell.classList.contains('user-input')
        }));
        localStorage.setItem(storageKey, JSON.stringify({ userInput }));
    }
    
    // 标记预填数字的单元格
    // 恢复保存的数据
    restoreFromStorage();

    document.querySelectorAll('#sudoku td').forEach(cell => {
        if (cell.textContent.trim() !== '') {
            cell.classList.add('fixed');
        }
    });

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
            fetch('/sudo/complete/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    completed: true,
                    mark: sudokuMark,
                    used_time: new Date().getTime() - startTime
                })
            })
            .then(response => {
                console.log(response)
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
            })
            .then(data => {
                alert('恭喜你 挑战成功！');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('挑战成功，但记录保存失败');
            });
        }

        // 获取CSRF token的函数
        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    }

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
            if (!startTime) {
                startTime = new Date();
                console.log('计时开始:', startTime);
                
                fetch('/sudo/occur/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify({
                        mark: sudokuMark,
                        timestamp: startTime.toISOString()
                    })
                }).catch(error => console.error('首次点击请求错误:', error));
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

                    // 获取CSRF token的函数
            function getCookie(name) {
                let cookieValue = null;
                if (document.cookie && document.cookie !== '') {
                    const cookies = document.cookie.split(';');
                    for (let i = 0; i < cookies.length; i++) {
                        const cookie = cookies[i].trim();
                        if (cookie.substring(0, name.length + 1) === (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
        });
    });
});
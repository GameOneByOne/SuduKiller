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
    function checkSudokuRules() {
        document.querySelectorAll('#sudoku td').forEach(cell => {
            const value = cell.textContent;
            if (!value) return;
            if (cell.classList.contains('fixed')) return;

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
        });
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

    // 获取所有可填入单元格的数字并存储到本地缓存
    function cachePossibleNumbers() {
        const possibleNumbersCache = {};

        document.querySelectorAll('#sudoku td').forEach((cell, index) => {
            // 跳过预填单元格
            if (cell.classList.contains('fixed')) return;

            // 获取可填入的数字
            const possibleNumbers = getPossibleNumbers(cell);

            // 将可填入的数字存储到缓存对象中，使用单元格索引作为键
            const possibleNumbersContent = [];
            possibleNumbers.forEach(item => {
                possibleNumbersContent.push({
                    value: item,
                    mark : true,
                });
            });
            possibleNumbersCache[cell.getAttribute("cell-index")] = possibleNumbersContent;
        });

        // 将缓存对象存储到 localStorage 中
        localStorage.setItem('possibleNumbersCache', JSON.stringify(possibleNumbersCache));
        console.log('可填入数字已缓存:', possibleNumbersCache);
    }

    // 填充数独提示区域内容
    function generateHintBoxes() {
        const hintContainer = document.getElementById('sudoku-hint-container');
        hintContainer.innerHTML = ''; // 清空容器内容
    
        // 生成缓冲数据
        if (localStorage.hasOwnProperty("possibleNumbersCache") === false) {
            cachePossibleNumbers();
        }
        // 生成数字盒子
        const cacheNumbers = JSON.parse(localStorage.getItem("possibleNumbersCache"));
        cacheNumbers[selectedCell.getAttribute("cell-index")].forEach(item => {
            const box = document.createElement('div');
            box.className = 'hint-box'; // 添加类名s
            box.textContent = item.value; // 设置数字内容
            hintContainer.appendChild(box); // 添加到容器中
            if (item.mark) {
                box.style.backgroundColor = '#007bff';
            } else {
                box.style.backgroundColor = 'lightgray';
            }
            box.addEventListener('click', () => {
                if (item.mark) {
                    box.style.backgroundColor = 'lightgray';
                    cacheNumbers[selectedCell.getAttribute("cell-index")].forEach(item => {
                        if (item.value === box.textContent.trim()) {
                            item.mark = false;
                        }
                    });
                } else {
                    box.style.backgroundColor = '#007bff';
                    cacheNumbers[selectedCell.getAttribute("cell-index")].forEach(item => {
                        if (item.value === box.textContent.trim()) {
                            item.mark = true;
                        }
                    });
                }
                localStorage["possibleNumbersCache"] = JSON.stringify(cacheNumbers);
            });
        });
    }

    // 标记预填数字的单元格
    document.querySelectorAll('#sudoku td').forEach(cell => {
        if (cell.textContent.trim() !== '') {
            cell.classList.add('fixed');
        }
    });

    let selectedCell = null;
    
    // 恢复保存的数据
    restoreFromStorage();

    // 初始化数独提示区域的信息
    cachePossibleNumbers();

    // 添加键盘事件监听
    document.addEventListener('keydown', function (e) {
        if (!selectedCell) return;

        // 只处理数字1-9
        if (e.key >= '1' && e.key <= '9') {
            selectedCell.textContent = e.key;
            selectedCell.classList.add('user-input');
            checkSudokuRules();
            saveToStorage();
        }
        // 处理退格和删除键
        else if (e.key === 'Backspace' || e.key === 'Delete') {
            selectedCell.textContent = '';
            selectedCell.classList.remove('user-input');
            checkSudokuRules();
            saveToStorage();
        }

        // 检查完成后触发成功检测
        if (checkSudokuComplete()) {
            send_data_to_server_when_complete();
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
            if (!sudoku.dataset.usedTime || sudoku.dataset.usedTime === 'null') {
                sudoku.dataset.usedTime = 1;
                send_data_to_server_when_begin();

                const sudokuInfo = document.querySelector('.sudoku-info');
                if (!sudokuInfo.dataset.used_time) {
                    sudokuInfo.dataset.used_time = true;
                    const newSpanLabel = document.createElement('span');
                    newSpanLabel.className = 'small-label';
                    newSpanLabel.textContent = '计时';
                    const newSpanInfo = document.createElement('span');
                    newSpanInfo.className = 'small-label';
                    newSpanInfo.textContent = '';
                    newSpanInfo.dataset.name = "usedTimeLabel";
                    sudokuInfo.insertBefore(newSpanInfo, sudokuInfo.firstChild);
                    sudokuInfo.insertBefore(newSpanLabel, sudokuInfo.firstChild);
                    // 设置定时器每秒更新一次
                    newSpanInfo.textContent = "00:00";
                    const intervalId = setInterval(() => {
                        const used_time = +(sudoku.dataset.usedTime);
                        const minutes = Math.floor(used_time / 60); // 计算分钟
                        const remainingSeconds = used_time % 60; // 计算剩余秒数
                        const formattedMinutes = String(minutes).padStart(2, '0');
                        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
                        newSpanInfo.textContent = formattedMinutes + ':' + formattedSeconds;
                        sudoku.dataset.usedTime = +(sudoku.dataset.usedTime) + 1;
                    }, 1000);
                    sudoku.dataset.interval = intervalId;
                }
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
            generateHintBoxes();
        });
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // 页面不可见时暂停计时器
            const sudoku = document.getElementById('sudoku');
            clearInterval(sudoku.dataset.interval);
        } else if (document.visibilityState === 'visible') {
            // 页面可见时恢复计时器
            const specificElement = document.querySelector('[data-name="usedTimeLabel"]');
            if (!specificElement) {
                return;
            }
            const sudoku = document.getElementById('sudoku');
            const intervalId = setInterval(() => {
                const used_time = +(sudoku.dataset.usedTime);
                const minutes = Math.floor(used_time / 60); // 计算分钟
                const remainingSeconds = used_time % 60; // 计算剩余秒数
                const formattedMinutes = String(minutes).padStart(2, '0');
                const formattedSeconds = String(remainingSeconds).padStart(2, '0');
                specificElement.textContent = formattedMinutes + ':' + formattedSeconds;
                sudoku.dataset.usedTime = +(sudoku.dataset.usedTime) + 1;
            }, 1000);
            sudoku.dataset.interval = intervalId;
        }
    });
});


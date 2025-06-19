// 从本地存储恢复数据
function restoreFromStorage() {
    const sudokuMark = document.getElementById('sudoku').dataset.mark;
    const storageKey = `sudoku_${sudokuMark}`;
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
    const sudokuMark = document.getElementById('sudoku').dataset.mark;
    const storageKey = `sudoku_${sudokuMark}`;
    const cells = document.querySelectorAll('#sudoku td');
    const userInput = Array.from(cells).map(cell => ({
        value: cell.textContent,
        isUserInput: cell.classList.contains('user-input')
    }));
    localStorage.setItem(storageKey, JSON.stringify({ userInput }));
}

// 清空本地所有数据
function clearStorage() {
    localStorage.clear();   
    console.log('清空本地存储数据成功');
}
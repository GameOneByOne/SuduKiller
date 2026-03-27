function beginTiming() {
    const sudokuInfo = document.querySelector('.sudoku-info');
    console.log(sudokuInfo.dataset);
    if (sudokuInfo.dataset.intervalId) {
        console.log("Already started timing.");
        return;
    }

    // 创建新的标签内容，如果需要的话
    if (sudokuInfo.childElementCount != 8) {
        const newSpanLabel = document.createElement('span');
        newSpanLabel.className = 'small-label';
        newSpanLabel.textContent = '计时 :';
        const newSpanInfo = document.createElement('span');
        newSpanInfo.className = 'small-label';
        newSpanInfo.textContent = '00:00';
        sudokuInfo.insertBefore(newSpanInfo, sudokuInfo.firstChild);
        sudokuInfo.insertBefore(newSpanLabel, sudokuInfo.firstChild);
        // 发送后台请求，通知计时开始
        sudokuInfo.dataset.usedTime = 1;
        send_data_to_server_when_begin();
    }

    const newSpanInfo = sudokuInfo.querySelector('.small-label:nth-child(2)');
    // 设置定时器每秒更新一次
    const intervalId = setInterval(() => {
        const used_time = +(sudokuInfo.dataset.usedTime);
        const minutes = Math.floor(used_time / 60); // 计算分钟
        const remainingSeconds = used_time % 60; // 计算剩余秒数
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        newSpanInfo.textContent = formattedMinutes + ':' + formattedSeconds;
        sudokuInfo.dataset.usedTime = +(sudokuInfo.dataset.usedTime) + 1;
    }, 1000);
    sudokuInfo.dataset.intervalId = intervalId;
}

function endTiming() {
    const sudokuInfo = document.querySelector('.sudoku-info');
    if (!sudokuInfo.dataset.intervalId) {
        console.log("No started timing.");
        return;
    }

    // 停止计时器
    clearInterval(sudokuInfo.dataset.intervalId);
    delete sudokuInfo.dataset.intervalId;
}

function resetTiming() {
    const sudokuInfo = document.querySelector('.sudoku-info');
    if (!sudokuInfo.dataset.intervalId) {
        console.log("No started timing.");
        return;
    }

    endTiming();
    sudokuInfo.dataset.usedTime = 1;
    const newSpanInfo = sudokuInfo.querySelector('.small-label:nth-child(2)');
    newSpanInfo.textContent = '00:00';
    beginTiming();
}
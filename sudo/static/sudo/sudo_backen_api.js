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

function send_data_to_server_when_complete() {
    const sudokuMark = document.getElementById('sudoku').dataset.mark;
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

function send_data_to_server_when_begin() {   
    const sudokuMark = document.getElementById('sudoku').dataset.mark; 
    const startTime = document.getElementById('sudoku').dataset.startTime;   
    fetch('/sudo/occur/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify({
            mark: sudokuMark,
            timestamp: startTime
        })
    }).catch(error => console.error('首次点击请求错误:', error));
}



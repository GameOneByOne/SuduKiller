import os
import random
import time
import django

# 设置Django环境变量
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sudoKillerWeb.settings')
django.setup()

# 导入模型
from sudo.models import Sudoku

# 配置数独的生成
result = [[-1] * 9 for _ in range(9)]
selected_data = list()

def show() :
    for row in range(9) :
        print(result[row])
        
def show_str() :
    sudo_str = ""
    for row in range(9) :
        for col in range(9) :
            sudo_str += str(result[row][col])
    return sudo_str

def valid(row : int, col : int, data : int) :
    # 查看一个块里面是否有重复
    for row_index in range((row // 3) * 3, ((row // 3) + 1) * 3) :
        for col_index in range((col // 3) * 3, ((col // 3) + 1) * 3) :
            if result[row_index][col_index] == -1 :
                break
            elif result[row_index][col_index] == data :
                return False

    # 查看一行里面是否有重复
    for col_index in range(9) :
        if result[row][col_index] == -1 :
            break
        elif result[row][col_index] == data :
            return False

    # 查看一列里面是否有重复
    for row_index in range(9) :
        if result[row_index][col] == -1 :
            break
        elif result[row_index][col] == data :
            return False

    return True

def generate(row : int, col : int) :
    # 判断终止条件
    if row > 8 or col > 8 :
        return True

    for index in range(9) :
        selected_num = selected_data[row][col][index]
        if not valid(row, col, selected_num) :
            continue

        result[row][col] = selected_num
        if not generate(row + (col + 1) // 9, (col + 1) % 9) :
            result[row][col] = -1
        else :
            return True

    return False

def init() :
    global selected_data

    print("{} [Init] Begin.".format(time.ctime()))
    # 初始化每个位置的数字选取顺序，并随机打乱
    selected_data = [[list(range(1, 10)) for _ in range(9)] for _ in range(9)]
    for row in range(9) :
        for col in range(9) :
            random.shuffle(selected_data[row][col])
    print("{} [Init] Finished.".format(time.ctime()))
    return

init()
generate(0, 0)
sudo_str = show_str()
print(sudo_str)
# 创建数独记录
sudoku = Sudoku.objects.create(
    puzzle=sudo_str,
    difficulty='M'
)
print(sudoku)
# 查询数独
sudokus = Sudoku.objects.filter(difficulty='M')
for s in sudokus:
    print(s.puzzle)
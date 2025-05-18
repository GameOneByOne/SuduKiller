import os
import random
import time
import django

# 设置Django环境变量
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sudoKillerWeb.settings')
django.setup()

from sudo.models import Sudoku

# 配置数独的生成
result = [[-1] * 9 for _ in range(9)]
selected_data = [[list(range(1, 10)) for _ in range(9)] for _ in range(9)]
for row in range(9) :
    for col in range(9) :
        random.shuffle(selected_data[row][col])
try_solve_list = list()
solution_num = 0

def convert_to_str() :
    sudo_str = ""
    for row in range(9) :
        for col in range(9) :
            sudo_str += str(result[row][col])
    return sudo_str

def valid(row : int, col : int, data : int) :
    # 查看一个块里面是否有重复
    for row_index in range((row // 3) * 3, ((row // 3) + 1) * 3) :
        for col_index in range((col // 3) * 3, ((col // 3) + 1) * 3) :
            if result[row_index][col_index] <= 0 :
                continue
            elif result[row_index][col_index] == data :
                return False

    # 查看一行里面是否有重复
    for col_index in range(9) :
        if result[row][col_index] <= 0 :
            continue
        elif result[row][col_index] == data :
            return False

    # 查看一列里面是否有重复
    for row_index in range(9) :
        if result[row_index][col] <= 0 :
            continue
        elif result[row_index][col] == data :
            return False

    return True

def empty_some_cell(empty_cell : int) :
    while empty_cell > 0 :
        row = random.randint(0, 8)
        col = random.randint(0, 8)
        if result[row][col] != 0 :
            result[row][col] = 0
            empty_cell -= 1
            try_solve_list.append([row, col])
    return

def calc_try_solve_list() :
    for index in range(len(try_solve_list)) :
        can_fill_nums = list()
        for num in range(1, 10) :
            if valid(try_solve_list[index][0], try_solve_list[index][1], num) :
                can_fill_nums.append(num)
        try_solve_list[index].append(can_fill_nums)

def calc_all_solution(index : int) :
    global solution_num
    if index >= len(try_solve_list) :
        solution_num += 1
        return

    for num in try_solve_list[index][2] :
        if not valid(try_solve_list[index][0], try_solve_list[index][1], num) :
            continue
        result[try_solve_list[index][0]][try_solve_list[index][1]] = num
        calc_all_solution(index + 1)
        result[try_solve_list[index][0]][try_solve_list[index][1]] = 0

def generate(row : int, col : int) : # 判断终止条件
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

print("{} [Generate] Begin.".format(time.ctime()))  
generate(0, 0)
print("{} [Generate] Finished.".format(time.ctime()))
solution = convert_to_str()
result_bak = list(result)
while True :
    solution_num = 0
    try_solve_list = list()
    result = list(result_bak)

    empty_some_cell(2)
    calc_try_solve_list()
    calc_all_solution(0)
    if (solution_num == 1) :
        print("{} [Empty And Solve] Valid Succeed.".format(time.ctime()))
        break
    print("{} [Empty And Solve] Valid Failed.".format(time.ctime()))

puzzle = convert_to_str()
print(puzzle)
# 创建数独记录
sudoku = Sudoku.objects.create(
    puzzle=puzzle,
    solution=solution,
    difficulty='M'
)
sudoku.save()
import os
import random
import time
import django
import argparse
from copy import deepcopy

# 设置Django环境变量
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sudoKillerWeb.settings')
django.setup()

from sudo.models import Sudoku

# 数独的配置项
EMPTY_CELLS = {
    "E": [10, 15],
    "M": [25, 30], 
    "H": [40, 50]
}

def convert_sudo_to_str(sudoku : list) :
    return ''.join(str(sudoku[row][col]) for row in range(9) for col in range(9))

def show(data : list) :
    for row in range(9) :
        print(data[row])


def valid(sudo_result : list, row : int, col : int, data : int) :
    # 查看一个块里面是否有重复
    for row_index in range((row // 3) * 3, ((row // 3) + 1) * 3) :
        for col_index in range((col // 3) * 3, ((col // 3) + 1) * 3) :
            if sudo_result[row_index][col_index] <= 0 :
                continue
            elif sudo_result[row_index][col_index] == data :
                return False

    # 查看一行里面是否有重复
    for col_index in range(9) :
        if sudo_result[row][col_index] <= 0 :
            continue
        elif sudo_result[row][col_index] == data :
            return False

    # 查看一列里面是否有重复
    for row_index in range(9) :
        if sudo_result[row_index][col] <= 0 :
            continue
        elif sudo_result[row_index][col] == data :
            return False

    return True

def empty_some_cell(sudo_result : list, empty_cell : int, try_solve_list : list) :
    while empty_cell > 0 :
        row = random.randint(0, 8)
        col = random.randint(0, 8)
        if sudo_result[row][col] != 0 :
            sudo_result[row][col] = 0
            empty_cell -= 1
            try_solve_list.append([row, col])
    return

def calc_try_solve_list(sudo_result : list, empty_cells : list) :
    try_solve_list = empty_cells
    for index in range(len(try_solve_list)) :
        can_fill_nums = list()
        for num in range(1, 10) :
            if valid(sudo_result, try_solve_list[index][0], try_solve_list[index][1], num) :
                can_fill_nums.append(num)
        try_solve_list[index].append(can_fill_nums)
    return try_solve_list

def calc_all_solution(sudo_result : list, try_solve_list : list, process_info : dict, index : int = 0) :
    if index >= len(try_solve_list) :
        process_info["solution_num"] += 1
        return
    
    if (process_info["solution_num"] > 1) :
        return

    for num in try_solve_list[index][2] :
        if not valid(sudo_result, try_solve_list[index][0], try_solve_list[index][1], num) :
            continue
        sudo_result[try_solve_list[index][0]][try_solve_list[index][1]] = num
        calc_all_solution(sudo_result, try_solve_list, process_info, index + 1)
        sudo_result[try_solve_list[index][0]][try_solve_list[index][1]] = 0

def generate(sudo_result : list, selected_data : list, row : int = 0, col : int = 0) :
    if row > 8 or col > 8 :
        return True

    for index in range(9) :
        selected_num = selected_data[row][col][index]
        if not valid(sudo_result, row, col, selected_num) :
            continue

        sudo_result[row][col] = selected_num
        if not generate(sudo_result, selected_data, row + (col + 1) // 9, (col + 1) % 9) :
            sudo_result[row][col] = -1
        else :
            return True

    return False

def init(sudo_result : list, selected_data : list) :
    # 清空并初始化sudo_result
    for row in range(9):
        sudo_result.append([-1] * 9)

    # 配置数独的生成
    for row in range(9):
        selected_data.append(list())
        for col in range(9) :
            selected_data[row].append(list(range(1, 10)))
            random.shuffle(selected_data[row][col])

def generate_sudoku(difficulty):
    sudo_result = list()
    selected_data = list()

    # 初始化二维矩阵
    init(sudo_result, selected_data)

    # 先生成一个完整的数字列表
    generate(sudo_result, selected_data)
    solution = convert_sudo_to_str(sudo_result)

    # 每次迭代都尝试挖空一些数字，然后计算所有可能的解，如果只有唯一的解，则退出循环
    while True:
        # 初始化要使用的变量
        try_solve_list = list()
        try_solve_result = deepcopy(sudo_result)
        
        # 随机选择一个要挖空的单元格数量，并开始挖空
        empty_cells = random.randint(EMPTY_CELLS[difficulty][0], EMPTY_CELLS[difficulty][1])
        empty_some_cell(try_solve_result, empty_cells, try_solve_list)
        
        # 依照挖空的单元格数量计算空单元格所有的可能性
        calc_try_solve_list(try_solve_result, try_solve_list)

        # 初始化处理过程结构体
        process_info = dict()
        process_info["max_solution_process"] = 1
        process_info["solution_num"] = 0
        process_info["current_solution_process"] = 1
        for index in range(len(try_solve_list)) :
            process_info["max_solution_process"] *= len(try_solve_list[index][2])
        
        # 计算所有可能的解
        calc_all_solution(try_solve_result, try_solve_list, process_info)
        if (process_info["solution_num"] == 1):
            break

    puzzle = convert_sudo_to_str(try_solve_result)
    show(try_solve_result)
    return puzzle, solution

def parse_args():
    parser = argparse.ArgumentParser(description='Generate Sudoku puzzles')
    parser.add_argument('-d', '--difficulty', type=str, choices=["E", "M", "H"], help='Difficulty level of sudoku')
    parser.add_argument('-n', '--number', type=int, default=1, help='Number of sudokus to generate')
    parser.add_argument('-t', '--test', type=bool, default=True, help='test data will not save to database')
    return parser.parse_args()

if __name__ == '__main__':
    args = parse_args()
    for i in range(args.number):
        puzzle, solution = generate_sudoku(args.difficulty)
        print("-------------Circle {} | Difficulty {}------------".format(i + 1, args.difficulty))

        if (args.test) :
            continue
        
        # 存入数据库
        sudoku = Sudoku.objects.create(
            puzzle=puzzle,
            solution=solution,
            difficulty=args.difficulty
        )
        sudoku.save()
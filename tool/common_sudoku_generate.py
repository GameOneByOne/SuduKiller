import os
import sys
import time
import random
import django
import argparse
from copy import deepcopy
from utils_define import EMPTY_CELLS
from utils import SudokuGenerator, SudokuValidator, SudoKuLogger

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sudokuWeb.settings')
django.setup()

from commonMode.models import CommonSudoku

def convert_sudo_to_str(sudoku : list) :
    return ''.join(str(sudoku[row][col]) for row in range(9) for col in range(9))

def empty_some_cell(sudo_result : list, empty_cell : int, try_solve_list : list) :
    while empty_cell > 0 :
        row = random.randint(0, 8)
        col = random.randint(0, 8)
        if sudo_result[row][col] != 0 :
            sudo_result[row][col] = 0
            empty_cell -= 1
            try_solve_list.append([row, col])
    return

def calc_try_solve_list(sudo_result : list, try_solve_list : list) :
    for index in range(len(try_solve_list)) :
        can_fill_nums = list()
        for num in range(1, 10) :
            if SudokuValidator.valid(sudo_result, try_solve_list[index][0], try_solve_list[index][1], num) :
                can_fill_nums.append(num)
        try_solve_list[index].append(can_fill_nums)
    try_solve_list.sort(key=lambda x : len(x[2]))
    
    current_solve_num = 1
    for item in try_solve_list[::-1] :
        item.append(current_solve_num)
        current_solve_num *= len(item[2])
    return

def calc_all_solution(sudo_result : list, try_solve_list : list, process_info : dict, index : int = 0) :
    if index >= len(try_solve_list) :
        process_info["solution_num"] += 1
        process_info["current_process"] += 1
        SudoKuLogger.show_process(process_info)
        return
    
    # 如果已经有多个解了，就不再继续计算了
    if (process_info["solution_num"] > 1) :
        return

    # 超时也不需要再计算了
    if (time.time() - process_info["start_time"]) > process_info["timeout"] :
        process_info["solution_num"] = 0
        return

    for num in try_solve_list[index][2] :
        SudoKuLogger.show_process(process_info)
        if not SudokuValidator.valid(sudo_result, try_solve_list[index][0], try_solve_list[index][1], num) :
            process_info["current_process"] += try_solve_list[index][3]
            SudoKuLogger.show_process(process_info)
            continue

        sudo_result[try_solve_list[index][0]][try_solve_list[index][1]] = num
        calc_all_solution(sudo_result, try_solve_list, process_info, index + 1)
        sudo_result[try_solve_list[index][0]][try_solve_list[index][1]] = 0

def generate_sudoku(difficulty):
    SudokuGenerator.generate()
    solution = SudokuGenerator.get_result()

    # 每次迭代都尝试挖空一些数字，然后计算所有可能的解，如果只有唯一的解，则退出循环
    while True:
        # 初始化要使用的变量
        try_solve_list = list()
        try_solve_result = deepcopy(solution)
        
        # 随机选择一个要挖空的单元格数量，并开始挖空
        empty_cells = random.randint(EMPTY_CELLS[difficulty][0], EMPTY_CELLS[difficulty][1])
        empty_some_cell(try_solve_result, empty_cells, try_solve_list)

        # 依照挖空的单元格数量计算空单元格所有的可能性
        calc_try_solve_list(try_solve_result, try_solve_list)

        # 初始化处理过程结构体
        process_info = dict()
        process_info["max_process"] = 1
        process_info["current_process"] = 0
        process_info["solution_num"] = 0
        process_info["start_time"] = time.time()
        process_info["timeout"] = 120
        process_info["status"] = "processing"
        for index in range(len(try_solve_list)) :
            process_info["max_process"] *= len(try_solve_list[index][2])
        
        # 计算所有可能的解
        calc_all_solution(try_solve_result, try_solve_list, process_info)
        SudoKuLogger.show_process(process_info)
        if (process_info["solution_num"] == 1):
            break

    puzzle = convert_sudo_to_str(try_solve_result)
    return puzzle, solution

def parse_args():
    parser = argparse.ArgumentParser(description='Generate Sudoku puzzles')
    parser.add_argument('-d', '--difficulty', type=str, choices=["E", "M", "H"], help='Difficulty level of sudoku')
    parser.add_argument('-n', '--number', type=int, default=1, help='Number of sudokus to generate')
    parser.add_argument('-t', '--test', action="store_true", help='test data will not save to database')
    return parser.parse_args()

if __name__ == '__main__':
    args = parse_args()
    for i in range(args.number):
        puzzle, solution = generate_sudoku(args.difficulty)
        print("Circle {} | Difficulty {} | Puzzle {}".format(i + 1, args.difficulty, puzzle))

        if (args.test) :
            continue
        
        # 存入数据库
        sudoku = CommonSudoku.objects.create(
            puzzle=puzzle,
            solution=solution,
            difficulty=args.difficulty
        )
        sudoku.save()
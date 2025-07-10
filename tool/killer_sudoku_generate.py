import os
import sys
import time
import random
import django
import argparse
from copy import deepcopy
from utils_define import REGION_DIVISION, DIRECTION_DIFF
from utils import SudokuGenerator

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sudoKillerWeb.settings')
django.setup()

from sudo.models import Sudoku

def convert_sudo_to_str(sudoku : list) :
    return ''.join(str(sudoku[row][col]) for row in range(9) for col in range(9))

def show(sudoku : list) :
    for row in sudoku :
        print(row)

def get_total_sum_arrange(cell_num : int, total_num : int, current_nums: list, result : list) :
    if total_num == 0 and len(current_nums) == cell_num :
        result.append(deepcopy(current_nums))
        return

    if len(current_nums) >= cell_num :
        return

    if len(current_nums) != 0 and current_nums[len(current_nums) - 1] == 9 :
        return
    
    start_num = 1
    if len(current_nums) != 0:
        start_num = current_nums[len(current_nums) - 1] + 1
    
    for num in range(start_num, 10) :
        if num <= total_num :
            current_nums.append(num)
            total_num -= num
            get_total_sum_arrange(cell_num, total_num, current_nums, result)
            total_num += num
            current_nums.pop()
    return

def get_num_arrange(total_nums : list, result : list, current_nums : list) :
    if len(current_nums) == len(total_nums) and current_nums not in result :
        result.append(deepcopy(current_nums))

    for num in total_nums :
        if num not in current_nums :
            current_nums.append(num)
            get_num_arrange(total_nums, result, current_nums)
            current_nums.pop()

    return 

def calc_try_solve_list(region_list : list, try_solve_list : list) :
    # 先计算出区域内可能的数字组合
    for region in region_list :
        cell_num = len(region[0])
        total_num = region[1]
        sum_arranges = list()
        get_total_sum_arrange(cell_num, total_num, [], sum_arranges)
        try_solve_list.append([region[0], sum_arranges])

    # 再计算出这些数字组合的全排列
    for region in try_solve_list :
        for nums in region[1] :
            results = list()
            get_num_arrange(nums, results, [])
            for result in results :
                region.append(result)
    return

def init_region_probable(difficulty : str) :
    region_division_datas = deepcopy(REGION_DIVISION[difficulty])
    total_probable = 0
    for data in region_division_datas :
        total_probable += data[1]
        data[1] = total_probable
    
    return region_division_datas

def get_cell_region_num(region_division_datas : list) :
    final_region_size = 0
    current_number = 0
    random_number = random.randint(1, 100)
    for data in region_division_datas :
        current_number += data[1]
        if current_number >= random_number :
            final_region_size = data[0]
            break

    return final_region_size

def extend_cell(current_deal_regions : list, dealed_regions : list, all_regions : list) :
    # 决定要扩展哪个单元格
    should_extend_cell = current_deal_regions[random.randint(0, len(current_deal_regions) - 1)]

    # 决定要扩展的方向
    random_direction_cells = list()
    for direction in DIRECTION_DIFF :
        current_direction_cell = [should_extend_cell[0] + direction[0], should_extend_cell[1] + direction[1]]
        # 当前方向的单元格有效且没有被占用，则可以进行随机
        if current_direction_cell in all_regions and current_direction_cell not in dealed_regions :
            random_direction_cells.append(current_direction_cell)
    
    if len(random_direction_cells) == 0:
        return False

    # 开始扩展
    extend_cell = random_direction_cells[random.randint(0, len(random_direction_cells) - 1)]

    # 更新记录
    current_deal_regions.append(extend_cell)
    dealed_regions.append(extend_cell)
    return True

def region_division(sudo_result : list, difficulty: str, region_list : list) :
    # 获取难度等级下的区域分布
    region_division_datas = init_region_probable(difficulty)

    # 从第一个单元格开始计算概率分布并开始划分
    all_regions = [[row, col] for row in range(0, 9) for col in range(0, 9)]
    dealed_regions = list()
    for row, col in all_regions :
        # 处理过的不再重复处理
        if [row, col] in dealed_regions :
            continue

        current_deal_regions = list()
        current_deal_regions.append([row, col])
        dealed_regions.append([row, col])

        # 根据概率计算要占用几个单元格
        final_region_size = 0
        current_region_size = get_cell_region_num(region_division_datas)
        current_region_size -= 1
        
        for _ in range(0, current_region_size) :
            # 扩展单元格
            if not extend_cell(current_deal_regions, dealed_regions, all_regions) :
                break

        # 更新结果
        total_sum = 0
        for cell in current_deal_regions :
            total_sum += sudo_result[cell[0]][cell[1]]
        region_list.append([current_deal_regions, total_sum])

    return

def calc_all_solution(sudo_result : list, try_solve_list : list, process_info : dict, index : int = 0) :
    print("Process {}% | Solution {} | Remained Time {} | Status {}".format(
        round(float(process_info['current_process']) * 100 / process_info['max_process'], 2),
        process_info['solution_num'],
        process_info["timeout"] - int(time.time() - process_info["start_time"]),
        process_info["status"]), end='\r')

    if index >= len(try_solve_list) :
        process_info["solution_num"] += 1
        process_info["status"] = "perfect solution"
        return

    # 如果已经有多个解了，就不再继续计算了
    if (process_info["solution_num"] > 1) :
        process_info["status"] = "too mant solutions"
        return

    # 超时也不需要再计算了
    if (time.time() - process_info["start_time"]) > process_info["timeout"] :
        process_info["solution_num"] = 0
        process_info["status"] = "time out"
        return

    # 递归计算
    cells = try_solve_list[index][0]
    num_arranges = try_solve_list[index][3:]

    for nums in num_arranges :
        # 先验证有没有问题
        valid_mark = True
        for ind in range(0, len(nums)) :
            if not SudokuGenerator.valid(sudo_result, cells[ind][0], cells[ind][1], nums[ind]) :
                valid_mark = False
                break

        if not valid_mark :
            process_info["current_process"] += try_solve_list[index][2]
            continue

        # 没问题的话，填充数字
        for ind in range(0, len(nums)) :
            sudo_result[cells[ind][0]][cells[ind][1]] = nums[ind]

        # 递归
        calc_all_solution(sudo_result, try_solve_list, process_info, index + 1)

        # 数字还原
        for ind in range(0, len(nums)) :
            sudo_result[cells[ind][0]][cells[ind][1]] = 0

def generate_killer_sudoku(difficulty):
    generator = SudokuGenerator()
    generator.generate()
    solution = generator.get_result()

    # 每次迭代都尝试挖空一些数字，然后计算所有可能的解，如果只有唯一的解，则退出循环
    while True:
        # 初始化要使用的变量
        try_solve_list = list()
        region_list = list()
        try_solve_result = deepcopy(solution)
        puzzle = convert_sudo_to_str(try_solve_result)
        
        # 根据规则，随机划分一些区域
        region_division(try_solve_result, difficulty, region_list)

        # 依照划分的区域计算空单元格所有的可能性
        calc_try_solve_list(region_list, try_solve_list)
        try_solve_list.sort(key = lambda x : len(x[2:]))

        # 初始化处理过程结构体
        process_info = dict()        
        process_info["max_process"] = 1
        process_info["current_process"] = 0
        process_info["solution_num"] = 0
        process_info["start_time"] = time.time()
        process_info["timeout"] = 120
        process_info["status"] = "processing"
        total_process = 1
        for index in range(len(try_solve_list) - 1 , -1, -1) :
            try_solve_list[index].insert(2, total_process)
            total_process *= len(try_solve_list[index][3:])
            process_info["max_process"] *= len(try_solve_list[index][3:])

        # 计算所有可能的解
        try_solve_result = [[0 for _ in range(9)] for _ in range(9)]
        calc_all_solution(try_solve_result, try_solve_list, process_info)
        print("Process {}% | Solution {} | Remained Time {} | Status {}".format(
            round(float(process_info['current_process']) * 100 / process_info['max_process'], 2),
            process_info['solution_num'],
            process_info["timeout"] - int(time.time() - process_info["start_time"]),
            process_info["status"]), end='\r')
        time.sleep(5)
        print("\n")
        print("Terminal Status {}\n".format(process_info["status"]))
        if (process_info["status"] == "perfect solution"):
            break

    return puzzle, region_list

def parse_args():
    parser = argparse.ArgumentParser(description='Generate Sudoku puzzles')
    parser.add_argument('-d', '--difficulty', type=str, choices=REGION_DIVISION.keys(), help='Difficulty level of sudoku')
    parser.add_argument('-n', '--number', type=int, default=1, help='Number of sudokus to generate')
    parser.add_argument('-t', '--test', action="store_true", help='test data will not save to database')
    return parser.parse_args()

if __name__ == '__main__':
    args = parse_args()
    for i in range(args.number):
        puzzle, solution = generate_killer_sudoku(args.difficulty)
        print("Circle {} | Difficulty {} | Puzzle {}".format(i + 1, args.difficulty, puzzle))

        if (args.test) :
            continue
        
        # 存入数据库
        sudoku = Sudoku.objects.create(
            puzzle=puzzle,
            solution=solution,
            difficulty=args.difficulty
        )
        sudoku.save()
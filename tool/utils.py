import time
import random


g_sudo_result = list()
g_selected_data = list()

class SudoKuLogger() :
    @staticmethod
    def show_process(process_info : dict) :
        print("Process {}% | Solution {} | Remained Time {} | Status {}".format(
            round(float(process_info['current_process']) * 100 / process_info['max_process'], 2),
            process_info['solution_num'],
            process_info["timeout"] - int(time.time() - process_info["start_time"]),
            process_info["status"]), end='\r')

class SudokuGenerator() :
    @staticmethod
    def init() :
        global g_sudo_result
        global g_selected_data

        # 重制全局变量
        g_sudo_result = [[-1] * 9 for _ in range(9)]
        g_selected_data = [[list(range(1, 10)) for _ in range(9)] for _ in range(9)]
        for row in range(9):
            for col in range(9) :
                random.shuffle(g_selected_data[row][col])

    @staticmethod
    def generate(row : int = 0, col : int = 0) :
        # 首次要初始化
        if row == 0 and col == 0 :
            __class__.init()

        # 先生成一个完整的数字列表
        if row > 8 or col > 8 :
            return True

        for index in range(9) :
            selected_num = g_selected_data[row][col][index]
            if not SudokuValidator.valid(g_sudo_result, row, col, selected_num) :
                continue

            g_sudo_result[row][col] = selected_num
            if not __class__.generate(row + (col + 1) // 9, (col + 1) % 9) :
                g_sudo_result[row][col] = -1
            else :
                return True

        return False

    @staticmethod
    def get_result() :
        global g_sudo_result
        return g_sudo_result

class SudokuValidator() :
    @staticmethod
    def valid(sudo_result : list, row : int, col : int, data : int) :
        # 查看一个块里面是否有重复
        for row_index in range((row // 3) * 3, ((row // 3) + 1) * 3) :
            for col_index in range((col // 3) * 3, ((col // 3) + 1) * 3) :
                if sudo_result[row_index][col_index] == data  :
                    return False

        # 查看一行里面是否有重复
        for col_index in range(9) :
            if sudo_result[row][col_index] == data :
                return False

        # 查看一列里面是否有重复
        for row_index in range(9) :
            if sudo_result[row_index][col] == data :
                return False

        return True


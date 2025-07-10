import random


class SudokuGenerator() :
    sudo_result = list()
    selected_data = list()

    def init(self) :
        self.sudo_result = list()
        self.selected_data = list()

        # 清空并初始化sudo_result
        for row in range(9):
            self.sudo_result.append([-1] * 9)

        # 配置数独的生成
        for row in range(9):
            self.selected_data.append(list())
            for col in range(9) :
                self.selected_data[row].append(list(range(1, 10)))
                random.shuffle(self.selected_data[row][col])

    def generate(self, row : int = 0, col : int = 0) :
        # 首次要初始化
        if row == 0 and col == 0 :
            self.init()

        # 先生成一个完整的数字列表
        if row > 8 or col > 8 :
            return True

        for index in range(9) :
            selected_num = self.selected_data[row][col][index]
            if not self.valid(self.sudo_result, row, col, selected_num) :
                continue

            self.sudo_result[row][col] = selected_num
            if not self.generate(row + (col + 1) // 9, (col + 1) % 9) :
                self.sudo_result[row][col] = -1
            else :
                return True

        return False

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
    
    def get_result(self) :
        return self.sudo_result


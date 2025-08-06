from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import json
from .models import KillerSudoku
import random

difficulty_map = {
    'VE': '非常简单',
    'E': '简单',
    'M': '中等',
    'H': '困难'
}

def sudo_solve(request, mark : str):
    context = dict()
    context["difficulty_map"] = difficulty_map
    
    # 获取指定数独题目
    sudoku = KillerSudoku.objects.get(mark=mark)
    empty_grid = [['0' for _ in range(9)] for _ in range(9)]
    context["regions"] = sudoku.puzzle
    context["nums"] = [[{'value': col, 'cell_index': row_index * 9 + col_index} for col_index, col in enumerate(row)] for row_index, row in enumerate(empty_grid)]
    context["difficulty"] = difficulty_map[sudoku.difficulty]
    context["try_nums"] = sudoku.try_nums
    context["sloved_nums"] = sudoku.sloved_nums
    context["mark"] = sudoku.mark
    
    return render(request, "killerMode/killerMode_main.html", context)
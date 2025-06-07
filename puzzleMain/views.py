from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import json
from sudo.models import Sudoku
import random


difficulty_map = {
    'E': '简单',
    'M': '中等',
    'H': '困难'
}

def puzzle_main(request):
    context = dict()
    context["difficulty_map"] = difficulty_map
    
    # 获取难度参数
    difficulty = request.GET.get('difficulty')
    
    # 获取对应难度的数独ID列表
    if difficulty:
        sudoku_ids = list(Sudoku.objects.filter(difficulty=difficulty[0].upper()).values_list('id', flat=True))
    else:
        sudoku_ids = list(Sudoku.objects.values_list('id', flat=True))
    
    if sudoku_ids:
        random_id = random.choice(sudoku_ids)
        sudoku = Sudoku.objects.get(id=random_id)
        context["nums"] = [[{'value': col, 'cell_index': row_index * 9 + col_index} for col_index, col in enumerate(row)] for row_index, row in enumerate(sudoku.get_grid())]
        context["difficulty"] = difficulty_map[sudoku.difficulty]
        context["try_nums"] = sudoku.try_nums
        context["sloved_nums"] = sudoku.sloved_nums
        context["mark"] = sudoku.mark
    else:
        # 如果没有数据，返回空网格
        context["nums"] = [[-1] * 9 for _ in range(9)]
    
    return render(request, "puzzleMain/main.html", context)
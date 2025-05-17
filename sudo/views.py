from django.shortcuts import render
from django.http import HttpResponse
from .models import Sudoku
import random

def SudoMain(request):
    context = dict()
    
    # 获取所有数独ID列表
    sudoku_ids = list(Sudoku.objects.values_list('id', flat=True))
    
    if sudoku_ids:
        # 随机选择一个ID
        random_id = random.choice(sudoku_ids)
        # 获取对应的数独
        sudoku = Sudoku.objects.get(id=random_id)
        # 将puzzle转换为9x9网格
        context["nums"] = sudoku.get_grid()
        context["sudoku_id"] = random_id
    else:
        # 如果没有数据，返回空网格
        context["nums"] = [[-1] * 9 for _ in range(9)]
    
    return render(request, "sudo/index.html", context)

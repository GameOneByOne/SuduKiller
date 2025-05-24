from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import json
from .models import Sudoku
import random

def sudo_solve(request):
    context = dict()
    
    # 获取难度参数
    difficulty = request.GET.get('difficulty')
    
    # 获取对应难度的数独ID列表
    if difficulty:
        sudoku_ids = list(Sudoku.objects.filter(difficulty=difficulty[0].upper()).values_list('id', flat=True))
    else:
        sudoku_ids = list(Sudoku.objects.values_list('id', flat=True))
    
    # 统计各难度题目数量
    context["easy_count"] = Sudoku.objects.filter(difficulty='E').count()
    context["medium_count"] = Sudoku.objects.filter(difficulty='M').count()
    context["hard_count"] = Sudoku.objects.filter(difficulty='H').count()
    
    if sudoku_ids:
        random_id = random.choice(sudoku_ids)
        sudoku = Sudoku.objects.get(id=random_id)
        context["nums"] = sudoku.get_grid()
        context["difficulty"] = sudoku.difficulty
        context["try_nums"] = sudoku.try_nums
        context["sloved_nums"] = sudoku.sloved_nums
        context["mark"] = sudoku.mark
    else:
        # 如果没有数据，返回空网格
        context["nums"] = [[-1] * 9 for _ in range(9)]
    
    return render(request, "sudo/sudo_main.html", context)

def sudo_occur(request) :
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            mark = data.get('mark')
            sudo_obj = Sudoku.objects.get(mark=mark)
            sudo_obj.try_nums += 1
            sudo_obj.save()
            return JsonResponse({'status': 'success'})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'status': 'fail'})

def sudo_complete(request) :
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            mark = data.get('mark')
            sudo_obj = Sudoku.objects.get(mark=mark)
            sudo_obj.sloved_nums += 1
            sudo_obj.save()
            return JsonResponse({'status': 'success'})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    return JsonResponse({'status': 'fail'})
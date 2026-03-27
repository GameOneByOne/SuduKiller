from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
import json
from .models import CommonSudoku


difficulty_map = {
    'E': '简单',
    'M': '中等',
    'H': '困难'
}

def sudo_solve(request, mark : str):
    context = dict()
    context["difficulty_map"] = difficulty_map
    
    # 获取指定数独题目
    sudoku = CommonSudoku.objects.get(mark=mark)
    context["nums"] = [[{'value': col, 'cell_index': row_index * 9 + col_index} for col_index, col in enumerate(row)] for row_index, row in enumerate(sudoku.get_grid())]
    context["difficulty"] = difficulty_map[sudoku.difficulty]
    context["try_nums"] = sudoku.try_nums
    context["sloved_nums"] = sudoku.sloved_nums
    context["mark"] = sudoku.mark
    
    return render(request, "commonMode/sudo_main.html", context)

def sudo_occur(request) :
    if request.method == 'POST':

        try:
            data = json.loads(request.body)
            mark = data.get('mark')
            sudo_obj = CommonSudoku.objects.get(mark=mark)
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
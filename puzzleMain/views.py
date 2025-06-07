from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from sudo.models import Sudoku


difficulty_map = {
    'E': '简单',
    'M': '中等',
    'H': '困难'
}

def puzzle_main(request):
    context = dict()
    context["difficulty_map"] = difficulty_map
    formatted_time = timezone.now().strftime("%Y-%m-%d")
    # 显示当前的题目
    sudoku_datas = list(Sudoku.objects.filter(created_at=formatted_time))
    context["sudok_datas"] = list()
    for data in sudoku_datas :
        context["sudok_datas"].append({
            "difficulty": data.get_difficulty_display(),
            "sloved_nums": data.sloved_nums,
            "try_nums": data.try_nums,
            "mark": data.mark,
            "content": data.get_grid(),
        })
    print(context)
    return render(request, "puzzleMain/main.html", context)
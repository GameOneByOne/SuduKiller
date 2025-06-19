from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils import timezone
from sudo.models import Sudoku
from achievement.models import Achievement


difficulty_map = {
    'E': '简单',
    'M': '中等',
    'H': '困难'
}

def puzzle_main(request):
    context = dict()
    context["difficulty_map"] = difficulty_map
    formatted_time = timezone.now().strftime("%Y-%m-%d")
    # 获取题目数据
    sudoku_datas = list(Sudoku.objects.filter(created_at=formatted_time))
    context["sudoku_datas"] = list()
    for data in sudoku_datas :
        context["sudoku_datas"].append({
            "difficulty": data.get_difficulty_display(),
            "sloved_nums": data.sloved_nums,
            "try_nums": data.try_nums,
            "mark": data.mark,
            "content": data.get_grid(),
        })

    sudo_content = render_to_string('sudo/sudo_panel.html', context)
    # 传递给当前模板
    return render(request, "puzzleMain/main.html", {'panel_content': sudo_content})

def puzzle_achievement(request):
    context = dict()
    # 获取成就数据
    achievement_datas = list(Achievement.objects.all())
    context["achievement_datas"] = list()
    for data in achievement_datas :
        context["achievement_datas"].append({
            "name": data.name,
            "icon": data.icon,
            "description": data.description,
            "type": data.type,
        })
    achievement_content = render_to_string('achievement/achievement_panel.html', context)
    # 传递给当前模板
    return render(request, "puzzleMain/main.html", {'panel_content': achievement_content})
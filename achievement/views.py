import json

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .models import SudokuCompletionRecord


def achievement_main(request):
    return render(request, "achievement/achievement_panel.html")


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


def serialize_completion_record(record):
    return {
        "ip": record.ip_address,
        "region": record.region,
        "elapsed_seconds": record.elapsed_seconds,
        "completed_at": record.completed_at.isoformat(),
        "puzzle_id": record.puzzle_id,
    }


@csrf_exempt
def completion_records_api(request):
    if request.method == "GET":
        records = SudokuCompletionRecord.objects.all()[:12]
        return JsonResponse({
            "records": [serialize_completion_record(record) for record in records]
        })

    if request.method == "POST":
        try:
            data = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        try:
            elapsed_seconds = int(data.get("elapsed_seconds", 0) or 0)
        except (TypeError, ValueError):
            return JsonResponse({"error": "elapsed_seconds must be a number"}, status=400)

        if elapsed_seconds <= 0:
            return JsonResponse({"error": "elapsed_seconds must be positive"}, status=400)

        record = SudokuCompletionRecord.objects.create(
            puzzle_id=str(data.get("puzzle_id") or "unknown"),
            ip_address=get_client_ip(request),
            region=(str(data.get("region") or "").strip() or "未知地区")[:120],
            elapsed_seconds=elapsed_seconds,
        )
        return JsonResponse({"record": serialize_completion_record(record)}, status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)

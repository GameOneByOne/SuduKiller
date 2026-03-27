from django.db import models

class AchievementType(models.TextChoices):
    SUDOKU = 'sudoku', '数独'
    OTHER = 'other', '其他'

class Achievement(models.Model):
    name = models.CharField(max_length=100, verbose_name="成就名称")
    icon = models.URLField(max_length=200, verbose_name="成就图标")
    description = models.TextField(default="", verbose_name="成就描述")
    type = models.CharField(
        max_length=10,
        choices=AchievementType.choices,
        default=AchievementType.SUDOKU,
        verbose_name="成就类型"
    )

    def __str__(self):
        return self.name


class SudokuCompletionRecord(models.Model):
    puzzle_id = models.CharField(max_length=80, verbose_name="题目编号")
    ip_address = models.CharField(max_length=64, verbose_name="IP 地址")
    region = models.CharField(max_length=120, default="未知地区", verbose_name="地域")
    elapsed_seconds = models.PositiveIntegerField(verbose_name="用时秒数")
    completed_at = models.DateTimeField(auto_now_add=True, verbose_name="通关时间")

    class Meta:
        ordering = ["-completed_at"]
        verbose_name = "数独通关记录"
        verbose_name_plural = "数独通关记录"

    def __str__(self):
        return f"{self.ip_address} - {self.elapsed_seconds}s"

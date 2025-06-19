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
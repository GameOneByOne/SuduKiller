from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator
import hashlib
import json

class KillerSudoku(models.Model):
    DIFFICULTY_CHOICES = [
        ('E', 'Easy'),
        ('M', 'Medium'), 
        ('H', 'Hard'),
        ('X', 'Expert'),
    ]
    
    # 题目: 81字符(1-9或0表示空格)
    puzzle = models.JSONField(
        default=list,
        help_text="存储数独的统计信息JSON数据",
        blank=True
    )
    
    # 答案: 81字符(可选)
    solution = models.CharField(
        max_length=81,
        validators=[MinLengthValidator(81), MaxLengthValidator(81)],
        blank=True,
        help_text="81字符的字符串表示完整答案"
    )
    
    difficulty = models.CharField(
        max_length=1,
        choices=DIFFICULTY_CHOICES,
        default='M'
    )
    
    sloved_nums = models.IntegerField(default=0)
    try_nums = models.IntegerField(default=0)
    created_at = models.DateField(auto_now_add=True)
    mark = models.CharField(max_length=32, editable=False, unique=True)

    def save(self, *args, **kwargs):
        """自动计算puzzle的MD5作为mark"""
        if not self.mark or self._state.adding:
            md5 = hashlib.md5()
            md5.update(self.solution.encode('utf-8'))
            self.mark = md5.hexdigest()
        super().save(*args, **kwargs)


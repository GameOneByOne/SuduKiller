from django.db import models
from django.core.validators import MinLengthValidator, MaxLengthValidator
import hashlib

class Sudoku(models.Model):
    DIFFICULTY_CHOICES = [
        ('E', 'Easy'),
        ('M', 'Medium'), 
        ('H', 'Hard'),
        ('X', 'Expert'),
    ]
    
    # 题目: 81字符(1-9或0表示空格)
    puzzle = models.CharField(
        max_length=81,
        validators=[MinLengthValidator(81), MaxLengthValidator(81)],
        help_text="81字符的字符串表示数独题目(0表示空格)"
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
    created_at = models.DateTimeField(auto_now_add=True)
    mark = models.CharField(max_length=32, editable=False, unique=True)
    
    def save(self, *args, **kwargs):
        """自动计算puzzle的MD5作为mark"""
        if not self.mark or self._state.adding:
            md5 = hashlib.md5()
            md5.update(self.puzzle.encode('utf-8'))
            self.mark = md5.hexdigest()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"数独 {self.id} ({self.get_difficulty_display()})"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = '数独谜题'
        verbose_name_plural = '数独谜题'
    
    def get_grid(self, field='puzzle'):
        """将字符串转换为9x9二维列表"""
        value = getattr(self, field)
        return [list(value[i*9:(i+1)*9]) for i in range(9)]
    
    def set_grid(self, grid, field='puzzle'):
        """将9x9二维列表转换为字符串存储"""
        flat_str = ''.join([''.join(row) for row in grid])
        setattr(self, field, flat_str)
    
    def check_solution(self):
        """检查答案是否符合数独规则"""
        if not self.solution or len(self.solution) != 81 or not all(c in '123456789' for c in self.solution):
            return False
            
        grid = self.get_grid(field='solution')
        
        # 检查行
        for row in grid:
            if len(set(row)) != 9:
                return False
                
        # 检查列
        for col in zip(*grid):
            if len(set(col)) != 9:
                return False
                
        # 检查3x3宫
        for i in range(0, 9, 3):
            for j in range(0, 9, 3):
                block = [grid[x][y] for x in range(i, i+3) for y in range(j, j+3)]
                if len(set(block)) != 9:
                    return False
                    
        return True

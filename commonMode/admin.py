from django.contrib import admin
from .models import CommonSudoku

@admin.register(CommonSudoku)
class CommonSudokuAdmin(admin.ModelAdmin):
    list_display = ('id', 'short_puzzle', 'difficulty', 'created_at')
    list_filter = ['difficulty']
    search_fields = ('puzzle', 'solution')
    readonly_fields = ('mark', 'created_at')
    
    def short_puzzle(self, obj):
        return f"{obj.puzzle[:20]}..." if len(obj.puzzle) > 20 else obj.puzzle
    short_puzzle.short_description = 'Puzzle'

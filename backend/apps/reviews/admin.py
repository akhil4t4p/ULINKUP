from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('customer', 'business', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('comment', 'customer__user__email', 'business__user__email')

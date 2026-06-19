from django.contrib import admin
from .models import Advertisement

@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ('title', 'business', 'target_category', 'budget', 'status', 'start_date', 'end_date', 'clicks', 'views')
    list_filter = ('status', 'target_category', 'start_date', 'end_date')
    search_fields = ('title', 'business__user__email', 'business__user__username')
    readonly_fields = ('clicks', 'views', 'created_at')

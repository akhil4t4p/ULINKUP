from django.contrib import admin
from .models import Subscription

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan_type', 'start_date', 'end_date', 'is_active')
    list_filter = ('plan_type', 'is_active', 'start_date')
    search_fields = ('user__email', 'user__username')

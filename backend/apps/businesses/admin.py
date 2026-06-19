from django.contrib import admin
from .models import Category, BusinessProfile, BusinessPortfolio, Lead

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', )

@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'hourly_rate', 'experience', 'location', 'is_available', 'verified', 'is_featured')
    list_filter = ('category', 'is_available', 'verified', 'is_featured')
    search_fields = ('user__email', 'user__username', 'location', 'about')
    list_editable = ('hourly_rate', 'verified', 'is_featured', 'is_available')

@admin.register(BusinessPortfolio)
class BusinessPortfolioAdmin(admin.ModelAdmin):
    list_display = ('business', 'title', 'created_at')
    search_fields = ('title', 'description', 'business__user__email')

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('customer', 'business', 'location', 'is_locked', 'created_at')
    list_filter = ('is_locked', 'created_at')
    search_fields = ('service_description', 'customer__email', 'business__user__email', 'location')

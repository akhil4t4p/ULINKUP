from django.contrib import admin
from .models import PublicPost, Community, Membership


@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'location', 'creator', 'member_count', 'is_public', 'created_at')
    list_filter = ('category', 'is_public', 'created_at')
    search_fields = ('name', 'description', 'category', 'location', 'creator__email')
    readonly_fields = ('created_at', )

    def member_count(self, obj):
        return obj.member_count
    member_count.short_description = 'Members'


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'community', 'role', 'joined_at')
    list_filter = ('role', 'community')
    search_fields = ('user__email', 'community__name')


@admin.register(PublicPost)
class PublicPostAdmin(admin.ModelAdmin):
    list_display = ('post_type', 'author', 'community', 'like_count', 'created_at')
    list_filter = ('post_type', 'created_at', 'community')
    search_fields = ('caption', 'author__email', 'og_title', 'url')
    readonly_fields = ('created_at', 'updated_at', 'like_count', 'youtube_id')

    def like_count(self, obj):
        return obj.like_count
    like_count.short_description = 'Likes'

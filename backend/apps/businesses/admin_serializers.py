from rest_framework import serializers
from .models import BusinessProfile

class AdminBusinessProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    leads_count = serializers.SerializerMethodField()
    groups_count = serializers.SerializerMethodField()

    class Meta:
        model = BusinessProfile
        fields = [
            'id', 'user_email', 'username', 'category_name', 
            'plan_tier', 'verified', 'is_featured', 
            'location', 'experience', 'hourly_rate',
            'leads_count', 'groups_count', 'created_at'
        ]

    def get_leads_count(self, obj):
        return obj.leads_received.count()

    def get_groups_count(self, obj):
        # Count communities owned by this user
        if hasattr(obj.user, 'owned_communities'):
            return obj.user.owned_communities.count()
        return 0

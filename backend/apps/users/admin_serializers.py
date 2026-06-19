from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class AdminUserSerializer(serializers.ModelSerializer):
    wallet_balance = serializers.SerializerMethodField()
    plan_tier = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined', 'last_login', 'wallet_balance', 'plan_tier']
        read_only_fields = ['date_joined', 'last_login']

    def get_wallet_balance(self, obj):
        if hasattr(obj, 'coin_wallet'):
            return obj.coin_wallet.coins
        return 0

    def get_plan_tier(self, obj):
        if hasattr(obj, 'business_profile'):
            return obj.business_profile.plan_tier
        return 'FREE'

from .models import SystemLog

class AdminSystemLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = SystemLog
        fields = ['id', 'user_email', 'action_type', 'description', 'ip_address', 'created_at']

from .models import PlatformAPIKey, SiteSetting

class PlatformAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformAPIKey
        fields = '__all__'

class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = '__all__'

from .models import ContentBlock

class ContentBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentBlock
        fields = '__all__'

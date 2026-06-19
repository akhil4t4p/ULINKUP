from rest_framework import serializers
from .models import Category, BusinessProfile, BusinessPortfolio, Lead

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'icon')

class BusinessPortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessPortfolio
        fields = ('id', 'image', 'title', 'description', 'created_at')

class BusinessProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', required=False)
    nickname = serializers.CharField(source='user.nickname', required=False, allow_blank=True)
    avatar = serializers.ImageField(source='user.avatar', read_only=True)
    banner = serializers.ImageField(source='user.banner', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    portfolio_items = BusinessPortfolioSerializer(many=True, read_only=True)
    rating = serializers.FloatField(read_only=True)
    
    # New properties for dual monetization system
    lead_connections_count = serializers.SerializerMethodField()
    subscription_plan = serializers.SerializerMethodField()
    is_restricted = serializers.SerializerMethodField()

    class Meta:
        model = BusinessProfile
        fields = (
            'id', 'username', 'nickname', 'avatar', 'banner', 'email', 'category', 'category_name', 
            'about', 'hourly_rate', 'experience', 'location', 
            'is_available', 'profile_photo', 'work_timings', 'service_areas',
            'portfolio_items', 'rating', 'verified', 'is_featured', 'created_at', 'updated_at',
            'lead_connections_count', 'subscription_plan', 'is_restricted'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'portfolio_items', 'rating', 'verified', 'is_featured', 'lead_connections_count', 'subscription_plan', 'is_restricted')

    def get_lead_connections_count(self, obj):
        return Lead.objects.filter(business=obj, is_locked=False).count()

    def get_subscription_plan(self, obj):
        from apps.subscriptions.models import Subscription
        from django.utils import timezone
        active_sub = Subscription.objects.filter(user=obj.user, is_active=True, end_date__gt=timezone.now()).first()
        return active_sub.plan_type if active_sub else 'FREE'

    def get_is_restricted(self, obj):
        plan = self.get_subscription_plan(obj)
        if plan == 'FREE':
            return self.get_lead_connections_count(obj) >= 10
        return False

    def validate_username(self, value):
        request = self.context.get('request')
        if not request:
            return value
        user = request.user
        from django.contrib.auth import get_user_model
        from apps.users.models import UsernameChangeLog
        from django.utils import timezone
        from datetime import timedelta

        User = get_user_model()
        if User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This trade name/username is already taken.")
            
        if user.username != value:
            one_month_ago = timezone.now() - timedelta(days=30)
            recent_changes = UsernameChangeLog.objects.filter(
                user=user,
                changed_at__gte=one_month_ago
            ).count()
            if recent_changes >= 3:
                raise serializers.ValidationError("You can only change your username 3 times within a 30-day period.")

        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        new_username = user_data.get('username')
        new_nickname = user_data.get('nickname')
        user = instance.user
        
        user_updated = False
        if new_username is not None and user.username != new_username:
            user.username = new_username
            user_updated = True
            from apps.users.models import UsernameChangeLog
            UsernameChangeLog.objects.create(user=user)
            
        if new_nickname is not None and user.nickname != new_nickname:
            user.nickname = new_nickname
            user_updated = True
            
        if user_updated:
            user.save()
            
        return super().update(instance, validated_data)

    def validate_hourly_rate(self, value):
        if value < 0:
            raise serializers.ValidationError("Hourly rate cannot be negative.")
        return value

class LeadSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    business_name = serializers.CharField(source='business.user.username', read_only=True)

    class Meta:
        model = Lead
        fields = (
            'id', 'customer', 'customer_name', 'customer_email', 'customer_phone', 
            'business', 'business_name', 'service_description', 'location', 
            'is_locked', 'created_at'
        )
        read_only_fields = ('id', 'customer', 'is_locked', 'created_at')

    def get_customer_name(self, obj):
        if obj.is_locked:
            name = obj.customer.username.split('@')[0]
            return f"{name[:3]}***" if len(name) > 3 else f"{name}***"
        return obj.customer.username

    def get_customer_email(self, obj):
        if obj.is_locked:
            return "locked@ulinkup.com"
        return obj.customer.email

    def get_customer_phone(self, obj):
        if obj.is_locked:
            return "+91 ********** "
        return "+91 98765 43210"

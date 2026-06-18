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
    username = serializers.CharField(source='user.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    portfolio_items = BusinessPortfolioSerializer(many=True, read_only=True)
    rating = serializers.FloatField(read_only=True)

    class Meta:
        model = BusinessProfile
        fields = (
            'id', 'username', 'email', 'category', 'category_name', 
            'about', 'hourly_rate', 'experience', 'location', 
            'is_available', 'profile_photo', 'work_timings', 'service_areas',
            'portfolio_items', 'rating', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'portfolio_items', 'rating')

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

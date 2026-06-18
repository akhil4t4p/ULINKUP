from rest_framework import serializers
from .models import Category, BusinessProfile

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'icon')

class BusinessProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = BusinessProfile
        fields = (
            'id', 'username', 'email', 'category', 'category_name', 
            'about', 'hourly_rate', 'experience', 'location', 
            'is_available', 'profile_photo', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

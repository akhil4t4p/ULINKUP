from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.user.username', read_only=True)
    business_name = serializers.CharField(source='business.user.username', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'customer', 'customer_name', 'business', 'business_name', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'created_at')

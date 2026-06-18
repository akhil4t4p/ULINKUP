from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.user.username', read_only=True)
    business_name = serializers.CharField(source='business.user.username', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'customer', 'customer_name', 'business', 'business_name', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'customer', 'created_at')

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

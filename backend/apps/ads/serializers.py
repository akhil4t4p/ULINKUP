from rest_framework import serializers
from .models import Advertisement

class AdvertisementSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.user.username', read_only=True)
    category_name = serializers.CharField(source='target_category.name', read_only=True)

    class Meta:
        model = Advertisement
        fields = (
            'id', 'business', 'business_name', 'title', 'banner_image', 
            'target_category', 'category_name', 'budget', 'start_date', 
            'end_date', 'clicks', 'views', 'status', 'created_at'
        )
        read_only_fields = ('id', 'business', 'clicks', 'views', 'created_at')

    def validate_budget(self, value):
        if value <= 0:
            raise serializers.ValidationError("Ad budget must be greater than zero.")
        return value

from rest_framework import serializers
from .models import Subscription

class SubscriptionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Subscription
        fields = ('id', 'user', 'username', 'plan_type', 'start_date', 'end_date', 'is_active')
        read_only_fields = ('id', 'start_date', 'is_active')

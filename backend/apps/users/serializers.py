from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import User, UsernameChangeLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'nickname', 'avatar', 'banner', 'google_avatar', 'avatar_preset', 'role', 'is_staff', 'is_active')
        read_only_fields = ('id', 'is_staff', 'is_active', 'google_avatar')

    def validate_username(self, value):
        user = self.instance
        if user and user.username != value:
            # Enforce 3 times per month limit
            one_month_ago = timezone.now() - timedelta(days=30)
            recent_changes = UsernameChangeLog.objects.filter(
                user=user,
                changed_at__gte=one_month_ago
            ).count()
            if recent_changes >= 3:
                raise serializers.ValidationError("You can only change your username 3 times within a 30-day period.")
        return value

    def update(self, instance, validated_data):
        new_username = validated_data.get('username')
        if new_username and new_username != instance.username:
            UsernameChangeLog.objects.create(user=instance)
        return super().update(instance, validated_data)

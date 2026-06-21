from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import User, UsernameChangeLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'nickname', 'avatar', 'banner', 'google_avatar', 'avatar_preset', 'role', 
            'is_staff', 'is_active', 'referral_code', 'referred_by', 'ulu_coins',
            'phone_number', 'whatsapp_number', 'business_email', 'instagram_url', 
            'youtube_url', 'facebook_url', 'telegram_url', 'tiktok_url', 'is_profile_optimized'
        )
        read_only_fields = ('id', 'is_staff', 'is_active', 'google_avatar', 'referral_code', 'referred_by', 'ulu_coins', 'is_profile_optimized')

    def validate_username(self, value):
        user = self.instance
        if user and user.username != value:
            # Enforce 1 time per 6 months (180 days) limit
            six_months_ago = timezone.now() - timedelta(days=180)
            recent_changes = UsernameChangeLog.objects.filter(
                user=user,
                changed_at__gte=six_months_ago
            ).count()
            if recent_changes >= 1:
                raise serializers.ValidationError("You can only change your username 1 time per 6 months.")
        return value

    def update(self, instance, validated_data):
        new_username = validated_data.get('username')
        if new_username and new_username != instance.username:
            UsernameChangeLog.objects.create(user=instance)
        return super().update(instance, validated_data)

from dj_rest_auth.registration.serializers import RegisterSerializer

class CustomRegisterSerializer(RegisterSerializer):
    referral_code = serializers.CharField(required=False, allow_blank=True, default='')
    role = serializers.CharField(required=False, default='CUSTOMER')

    def get_cleaned_data(self):
        cleaned_data = super().get_cleaned_data()
        cleaned_data['referral_code'] = self.validated_data.get('referral_code', '')
        cleaned_data['role'] = self.validated_data.get('role', 'CUSTOMER')
        return cleaned_data

    def save(self, request):
        user = super().save(request)
        role = self.validated_data.get('role', 'CUSTOMER').upper()
        if role in ('CUSTOMER', 'BUSINESS', 'ADMIN'):
            user.role = role
        user.save()

        # Initialize wallet
        from apps.payments.models import UluCoinWallet
        UluCoinWallet.objects.get_or_create(user=user)

        # Apply referral logic if a referral code is provided
        referral_code = self.validated_data.get('referral_code', '')
        if referral_code:
            from .referral import apply_referral
            apply_referral(user, referral_code)
            
        return user

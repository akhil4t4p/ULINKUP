from rest_framework import serializers
from .models import CustomerProfile

class CustomerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = CustomerProfile
        fields = ('id', 'username', 'email', 'bio', 'profile_photo', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

from rest_framework import viewsets, serializers
from apps.payments.models import Transaction
from apps.users.admin_views import IsSuperAdmin

class AdminTransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'

class AdminTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = Transaction.objects.select_related('user').all().order_by('-created_at')
    serializer_class = AdminTransactionSerializer

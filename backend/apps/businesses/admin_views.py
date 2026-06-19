from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BusinessProfile
from .admin_serializers import AdminBusinessProfileSerializer

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser))

class AdminBusinessViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = BusinessProfile.objects.select_related('user', 'category').all().order_by('-created_at')
    serializer_class = AdminBusinessProfileSerializer

    @action(detail=True, methods=['post'])
    def change_plan(self, request, pk=None):
        business = self.get_object()
        new_plan = request.data.get('plan_tier')
        if new_plan not in ['FREE', 'SILVER', 'GOLD']:
            return Response({'error': 'Invalid plan tier'}, status=status.HTTP_400_BAD_REQUEST)
        
        business.plan_tier = new_plan
        if new_plan == 'GOLD':
            business.is_featured = True
        else:
            business.is_featured = False
        business.save()
        return Response({'status': 'success', 'plan_tier': business.plan_tier, 'is_featured': business.is_featured})

    @action(detail=True, methods=['post'])
    def toggle_verification(self, request, pk=None):
        business = self.get_object()
        business.verified = not business.verified
        business.save()
        return Response({'status': 'success', 'verified': business.verified})

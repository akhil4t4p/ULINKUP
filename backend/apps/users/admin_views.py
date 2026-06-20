from rest_framework import viewsets, views, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db.models import Sum, Count
from apps.businesses.models import BusinessProfile, Lead
from apps.payments.models import Transaction
from .models import SystemLog
from datetime import date, timedelta
from .admin_serializers import AdminUserSerializer, AdminSystemLogSerializer

User = get_user_model()

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser))

class AdminDashboardStatsAPIView(views.APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        total_users = User.objects.count()
        business_users = User.objects.filter(role='BUSINESS').count()
        
        revenue_agg = Transaction.objects.filter(status='SUCCESS').aggregate(Sum('amount'))
        total_revenue = revenue_agg['amount__sum'] or 0
        
        today_agg = Transaction.objects.filter(status='SUCCESS', created_at__date=date.today()).aggregate(Sum('amount'))
        today_revenue = today_agg['amount__sum'] or 0
        
        active_users = User.objects.filter(is_active=True).count()
        pending_payments = Transaction.objects.filter(status='PENDING').count()
        total_leads = Lead.objects.count()
        
        groups_created = 0
        try:
            from apps.community.models import Community
            groups_created = Community.objects.count()
        except ImportError:
            pass

        # Generate 7-day trailing data for charts
        last_7_days = [(date.today() - timedelta(days=i)) for i in range(6, -1, -1)]
        labels = [d.strftime('%b %d') for d in last_7_days]
        
        users_chart = []
        revenue_chart = []
        for d in last_7_days:
            u_count = User.objects.filter(date_joined__date=d).count()
            users_chart.append(u_count)
            
            r_agg = Transaction.objects.filter(status='SUCCESS', created_at__date=d).aggregate(Sum('amount'))
            revenue_chart.append(float(r_agg['amount__sum'] or 0))

        # Referral Stats
        from apps.payments.models import ReferralTransaction
        total_referrals = ReferralTransaction.objects.filter(status='SUCCESS').count()
        
        coins_inviter = ReferralTransaction.objects.filter(status='SUCCESS').aggregate(Sum('reward_to_inviter'))['reward_to_inviter__sum'] or 0
        coins_new_user = ReferralTransaction.objects.filter(status='SUCCESS').aggregate(Sum('reward_to_new_user'))['reward_to_new_user__sum'] or 0
        total_coins_distributed = coins_inviter + coins_new_user
        
        top_inviters = list(ReferralTransaction.objects.filter(status='SUCCESS')
            .values('inviter__email', 'inviter__username')
            .annotate(total_referrals=Count('id'))
            .order_by('-total_referrals')[:5])

        return Response({
            'totalUsers': total_users,
            'businessUsers': business_users,
            'totalRevenue': total_revenue,
            'todayRevenue': today_revenue,
            'activeUsers': active_users,
            'pendingPayments': pending_payments,
            'totalLeads': total_leads,
            'groupsCreated': groups_created,
            'totalReferrals': total_referrals,
            'totalCoinsDistributed': total_coins_distributed,
            'topInviters': top_inviters,
            'charts': {
                'labels': labels,
                'users': users_chart,
                'revenue': revenue_chart
            }
        })

class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        SystemLog.objects.create(
            user=request.user,
            action_type='ADMIN',
            description=f"{'Activated' if user.is_active else 'Suspended'} user {user.email}",
            ip_address=request.META.get('REMOTE_ADDR')
        )
        return Response({'status': 'success', 'is_active': user.is_active})

class AdminSystemLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = SystemLog.objects.select_related('user').all().order_by('-created_at')
    serializer_class = AdminSystemLogSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        action_type = self.request.query_params.get('action')
        if action_type:
            qs = qs.filter(action_type=action_type)
        return qs

from .models import PlatformAPIKey, SiteSetting, ContentBlock
from .admin_serializers import PlatformAPIKeySerializer, SiteSettingSerializer, ContentBlockSerializer
from django.apps import apps
import json

class ContentBlockViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = ContentBlock.objects.all().order_by('section', 'key')
    serializer_class = ContentBlockSerializer

class PlatformAPIKeyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = PlatformAPIKey.objects.all().order_by('service_name')
    serializer_class = PlatformAPIKeySerializer

class SiteSettingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSuperAdmin]
    queryset = SiteSetting.objects.all().order_by('key')
    serializer_class = SiteSettingSerializer

class AdminDatabaseExplorerAPIView(views.APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, table_name=None):
        if not table_name:
            # List all models
            tables = []
            for model in apps.get_models():
                tables.append({
                    'name': model.__name__,
                    'app': model._meta.app_label,
                    'count': model.objects.count()
                })
            return Response(sorted(tables, key=lambda x: x['name']))
        else:
            # Fetch raw data for a specific model
            for model in apps.get_models():
                if model.__name__.lower() == table_name.lower():
                    # Limit to 50 rows for safety
                    qs = model.objects.all()[:50]
                    # We can't use a generic serializer easily, so we use .values()
                    data = list(qs.values())
                    return Response({
                        'table': model.__name__,
                        'app': model._meta.app_label,
                        'total_count': model.objects.count(),
                        'data': data
                    })
            return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, table_name=None):
        row_id = request.data.get('id')
        if not table_name or not row_id:
            return Response({'error': 'Table name and row ID required'}, status=status.HTTP_400_BAD_REQUEST)

        for model in apps.get_models():
            if model.__name__.lower() == table_name.lower():
                try:
                    obj = model.objects.get(pk=row_id)
                    obj.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
                except model.DoesNotExist:
                    return Response({'error': 'Row not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, table_name=None):
        """Generic Insert"""
        if not table_name:
            return Response({'error': 'Table name required'}, status=status.HTTP_400_BAD_REQUEST)
        
        for model in apps.get_models():
            if model.__name__.lower() == table_name.lower():
                try:
                    obj = model(**request.data)
                    obj.save()
                    # Return saved data using values() to avoid serialization issues with complex types
                    # Fallback to empty dict if values() isn't straightforward
                    return Response({'id': obj.id, 'status': 'inserted'}, status=status.HTTP_201_CREATED)
                except Exception as e:
                    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, table_name=None):
        """Generic Update"""
        if not table_name:
            return Response({'error': 'Table name required'}, status=status.HTTP_400_BAD_REQUEST)
        
        row_id = request.data.pop('id', None)
        if not row_id:
            return Response({'error': 'Row ID is required for update'}, status=status.HTTP_400_BAD_REQUEST)

        for model in apps.get_models():
            if model.__name__.lower() == table_name.lower():
                try:
                    obj = model.objects.get(pk=row_id)
                    for key, value in request.data.items():
                        setattr(obj, key, value)
                    obj.save()
                    return Response({'id': obj.id, 'status': 'updated'}, status=status.HTTP_200_OK)
                except model.DoesNotExist:
                    return Response({'error': 'Row not found'}, status=status.HTTP_404_NOT_FOUND)
                except Exception as e:
                    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)


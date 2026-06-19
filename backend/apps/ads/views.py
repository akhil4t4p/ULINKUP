from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Advertisement
from .serializers import AdvertisementSerializer
from apps.businesses.models import BusinessProfile
from apps.payments.models import Transaction

class AdvertisementViewSet(viewsets.ModelViewSet):
    queryset = Advertisement.objects.all()
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Advertisement.objects.all()
        
        my_ads = self.request.query_params.get('my', None)
        if my_ads == 'true' and self.request.user.is_authenticated:
            try:
                business_profile = BusinessProfile.objects.get(user=self.request.user)
                queryset = queryset.filter(business=business_profile)
            except BusinessProfile.DoesNotExist:
                queryset = queryset.none()
        else:
            status_param = self.request.query_params.get('status', None)
            if status_param:
                queryset = queryset.filter(status=status_param.upper())
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            business_profile = BusinessProfile.objects.get(user=request.user)
        except BusinessProfile.DoesNotExist:
            return Response(
                {"error": "Only registered businesses can create advertisements"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        budget = serializer.validated_data.get('budget', 0)
        
        # Create Transaction directly (no wallet deduction)
        Transaction.objects.create(
            user=request.user,
            amount=budget,
            transaction_type='ADVERTISEMENT',
            status='SUCCESS'
        )
        
        serializer.save(business=business_profile)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        instance = serializer.instance
        new_budget = serializer.validated_data.get('budget', None)
        
        if new_budget is not None and new_budget != instance.budget:
            diff = new_budget - instance.budget
            
            if diff > 0:
                Transaction.objects.create(
                    user=self.request.user,
                    amount=diff,
                    transaction_type='ADVERTISEMENT',
                    status='SUCCESS'
                )
            elif diff < 0:
                refund = abs(diff)
                Transaction.objects.create(
                    user=self.request.user,
                    amount=-refund,
                    transaction_type='ADVERTISEMENT',
                    status='SUCCESS'
                )
                
        serializer.save()

    def perform_destroy(self, instance):
        Transaction.objects.create(
            user=self.request.user,
            amount=-instance.budget,
            transaction_type='ADVERTISEMENT',
            status='SUCCESS'
        )
        instance.delete()

    @action(detail=True, methods=['post'], url_path='click_increment', permission_classes=[permissions.AllowAny])
    def click_increment(self, request, pk=None):
        ad = self.get_object()
        ad.clicks += 1
        ad.save(update_fields=['clicks'])
        return Response({"status": "click registered", "clicks": ad.clicks})

    @action(detail=True, methods=['post'], url_path='view_increment', permission_classes=[permissions.AllowAny])
    def view_increment(self, request, pk=None):
        ad = self.get_object()
        ad.views += 1
        ad.save(update_fields=['views'])
        return Response({"status": "view registered", "views": ad.views})

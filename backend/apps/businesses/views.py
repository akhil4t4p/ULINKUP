from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connection
from django.db.models import Avg, Value
from django.db.models.functions import Coalesce
from .models import Category, BusinessProfile, BusinessPortfolio, Lead
from .serializers import CategorySerializer, BusinessProfileSerializer, BusinessPortfolioSerializer, LeadSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class BusinessProfileViewSet(viewsets.ModelViewSet):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # Annotate with average reviews rating, coalesced to 5.0
        queryset = BusinessProfile.objects.annotate(
            avg_rating=Coalesce(Avg('reviews_received__rating'), Value(5.0))
        )
        
        # Search queries
        q = self.request.query_params.get('q', None)
        loc = self.request.query_params.get('loc', None)
        category = self.request.query_params.get('category', None)
        min_rating = self.request.query_params.get('min_rating', None)
        min_exp = self.request.query_params.get('min_exp', None)
        max_rate = self.request.query_params.get('max_rate', None)
        is_available = self.request.query_params.get('is_available', None)
        
        # PostgreSQL Vector Full-Text Search with Relevancy Rank
        if q:
            if connection.vendor == 'postgresql':
                from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
                vector = SearchVector('about', weight='A') + \
                         SearchVector('user__username', weight='B') + \
                         SearchVector('service_areas', weight='C') + \
                         SearchVector('work_timings', weight='D')
                query = SearchQuery(q)
                queryset = queryset.annotate(rank=SearchRank(vector, query)).filter(rank__gte=0.1).order_by('-rank')
            else:
                # Fallback to standard SQLite/MySQL contains searches for local development offline support
                queryset = queryset.filter(
                    about__icontains=q) | queryset.filter(
                    user__username__icontains=q) | queryset.filter(
                    service_areas__icontains=q) | queryset.filter(
                    work_timings__icontains=q)
        
        # Apply filters
        if loc:
            queryset = queryset.filter(location__icontains=loc)
        if category:
            queryset = queryset.filter(category__name__iexact=category)
        if min_rating:
            queryset = queryset.filter(avg_rating__gte=float(min_rating))
        if min_exp:
            queryset = queryset.filter(experience__gte=int(min_exp))
        if max_rate:
            queryset = queryset.filter(hourly_rate__lte=float(max_rate))
        if is_available is not None:
            val = is_available.lower() in ['true', '1', 't']
            queryset = queryset.filter(is_available=val)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get', 'put', 'patch', 'post'])
    def me(self, request):
        profile, created = BusinessProfile.objects.get_or_create(
            user=request.user,
            defaults={'location': 'Local Area'}
        )
        if request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = self.get_serializer(profile, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

class BusinessPortfolioViewSet(viewsets.ModelViewSet):
    queryset = BusinessPortfolio.objects.all()
    serializer_class = BusinessPortfolioSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        profile, created = BusinessProfile.objects.get_or_create(
            user=self.request.user,
            defaults={'location': 'Local Area'}
        )
        serializer.save(business=profile)

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'business_profile'):
            return Lead.objects.filter(business=user.business_profile).order_by('-created_at')
        return Lead.objects.filter(customer=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        lead = self.get_object()
        if not lead.is_locked:
            return Response({'error': 'Lead already unlocked'}, status=status.HTTP_400_BAD_REQUEST)
        
        from apps.payments.models import Wallet, Transaction
        from decimal import Decimal
        
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        if wallet.balance < Decimal('15.00'):
            return Response(
                {'error': 'Insufficient wallet balance. Cost is ₹15.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        wallet.balance -= Decimal('15.00')
        wallet.save()
        
        lead.is_locked = False
        lead.save()
        
        Transaction.objects.create(
            user=request.user,
            amount=Decimal('15.00'),
            transaction_type='LEAD_UNLOCK',
            status='SUCCESS',
            reference_id=f'LEAD_{lead.id}'
        )
        
        return Response({'success': True, 'new_balance': wallet.balance, 'lead': LeadSerializer(lead).data})

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connection
from django.db.models import Avg, Value
from django.db.models.functions import Coalesce
from .models import Category, BusinessProfile, BusinessPortfolio, Lead
from .serializers import CategorySerializer, BusinessProfileSerializer, BusinessPortfolioSerializer, LeadSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        name = serializer.validated_data.get('name', '').upper()
        slug = name.lower().replace(' ', '-').replace('&', 'and')
        # Check if category already exists (case-insensitive)
        existing = Category.objects.filter(name__iexact=name).first()
        if existing:
            from rest_framework.response import Response
            return existing
        serializer.save(name=name, slug=slug)

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

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        try:
            profile = request.user.business_profile
        except BusinessProfile.DoesNotExist:
            return Response({'error': 'Business profile not found'}, status=status.HTTP_404_NOT_FOUND)

        # 1. Lead conversions
        total_leads = profile.leads_received.count()
        unlocked_leads = profile.leads_received.filter(is_locked=False).count()
        unlock_rate = (unlocked_leads / total_leads * 100) if total_leads > 0 else 0.0

        # 2. Review metrics
        reviews = profile.reviews_received.all()
        review_count = reviews.count()
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 5.0

        rating_dist = {
            '5': reviews.filter(rating=5).count(),
            '4': reviews.filter(rating=4).count(),
            '3': reviews.filter(rating=3).count(),
            '2': reviews.filter(rating=2).count(),
            '1': reviews.filter(rating=1).count(),
        }

        # 3. Advertising stats
        ads = profile.advertisements.all()
        total_clicks = sum(ad.clicks for ad in ads)
        total_views = sum(ad.views for ad in ads)
        total_spent = sum(ad.budget for ad in ads if ad.status == 'ACTIVE')
        ctr = (total_clicks / total_views * 100) if total_views > 0 else 0.0

        ad_list = []
        for ad in ads:
            ad_ctr = (ad.clicks / ad.views * 100) if ad.views > 0 else 0.0
            ad_list.append({
                'id': ad.id,
                'title': ad.title,
                'clicks': ad.clicks,
                'views': ad.views,
                'budget': str(ad.budget),
                'status': ad.status,
                'ctr': round(ad_ctr, 2)
            })

        return Response({
            'leads': {
                'total': total_leads,
                'unlocked': unlocked_leads,
                'unlock_rate': round(unlock_rate, 2)
            },
            'reviews': {
                'count': review_count,
                'average': round(avg_rating, 2),
                'distribution': rating_dist
            },
            'advertising': {
                'total_clicks': total_clicks,
                'total_views': total_views,
                'total_spent': str(total_spent),
                'ctr': round(ctr, 2),
                'ads': ad_list
            }
        })

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
        
        profile = request.user.business_profile
        from apps.subscriptions.models import Subscription
        from django.utils import timezone
        
        active_sub = Subscription.objects.filter(user=request.user, is_active=True, end_date__gt=timezone.now()).first()
        plan_type = active_sub.plan_type if active_sub else 'FREE'
        
        if plan_type == 'FREE':
            unlocked_count = Lead.objects.filter(business=profile, is_locked=False).count()
            if unlocked_count >= 10:
                from apps.payments.models import UluCoinWallet, CoinTransactionHistory
                try:
                    wallet = UluCoinWallet.objects.get(user=request.user)
                    if wallet.coins < 7:
                        return Response({'error': 'Insufficient ULU Coins. Need 7 Coins.'}, status=status.HTTP_403_FORBIDDEN)
                    wallet.coins -= 7
                    wallet.save()
                    CoinTransactionHistory.objects.create(
                        user=request.user,
                        transaction_type='SPEND',
                        coins_amount=7,
                        description=f"Unlocked lead ID {lead.id}"
                    )
                except UluCoinWallet.DoesNotExist:
                    return Response({'error': 'Wallet not found. Need 7 ULU Coins to unlock.'}, status=status.HTTP_403_FORBIDDEN)
        
        lead.is_locked = False
        lead.save()
        
        return Response({'success': True, 'lead': LeadSerializer(lead).data})

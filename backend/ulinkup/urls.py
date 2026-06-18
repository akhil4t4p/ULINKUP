from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Views Imports
from apps.users.views import GoogleLogin, developer_mock_login
from apps.customers.views import CustomerProfileViewSet
from apps.businesses.views import CategoryViewSet, BusinessProfileViewSet, BusinessPortfolioViewSet, LeadViewSet
from apps.reviews.views import ReviewViewSet
from apps.payments.views import WalletViewSet, TransactionViewSet
from apps.ads.views import AdvertisementViewSet
from apps.subscriptions.views import SubscriptionViewSet

# Register API ViewSets to DRF Router
router = DefaultRouter()
router.register('customers', CustomerProfileViewSet, basename='customer')
router.register('categories', CategoryViewSet, basename='category')
router.register('businesses', BusinessProfileViewSet, basename='business')
router.register('portfolio', BusinessPortfolioViewSet, basename='portfolio')
router.register('leads', LeadViewSet, basename='lead')
router.register('reviews', ReviewViewSet, basename='review')
router.register('wallets', WalletViewSet, basename='wallet')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('ads', AdvertisementViewSet, basename='ad')
router.register('subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # REST API routing
    path('api/', include(router.urls)),
    
    # REST Framework Base auth endpoints
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Social OAuth Google login
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    
    # Local Developer Mock login (bypasses Google keys for dev environment)
    path('api/auth/developer/', developer_mock_login, name='developer_mock_login'),
    
    # SimpleJWT tokens (if direct JWT generation is needed)
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve static/media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

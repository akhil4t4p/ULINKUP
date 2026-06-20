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
from apps.users.views import GoogleLogin, google_auth_verify, developer_mock_login, ConfigAPIView, NotificationViewSet, CustomTokenRefreshView
from apps.customers.views import CustomerProfileViewSet
from apps.businesses.views import CategoryViewSet, BusinessProfileViewSet, BusinessPortfolioViewSet, LeadViewSet
from apps.reviews.views import ReviewViewSet
from apps.payments.views import UluCoinWalletViewSet, CoinTransactionHistoryViewSet, TransactionViewSet
from apps.ads.views import AdvertisementViewSet
from apps.subscriptions.views import SubscriptionViewSet
from apps.users.admin_views import (
    AdminUserViewSet, AdminDashboardStatsAPIView, AdminSystemLogViewSet,
    PlatformAPIKeyViewSet, SiteSettingViewSet, AdminDatabaseExplorerAPIView,
    ContentBlockViewSet
)
from apps.businesses.admin_views import AdminBusinessViewSet
from apps.payments.admin_views import AdminTransactionViewSet

# Register API ViewSets to DRF Router
router = DefaultRouter()
router.register('customers', CustomerProfileViewSet, basename='customer')
router.register('categories', CategoryViewSet, basename='category')
router.register('businesses', BusinessProfileViewSet, basename='business')
router.register('portfolio', BusinessPortfolioViewSet, basename='portfolio')
router.register('leads', LeadViewSet, basename='lead')
router.register('reviews', ReviewViewSet, basename='review')
router.register('coin-wallets', UluCoinWalletViewSet, basename='coin-wallet')
router.register('coin-transactions', CoinTransactionHistoryViewSet, basename='coin-transaction')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('ads', AdvertisementViewSet, basename='ad')
router.register('subscriptions', SubscriptionViewSet, basename='subscription')
router.register('admin-users', AdminUserViewSet, basename='admin-user')
router.register('admin-businesses', AdminBusinessViewSet, basename='admin-business')
router.register('admin-logs', AdminSystemLogViewSet, basename='admin-log')
router.register('admin-apikeys', PlatformAPIKeyViewSet, basename='admin-apikey')
router.register('admin-settings', SiteSettingViewSet, basename='admin-setting')
router.register('admin-payments', AdminTransactionViewSet, basename='admin-payment')
router.register('admin-cms', ContentBlockViewSet, basename='admin-cms')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # REST API routing
    path('api/', include(router.urls)),
    
    # Public Config for Frontend API Keys
    path('api/config/', ConfigAPIView.as_view(), name='api_config'),
    
    # Super Admin Dashboard Stats
    path('api/admin-stats/', AdminDashboardStatsAPIView.as_view(), name='admin_stats'),
    
    # Super Admin Database Explorer
    path('api/admin-database/tables/', AdminDatabaseExplorerAPIView.as_view(), name='admin_db_tables'),
    path('api/admin-database/<str:table_name>/', AdminDatabaseExplorerAPIView.as_view(), name='admin_db_table_data'),
    
    # REST Framework Base auth endpoints
    path('api/auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Google Sign-In — direct id_token verification (no SocialApp DB record needed)
    path('api/auth/google/', google_auth_verify, name='google_auth_verify'),
    
    # Local Developer Mock login (bypasses Google keys for dev environment)
    path('api/auth/developer/', developer_mock_login, name='developer_mock_login'),
    
    # SimpleJWT tokens (if direct JWT generation is needed)
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # Community and Public Feed APIs
    path('api/community/', include('apps.community.urls')),
]

# Serve static/media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

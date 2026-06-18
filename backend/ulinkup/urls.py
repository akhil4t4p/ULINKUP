from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from apps.users.views import GoogleLogin, developer_mock_login

urlpatterns = [
    path('admin/', admin.site.urls),
    
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

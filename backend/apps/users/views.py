from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:5173/login'
    client_class = OAuth2Client

# Custom developer mock login to verify JWT generation and role routing locally
@api_view(['POST'])
@permission_classes([AllowAny])
def developer_mock_login(request):
    email = request.data.get('email')
    role = request.data.get('role', 'CUSTOMER')
    
    if not email:
        return Response({'error': 'Email is required'}, status=400)
        
    username = email.split('@')[0]
    
    # Get or create user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={'username': username, 'role': role}
    )
    
    # Update role if user toggled it in development login form
    if not created and user.role != role:
        user.role = role
        user.save()
        
    # Generate SimpleJWT token
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    })

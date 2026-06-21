from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.conf import settings
from .models import User


# ─── Helper: serialize user dict ─────────────────────────────────────────────
def _user_to_dict(user):
    """Return a consistent user dict used across all auth endpoints."""
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'google_avatar': getattr(user, 'google_avatar', '') or '',
        'avatar_preset': getattr(user, 'avatar_preset', '') or '',
        'ulu_coins': getattr(user, 'ulu_coins', 0),
        'referral_code': getattr(user, 'referral_code', '') or '',
        'is_staff': user.is_staff,
        'has_used_referral': user.referred_by is not None,
    }


# ─── Custom JWT Login (returns user data alongside tokens) ───────────────────
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends SimpleJWT serializer to include user details in the response."""
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = _user_to_dict(self.user)
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/token/
    Body: { "email": "...", "password": "..." }

    Returns: { "access": "...", "refresh": "...", "user": { ... } }
    """
    serializer_class = CustomTokenObtainPairSerializer


# ─── Standalone User Details Endpoint (header-based JWT) ─────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_details(request):
    """
    GET /api/auth/me/
    Returns the current authenticated user's details.
    Uses standard Bearer token auth from the Authorization header.
    """
    return Response(_user_to_dict(request.user), status=status.HTTP_200_OK)

# ─── Manual Referral Code Application ─────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_manual_referral(request):
    """
    POST /api/auth/referral/apply/
    Body: { "referral_code": "..." }
    Applies a referral code to the current user if they haven't used one yet.
    """
    if request.user.referred_by:
        return Response({'error': 'You have already used a referral code.'}, status=status.HTTP_400_BAD_REQUEST)
        
    code = request.data.get('referral_code')
    if not code:
        return Response({'error': 'Referral code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        inviter = User.objects.get(referral_code=code)
        if inviter == request.user:
            return Response({'error': 'You cannot use your own referral code.'}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({'error': 'Invalid referral code.'}, status=status.HTTP_400_BAD_REQUEST)
        
    from .referral import apply_referral
    apply_referral(request.user, code)
    
    # Refresh user to get updated coins and referred_by status
    request.user.refresh_from_db()
    
    return Response({'success': True, 'user': _user_to_dict(request.user)})



# ─── Google ID Token Verification ────────────────────────────────────────────
# This is the recommended approach for the Google Sign-In (GSI) flow:
# 1. Frontend loads Google Sign-In button using the Client ID
# 2. User clicks → Google returns a `credential` (JWT id_token)
# 3. Frontend sends that credential to this endpoint
# 4. We verify it with google-auth library (checks signature + expiry with Google)
# 5. We create/get the user and return a SimpleJWT access+refresh token pair

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth_verify(request):
    """
    POST /api/auth/google/
    Body: { "credential": "<google_id_token>", "role": "CUSTOMER" | "BUSINESS" }

    Verifies a Google Sign-In credential token and returns JWT tokens.
    Requires GOOGLE_CLIENT_ID to be set in backend/.env
    """
    credential = request.data.get('credential') or request.data.get('access_token')
    role = request.data.get('role', 'CUSTOMER').upper()
    print("REQUEST DATA:", request.data, flush=True)

    if not credential:
        return Response(
            {'error': 'Google credential token is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)

    if not client_id:
        return Response(
            {
                'error': 'Google authentication is not configured on this server.',
                'detail': 'Set GOOGLE_CLIENT_ID in backend/.env to enable real Google Sign-In.',
                'code': 'GOOGLE_NOT_CONFIGURED'
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    # Verify the credential token with Google
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            client_id,
            clock_skew_in_seconds=10
        )

        # Validate token issuer
        if idinfo.get('iss') not in ['accounts.google.com', 'https://accounts.google.com']:
            return Response(
                {'error': 'Invalid token issuer. Token must be from Google.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Validate token audience
        if idinfo.get('aud') != client_id:
            return Response(
                {'error': 'Token audience mismatch. Invalid Client ID.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Extract user info from verified token
        email = idinfo.get('email')
        name = idinfo.get('name', '')
        given_name = idinfo.get('given_name', '')
        google_id = idinfo.get('sub')
        email_verified = idinfo.get('email_verified', False)
        picture = idinfo.get('picture', '')

        if not email:
            return Response(
                {'error': 'Could not retrieve email from Google token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not email_verified:
            return Response(
                {'error': 'Google email is not verified. Please verify your Google account.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build a clean username from the Google name or email prefix
        username_base = given_name.lower().replace(' ', '') or email.split('@')[0]
        username = username_base[:30]  # Django max username length

        # Get or create the user account
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'role': role,
                'is_active': True,
            }
        )

        # If user already exists but role changed (e.g. switching from customer → business)
        # Prevent downgrading an ADMIN
        if not created and role and user.role != role and user.role != 'ADMIN':
            user.role = role
            user.save(update_fields=['role'])

        # Ensure username is set for existing users that may have empty username
        if not user.username:
            user.username = username
            user.save(update_fields=['username'])

        # Save Google profile picture URL
        if picture:
            user.google_avatar = picture
            user.save(update_fields=['google_avatar'])

        # Initialize wallet and check referral code if new user is created
        from apps.payments.models import UluCoinWallet
        UluCoinWallet.objects.get_or_create(user=user)

        if created:
            ref_code = request.data.get('referral_code') or request.data.get('ref')
            if ref_code:
                from .referral import apply_referral
                apply_referral(user, ref_code)

        # Refresh from DB to get updated coins, role, etc.
        user.refresh_from_db()

        # Generate JWT token pair
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        return Response({
            'access_token': str(access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'google_avatar': user.google_avatar or '',
                'avatar_preset': user.avatar_preset or '',
                'ulu_coins': user.ulu_coins,
                'referral_code': user.referral_code or '',
                'is_new': created,
            }
        }, status=status.HTTP_200_OK)

    except ValueError as e:
        # google-auth raises ValueError for invalid/expired tokens
        error_msg = str(e)
        print("GOOGLE AUTH ERROR:", error_msg, flush=True)
        if 'Token expired' in error_msg or 'expired' in error_msg.lower():
            return Response(
                {'error': 'Google token has expired. Please sign in again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        elif 'Wrong number of segments' in error_msg or 'Invalid token' in error_msg:
            return Response(
                {'error': 'Invalid Google credential format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {'error': f'Google token verification failed: {error_msg}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': 'Google authentication failed due to a server error.', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─── Allauth Social Login View (kept for backwards compatibility) ─────────────
class GoogleLogin(SocialLoginView):
    """
    Legacy dj-rest-auth Google login view.
    Requires a SocialApp database record with Client ID + Secret.
    Use google_auth_verify() above instead for simpler setup.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:5173/login'
    client_class = OAuth2Client


# ─── Developer Mock Login ─────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def developer_mock_login(request):
    """
    POST /api/auth/developer/
    Body: { "email": "test@example.com", "role": "CUSTOMER" | "BUSINESS" }

    Creates or retrieves a user without any password/OAuth.
    Only for local development testing — DISABLED in production.
    """
    # Block this endpoint in production
    if not settings.DEBUG:
        return Response(
            {'error': 'Developer login is not available in production.'},
            status=status.HTTP_403_FORBIDDEN
        )

    email = request.data.get('email')
    role = request.data.get('role', 'CUSTOMER').upper()

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    username = email.split('@')[0]

    # Get or create user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={'username': username, 'role': role}
    )

    # Update role if toggled during development login, but don't downgrade ADMIN
    if not created and user.role != role and user.role != 'ADMIN':
        user.role = role
        user.save(update_fields=['role'])

    # Initialize wallet and check referral code if new user is created
    from apps.payments.models import UluCoinWallet
    UluCoinWallet.objects.get_or_create(user=user)

    if created:
        ref_code = request.data.get('referral_code') or request.data.get('ref')
        if ref_code:
            from .referral import apply_referral
            apply_referral(user, ref_code)

    user.refresh_from_db()

    # Generate SimpleJWT token pair
    refresh = RefreshToken.for_user(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'ulu_coins': user.ulu_coins,
            'referral_code': user.referral_code or '',
            'is_new': created,
        }
    }, status=status.HTTP_200_OK)

from rest_framework.views import APIView
from apps.users.models import PlatformAPIKey

class ConfigAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        # Return non-secret keys that the frontend needs
        google_client = PlatformAPIKey.objects.filter(name='GOOGLE_CLIENT_ID').first()
        razorpay_key = PlatformAPIKey.objects.filter(name='RAZORPAY_KEY_ID').first()
        
        return Response({
            'VITE_GOOGLE_CLIENT_ID': google_client.key_value if google_client and not google_client.is_secret else None,
            'RAZORPAY_KEY_ID': razorpay_key.key_value if razorpay_key and not razorpay_key.is_secret else None,
        })

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from .models import Notification
from rest_framework.serializers import ModelSerializer

class NotificationSerializer(ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'message', 'is_read', 'created_at')

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'success'})


# ─── Custom Token Refresh with Safe User Validation ─────────────────────────────
# Subclasses dj-rest-auth's CookieTokenRefreshSerializer to handle deleted/non-existent
# users gracefully without throwing an unhandled User.DoesNotExist (500 error).
from rest_framework_simplejwt.views import TokenRefreshView
from dj_rest_auth.jwt_auth import CookieTokenRefreshSerializer, set_jwt_access_cookie, set_jwt_refresh_cookie
from dj_rest_auth.app_settings import api_settings as rest_auth_settings
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

class CustomCookieTokenRefreshSerializer(CookieTokenRefreshSerializer):
    def validate(self, attrs):
        attrs['refresh'] = self.extract_refresh_token()
        
        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.payload.get(jwt_settings.USER_ID_CLAIM, None)
        if user_id:
            try:
                user = get_user_model().objects.get(
                    **{jwt_settings.USER_ID_FIELD: user_id}
                )
            except get_user_model().DoesNotExist:
                raise ValidationError(
                    self.error_messages["no_active_account"],
                    "no_active_account",
                )

            if not jwt_settings.USER_AUTHENTICATION_RULE(user):
                raise AuthenticationFailed(
                    self.error_messages["no_active_account"],
                    "no_active_account",
                )

        data = {"access": str(refresh.access_token)}

        if jwt_settings.ROTATE_REFRESH_TOKENS:
            if jwt_settings.BLACKLIST_AFTER_ROTATION:
                try:
                    refresh.blacklist()
                except AttributeError:
                    pass

            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()
            refresh.outstand()

            data["refresh"] = str(refresh)

        return data

class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomCookieTokenRefreshSerializer

    def finalize_response(self, request, response, *args, **kwargs):
        if response.status_code == status.HTTP_200_OK and 'access' in response.data:
            set_jwt_access_cookie(response, response.data['access'])
            response.data['access_expiration'] = (timezone.now() + jwt_settings.ACCESS_TOKEN_LIFETIME)
        if response.status_code == status.HTTP_200_OK and 'refresh' in response.data:
            set_jwt_refresh_cookie(response, response.data['refresh'])
            if rest_auth_settings.JWT_AUTH_HTTPONLY:
                del response.data['refresh']
            else:
                response.data['refresh_expiration'] = (timezone.now() + jwt_settings.REFRESH_TOKEN_LIFETIME)
        return super().finalize_response(request, response, *args, **kwargs)


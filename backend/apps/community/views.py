import re
import urllib.parse

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes as perm_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import PublicPost, Community, Membership
from .serializers import PublicPostSerializer, CommunitySerializer


def _extract_youtube_id(url):
    """Extract YouTube video ID from various YouTube URL formats."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com/shorts/([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _extract_og_data(url):
    """Fetch Open Graph metadata from any URL."""
    try:
        import requests
        from bs4 import BeautifulSoup

        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; ULINKUPBot/1.0; +https://ulinkup.com)'
        }
        resp = requests.get(url, headers=headers, timeout=8, allow_redirects=True)
        soup = BeautifulSoup(resp.text, 'html.parser')

        def og(prop):
            tag = soup.find('meta', property=f'og:{prop}') or soup.find('meta', attrs={'name': prop})
            return tag.get('content', '').strip() if tag else ''

        title = og('title') or (soup.title.string.strip() if soup.title else '')
        description = og('description')
        image = og('image')
        domain = urllib.parse.urlparse(url).netloc.replace('www.', '')

        return {
            'og_title': title[:300],
            'og_description': description[:500],
            'og_image_url': image[:500],
            'og_domain': domain[:100],
        }
    except Exception:
        domain = urllib.parse.urlparse(url).netloc.replace('www.', '')
        return {'og_title': '', 'og_description': '', 'og_image_url': '', 'og_domain': domain}


class PublicPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for the public post feed.
    - Anyone can read (GET)
    - Only authenticated users can create posts
    - Only the author can delete their own post
    """
    serializer_class = PublicPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = PublicPost.objects.select_related('author', 'community').prefetch_related('likes')
        community_id = self.request.query_params.get('community')
        if community_id:
            qs = qs.filter(community_id=community_id)
            # Exclude posts from users blocked in this community
            if self.request.user.is_authenticated:
                blocked_users = Membership.objects.filter(
                    community_id=community_id, is_blocked=True
                ).values_list('user_id', flat=True)
                qs = qs.exclude(author_id__in=blocked_users)

        post_type = self.request.query_params.get('type')
        if post_type:
            if post_type.upper() == 'SOCIAL_MEDIA':
                from django.db.models import Q
                qs = qs.filter(Q(post_type='YOUTUBE') | Q(post_type='LINK'))
            else:
                qs = qs.filter(post_type=post_type.upper())

        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            from django.db.models import Q
            qs = qs.filter(Q(caption__icontains=search_query) | Q(og_title__icontains=search_query) | Q(og_description__icontains=search_query))
        return qs

    def perform_create(self, serializer):
        url = self.request.data.get('url', '').strip()
        has_image = bool(self.request.FILES.get('image'))
        extra_fields = {}

        if self.request.user.role == 'CUSTOMER':
            if has_image or url:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Customer accounts cannot upload images or URLs. Upgrade to a business account to unlock these features.")

        if url:
            # Auto-detect YouTube
            yt_id = _extract_youtube_id(url)
            if yt_id:
                extra_fields['post_type'] = 'YOUTUBE'
                extra_fields['youtube_id'] = yt_id
                extra_fields['og_domain'] = 'youtube.com'
            else:
                # Fetch OG data for any other URL
                og = _extract_og_data(url)
                extra_fields.update(og)
                if 'post_type' not in self.request.data or self.request.data.get('post_type') != 'IMAGE':
                    extra_fields['post_type'] = 'LINK'

        serializer.save(author=self.request.user, **extra_fields)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Toggle like on a post."""
        post = self.get_object()
        if post.likes.filter(pk=request.user.pk).exists():
            post.likes.remove(request.user)
            liked = False
        else:
            post.likes.add(request.user)
            liked = True
        return Response({'liked': liked, 'like_count': post.like_count})

    def destroy(self, request, *args, **kwargs):
        post = self.get_object()
        if post.author != request.user and not request.user.is_staff:
            return Response({'error': 'You can only delete your own posts.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class CommunityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for public groups/communities.
    - Anyone can list/view communities
    - Authenticated users can create communities
    - Only admins can update/delete
    """
    serializer_class = CommunitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Community.objects.filter(is_public=True).order_by('-created_at')
        search_query = self.request.query_params.get('search', '').strip()
        if search_query:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(category__icontains=search_query) |
                Q(location__icontains=search_query)
            )
        category = self.request.query_params.get('category', '').strip()
        if category:
            qs = qs.filter(category__iexact=category)
        return qs

    def perform_create(self, serializer):
        community = serializer.save(creator=self.request.user)
        # Creator automatically becomes admin member
        Membership.objects.create(
            user=self.request.user,
            community=community,
            role='ADMIN'
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def join(self, request, pk=None):
        """Join a community."""
        community = self.get_object()
        membership, created = Membership.objects.get_or_create(
            user=request.user,
            community=community,
            defaults={'role': 'MEMBER'}
        )
        if created:
            return Response({
                'joined': True,
                'member_count': community.member_count,
                'message': f'You joined {community.name}!'
            })
        return Response({'joined': False, 'message': 'You are already a member.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def leave(self, request, pk=None):
        """Leave a community."""
        community = self.get_object()
        deleted, _ = Membership.objects.filter(
            user=request.user,
            community=community
        ).delete()
        if deleted:
            return Response({
                'left': True,
                'member_count': community.member_count,
                'message': f'You left {community.name}.'
            })
        return Response({'left': False, 'message': 'You are not a member.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def block_user(self, request, pk=None):
        """Admin can block a user from a community."""
        community = self.get_object()
        
        # Verify requester is admin
        is_admin = Membership.objects.filter(
            community=community, user=request.user, role='ADMIN'
        ).exists()
        
        if not is_admin:
            return Response({'error': 'Only group admins can block users.'}, status=status.HTTP_403_FORBIDDEN)
            
        target_user_id = request.data.get('user_id')
        try:
            membership = Membership.objects.get(community=community, user_id=target_user_id)
            if membership.role == 'ADMIN':
                return Response({'error': 'Cannot block an admin.'}, status=status.HTTP_400_BAD_REQUEST)
                
            membership.is_blocked = not membership.is_blocked # Toggle
            membership.blocked_by = request.user if membership.is_blocked else None
            membership.save()
            
            action_text = "blocked" if membership.is_blocked else "unblocked"
            return Response({'success': True, 'message': f'User has been {action_text}.'})
        except Membership.DoesNotExist:
            return Response({'error': 'User is not a member of this community.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def members(self, request, pk=None):
        """List members of a community."""
        community = self.get_object()
        memberships = community.membership_set.select_related('user').order_by('role', 'joined_at')
        data = [
            {
                'username': m.user.username or m.user.email.split('@')[0],
                'email': m.user.email,
                'role': m.role,
                'joined_at': m.joined_at,
            }
            for m in memberships
        ]
        return Response(data)


@api_view(['GET'])
@perm_classes([AllowAny])
def link_preview(request):
    """
    GET /api/community/link-preview/?url=<url>
    Returns Open Graph metadata for any URL.
    Used by the frontend to preview links before posting.
    """
    url = request.query_params.get('url', '').strip()
    if not url:
        return Response({'error': 'url parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    # YouTube shortcut
    yt_id = _extract_youtube_id(url)
    if yt_id:
        return Response({
            'type': 'YOUTUBE',
            'youtube_id': yt_id,
            'og_title': 'YouTube Video',
            'og_domain': 'youtube.com',
            'og_description': '',
            'og_image_url': f'https://img.youtube.com/vi/{yt_id}/hqdefault.jpg',
        })

    og = _extract_og_data(url)
    return Response({
        'type': 'LINK',
        'youtube_id': '',
        **og,
    })


@api_view(['POST'])
@perm_classes([IsAuthenticated])
def upload_chat_image(request):
    """
    POST /api/community/chat/upload_image/
    Uploads an image for the chat and returns its URL.
    """
    image_file = request.FILES.get('image')
    if not image_file:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    if request.user.role == 'CUSTOMER':
        return Response({'error': 'Customer accounts cannot upload images. Please upgrade to a business account.'}, status=status.HTTP_403_FORBIDDEN)

    # We use a dummy model just to utilize the default storage easily, or we can just save it.
    from django.core.files.storage import default_storage
    import uuid
    import os

    ext = os.path.splitext(image_file.name)[1]
    filename = f"chat_images/{uuid.uuid4()}{ext}"
    saved_path = default_storage.save(filename, image_file)
    url = default_storage.url(saved_path)

    return Response({'image_url': url})


@api_view(['GET'])
@perm_classes([IsAuthenticated])
def chat_history(request, group_id):
    """
    GET /api/community/chat/history/<group_id>/
    Returns recent chat history for a group.
    """
    from .models import ChatMessage, Membership
    
    # Get blocked users in this group
    blocked_users = Membership.objects.filter(
        community_id=group_id, is_blocked=True
    ).values_list('user_id', flat=True)

    messages = ChatMessage.objects.filter(group_id=group_id).exclude(
        sender_id__in=blocked_users
    ).select_related('sender').order_by('-created_at')[:50]
    
    data = []
    for m in reversed(messages):
        data.append({
            'id': m.id,
            'message': m.content,
            'image_url': m.image.url if m.image else '',
            'gif_url': m.gif_url,
            'sender': m.sender.username or m.sender.email.split('@')[0],
            'sender_id': m.sender.id,
            'created_at': m.created_at.isoformat()
        })
        
    return Response(data)

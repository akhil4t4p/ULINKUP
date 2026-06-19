from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PublicPostViewSet, CommunityViewSet, link_preview, chat_history, upload_chat_image

router = DefaultRouter()
router.register('posts', PublicPostViewSet, basename='public-posts')
router.register('groups', CommunityViewSet, basename='public-groups')

urlpatterns = [
    path('link-preview/', link_preview, name='link-preview'),
    path('chat/history/<int:group_id>/', chat_history, name='chat-history'),
    path('chat/upload_image/', upload_chat_image, name='upload-chat-image'),
    path('', include(router.urls)),
]

from rest_framework import serializers
from .models import PublicPost, Community, Membership


class MembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Membership
        fields = ('id', 'user_email', 'username', 'role', 'joined_at')


class CommunitySerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    creator_email = serializers.EmailField(source='creator.email', read_only=True)
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    is_member = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = (
            'id', 'name', 'description', 'avatar',
            'category', 'location', 'rules',
            'is_public', 'created_at',
            'creator_email', 'creator_name',
            'member_count', 'is_member', 'is_admin'
        )
        read_only_fields = ('id', 'created_at', 'creator_email', 'creator_name')

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.membership_set.filter(user=request.user).exists()
        return False

    def get_is_admin(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.membership_set.filter(user=request.user, role='ADMIN').exists()
        return False


class PublicPostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_email = serializers.SerializerMethodField()
    like_count = serializers.IntegerField(read_only=True)
    is_liked = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True, allow_null=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = PublicPost
        fields = (
            'id', 'post_type', 'caption',
            'image', 'url',
            'og_title', 'og_description', 'og_image_url', 'og_domain',
            'youtube_id',
            'author_name', 'author_email',
            'community', 'community_name',
            'like_count', 'is_liked',
            'created_at',
        )
        read_only_fields = (
            'id', 'created_at', 'author_name', 'author_email',
            'og_title', 'og_description', 'og_image_url', 'og_domain',
            'youtube_id', 'like_count', 'is_liked',
        )

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.username or obj.author.email.split('@')[0]
        return 'Anonymous'

    def get_author_email(self, obj):
        return obj.author.email if obj.author else None

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(pk=request.user.pk).exists()
        return False

from django.db import models
from django.conf import settings


class Community(models.Model):
    """A public group that anyone can create and join."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_communities'
    )
    avatar = models.ImageField(upload_to='community/avatars/', blank=True, null=True)
    category = models.CharField(max_length=50, default='General', db_index=True)
    location = models.CharField(max_length=150, blank=True, db_index=True)
    rules = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='Membership',
        through_fields=('community', 'user'),
        related_name='communities'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Communities'

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.membership_set.count()


class Membership(models.Model):
    ROLE_CHOICES = [('ADMIN', 'Admin'), ('MEMBER', 'Member')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MEMBER')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    # Blocking feature
    is_blocked = models.BooleanField(default=False)
    blocked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name='blocked_memberships'
    )
    blocked_reason = models.TextField(blank=True)

    class Meta:
        unique_together = ('user', 'community')

    def __str__(self):
        return f'{self.user.email} in {self.community.name} ({self.role})'


class PublicPost(models.Model):
    POST_TYPES = [
        ('TEXT', 'Text / Pamphlet'),
        ('IMAGE', 'Image'),
        ('YOUTUBE', 'YouTube Video'),
        ('LINK', 'Link Preview'),
    ]

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='public_posts'
    )
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='posts'
    )

    post_type = models.CharField(max_length=10, choices=POST_TYPES, default='TEXT')

    # Content fields
    caption = models.TextField(blank=True)
    image = models.ImageField(upload_to='community/posts/', blank=True, null=True)

    # Link / URL fields
    url = models.URLField(blank=True)
    og_title = models.CharField(max_length=300, blank=True)
    og_description = models.TextField(blank=True)
    og_image_url = models.URLField(blank=True)
    og_domain = models.CharField(max_length=100, blank=True)

    # YouTube specific
    youtube_id = models.CharField(max_length=20, blank=True)

    # Engagement
    likes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='liked_posts',
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        author_str = self.author.email if self.author else 'Anonymous'
        return f'[{self.post_type}] by {author_str} at {self.created_at:%Y-%m-%d %H:%M}'

    @property
    def like_count(self):
        return self.likes.count()


class ChatMessage(models.Model):
    """Real-time chat messages for community groups."""
    group = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to='chat_images/', blank=True, null=True)
    gif_url = models.URLField(blank=True, max_length=500)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.email} in {self.group.name}: {self.content[:20]}"

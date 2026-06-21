from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('CUSTOMER', 'Customer'),
        ('BUSINESS', 'Business'),
        ('ADMIN', 'Admin'),
    )
    
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='CUSTOMER')
    email = models.EmailField(unique=True)
    nickname = models.CharField(max_length=50, blank=True)
    avatar = models.ImageField(upload_to='users/avatars/', blank=True, null=True)
    banner = models.ImageField(upload_to='users/banners/', blank=True, null=True)
    google_avatar = models.URLField(max_length=500, blank=True, null=True, help_text='Google profile picture URL')
    avatar_preset = models.CharField(max_length=50, blank=True, null=True, help_text='Preset avatar name e.g. male_bear')
    
    # Referral System fields
    referral_code = models.CharField(max_length=20, unique=True, blank=True, null=True, db_index=True)
    referred_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='referees')
    ulu_coins = models.PositiveIntegerField(default=0, help_text='Cached balance from UluCoinWallet')
    
    # Profile Optimization Fields
    phone_number = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    business_email = models.EmailField(blank=True, null=True)
    instagram_url = models.URLField(max_length=500, blank=True)
    youtube_url = models.URLField(max_length=500, blank=True)
    facebook_url = models.URLField(max_length=500, blank=True)
    telegram_url = models.URLField(max_length=500, blank=True)
    tiktok_url = models.URLField(max_length=500, blank=True)
    is_profile_optimized = models.BooleanField(default=False)

    # Customise USERNAME_FIELD to use email for logins
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import random
            import string
            base = self.username.upper().replace(' ', '')[:5] if self.username else 'USER'
            if not base:
                base = 'USER'
            while True:
                suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
                candidate = f"{base}{suffix}"
                # Using a raw check or simple queryset check
                if not User.objects.filter(referral_code=candidate).exists():
                    self.referral_code = candidate
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} - {self.role}"

class UsernameChangeLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='username_changes')
    changed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} changed at {self.changed_at}"

class SystemLog(models.Model):
    ACTION_CHOICES = (
        ('LOGIN', 'User Login'),
        ('PAYMENT', 'Payment Created'),
        ('UPGRADE', 'Plan Upgraded'),
        ('ADMIN', 'Admin Action'),
        ('ERROR', 'System Error'),
    )
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        return f"[{self.action_type}] {self.description[:50]}"

class PlatformAPIKey(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="e.g., RAZORPAY_KEY_ID")
    service_name = models.CharField(max_length=100, help_text="e.g., Razorpay")
    key_value = models.CharField(max_length=500)
    is_secret = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.service_name} - {self.name}"

class SiteSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value[:30]}"

class ContentBlock(models.Model):
    key = models.CharField(max_length=100, unique=True, help_text="Unique identifier for the frontend to fetch.")
    section = models.CharField(max_length=50, default='General', help_text="e.g. LandingPage, Footer, About")
    content = models.TextField(help_text="The actual text/HTML content.")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.section} - {self.key}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.email}: {self.message[:30]}"



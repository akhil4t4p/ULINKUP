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
    
    # Customise USERNAME_FIELD to use email for logins
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

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



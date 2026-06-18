from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

class BusinessProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='business_profile'
    )
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='businesses'
    )
    about = models.TextField(blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    experience = models.PositiveIntegerField(default=0)
    location = models.CharField(max_length=255, db_index=True)
    is_available = models.BooleanField(default=True, db_index=True)
    profile_photo = models.ImageField(upload_to='businesses/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['category', 'is_available']),
        ]

    def __str__(self):
        return f"Business: {self.user.email} ({self.category.name if self.category else 'No Category'})"

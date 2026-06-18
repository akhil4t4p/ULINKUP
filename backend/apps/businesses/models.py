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
    work_timings = models.CharField(max_length=255, default='Mon-Fri: 9:00 AM - 6:00 PM', blank=True)
    service_areas = models.CharField(max_length=255, default='Local Area Only', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['category', 'is_available']),
            models.Index(fields=['experience']),
            models.Index(fields=['hourly_rate']),
            models.Index(fields=['location']),
        ]

    def __str__(self):
        return f"Business: {self.user.email} ({self.category.name if self.category else 'No Category'})"

class BusinessPortfolio(models.Model):
    business = models.ForeignKey(
        BusinessProfile, 
        on_delete=models.CASCADE, 
        related_name='portfolio_items'
    )
    image = models.ImageField(upload_to='portfolios/')
    title = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Portfolio {self.id} for {self.business.user.username}"

class Lead(models.Model):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='leads_sent'
    )
    business = models.ForeignKey(
        BusinessProfile, 
        on_delete=models.CASCADE, 
        related_name='leads_received'
    )
    service_description = models.TextField()
    location = models.CharField(max_length=255)
    is_locked = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        status = "Locked" if self.is_locked else "Unlocked"
        return f"Lead from {self.customer.username} for {self.business.user.username} - {status}"

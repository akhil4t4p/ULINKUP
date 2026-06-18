from django.db import models
from apps.businesses.models import BusinessProfile, Category

class Advertisement(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
    )

    business = models.ForeignKey(
        BusinessProfile, 
        on_delete=models.CASCADE, 
        related_name='advertisements'
    )
    title = models.CharField(max_length=200)
    banner_image = models.ImageField(upload_to='ads/')
    target_category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='ads'
    )
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    clicks = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ad: {self.title} by {self.business.user.username} ({self.status})"

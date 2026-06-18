from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.customers.models import CustomerProfile
from apps.businesses.models import BusinessProfile

class Review(models.Model):
    customer = models.ForeignKey(
        CustomerProfile, 
        on_delete=models.CASCADE, 
        related_name='reviews_written'
    )
    business = models.ForeignKey(
        BusinessProfile, 
        on_delete=models.CASCADE, 
        related_name='reviews_received'
    )
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review ({self.rating}★) by {self.customer.user.username} for {self.business.user.username}"

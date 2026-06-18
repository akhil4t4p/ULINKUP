from django.db import models
from django.conf import settings

class Subscription(models.Model):
    PLAN_CHOICES = (
        ('SILVER', 'Silver Plan'),
        ('GOLD', 'Gold Plan'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='subscriptions'
    )
    plan_type = models.CharField(max_length=15, choices=PLAN_CHOICES)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True, db_index=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan_type} (Active: {self.is_active})"

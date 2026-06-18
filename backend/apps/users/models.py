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
    
    # Customise USERNAME_FIELD to use email for logins
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} - {self.role}"

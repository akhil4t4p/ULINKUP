import os
import django
import random
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ulinkup.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.businesses.models import Category, BusinessProfile
from apps.payments.models import Transaction, UluCoinWallet
from apps.users.models import SystemLog

User = get_user_model()

print("Creating dummy data...")

# Create Categories
categories = ['Plumber', 'Electrician', 'Tutor', 'Photographer', 'Cleaner']
cats = []
for c in categories:
    cat, _ = Category.objects.get_or_create(name=c.upper(), defaults={'description': f'Expert {c}'})
    cats.append(cat)

# Create Dummy Users & Businesses
for i in range(15):
    email = f"dummy_user_{i}@example.com"
    role = 'BUSINESS' if i < 8 else 'CUSTOMER'
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': f"dummy_{i}",
            'role': role,
            'is_active': True,
        }
    )
    
    # Backdate joined date for charts
    user.date_joined = timezone.now() - timedelta(days=random.randint(0, 6))
    user.save(update_fields=['date_joined'])

    if role == 'BUSINESS':
        plan = random.choice(['FREE', 'SILVER', 'GOLD'])
        biz, _ = BusinessProfile.objects.get_or_create(
            user=user,
            defaults={
                'category': random.choice(cats),
                'plan_tier': plan,
                'verified': random.choice([True, False]),
                'is_featured': True if plan == 'GOLD' else False,
                'location': random.choice(['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi']),
                'experience': random.randint(1, 10),
                'hourly_rate': Decimal(random.randint(200, 1500))
            }
        )

# Create Dummy Transactions (Revenue) for last 7 days
for i in range(25):
    days_ago = random.randint(0, 6)
    t = Transaction.objects.create(
        user=User.objects.order_by('?').first(),
        amount=Decimal(random.choice([15, 29, 49, 99, 199, 499])),
        transaction_type=random.choice(['COIN_RECHARGE', 'SUBSCRIPTION']),
        status='SUCCESS'
    )
    t.created_at = timezone.now() - timedelta(days=days_ago)
    t.save(update_fields=['created_at'])

# Create Dummy Logs
action_choices = ['LOGIN', 'PAYMENT', 'UPGRADE', 'ADMIN', 'ERROR']
for i in range(20):
    days_ago = random.randint(0, 3)
    log = SystemLog.objects.create(
        user=User.objects.order_by('?').first(),
        action_type=random.choice(action_choices),
        description=f"Automated simulated action number {i}",
        ip_address=f"192.168.1.{random.randint(1, 255)}"
    )
    log.created_at = timezone.now() - timedelta(days=days_ago)
    log.save(update_fields=['created_at'])

print("Dummy data successfully populated!")

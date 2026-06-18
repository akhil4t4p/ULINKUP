from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from apps.customers.models import CustomerProfile
from apps.businesses.models import Category, BusinessProfile
from apps.reviews.models import Review

User = get_user_model()

class ReviewTests(APITestCase):
    def setUp(self):
        # Setup Customer
        self.customer_user = User.objects.create_user(
            username='customer', 
            email='customer@example.com', 
            password='password123',
            role='CUSTOMER'
        )
        self.customer_profile = CustomerProfile.objects.create(
            user=self.customer_user
        )

        # Setup Business
        self.business_user = User.objects.create_user(
            username='business', 
            email='business@example.com', 
            password='password123',
            role='BUSINESS'
        )
        self.business_profile = BusinessProfile.objects.create(
            user=self.business_user,
            location='Mumbai'
        )

        self.client.force_authenticate(user=self.customer_user)

    def test_create_review_success(self):
        url = '/api/reviews/'
        data = {
            'business': self.business_profile.id,
            'rating': 5,
            'comment': 'Amazing service, very clean and prompt work!'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Review.objects.filter(customer=self.customer_profile, business=self.business_profile, rating=5).exists())

    def test_create_review_invalid_rating_low(self):
        url = '/api/reviews/'
        data = {
            'business': self.business_profile.id,
            'rating': 0, # Should fail (rating must be >= 1)
            'comment': 'Bad service'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_review_invalid_rating_high(self):
        url = '/api/reviews/'
        data = {
            'business': self.business_profile.id,
            'rating': 6, # Should fail (rating must be <= 5)
            'comment': 'Incredible!'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

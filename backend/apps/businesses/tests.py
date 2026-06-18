from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from apps.businesses.models import Category, BusinessProfile

User = get_user_model()

class BusinessTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='provider', 
            email='provider@example.com', 
            password='password123',
            role='BUSINESS'
        )
        self.category = Category.objects.create(name='Plumber', slug='plumber')
        self.profile = BusinessProfile.objects.create(
            user=self.user,
            category=self.category,
            experience=5,
            hourly_rate=Decimal('200.00'),
            location='Mumbai'
        )
        self.client.force_authenticate(user=self.user)

    def test_update_profile_hourly_rate_valid(self):
        url = '/api/businesses/me/'
        response = self.client.patch(url, {'hourly_rate': '250.00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.hourly_rate, Decimal('250.00'))

    def test_update_profile_hourly_rate_invalid(self):
        url = '/api/businesses/me/'
        response = self.client.patch(url, {'hourly_rate': '-50.00'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_search_business_profiles(self):
        url = '/api/businesses/'
        # Search by category
        response = self.client.get(url, {'category': 'Plumber'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check that our plumber is in results
        results = response.data.get('results', response.data)
        self.assertTrue(any(p['id'] == self.profile.id for p in results))

        # Search by experience filter
        response = self.client.get(url, {'min_exp': 3})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertTrue(any(p['id'] == self.profile.id for p in results))

        response = self.client.get(url, {'min_exp': 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertFalse(any(p['id'] == self.profile.id for p in results))

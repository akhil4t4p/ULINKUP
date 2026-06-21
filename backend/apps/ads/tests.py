from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from apps.payments.models import Transaction
from apps.businesses.models import BusinessProfile, Category
from apps.ads.models import Advertisement

User = get_user_model()

class AdvertisementTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='businessuser', 
            email='business@example.com', 
            password='password123',
            role='BUSINESS'
        )
        self.business_profile = BusinessProfile.objects.create(
            user=self.user,
            location='Test Location'
        )
        self.category, _ = Category.objects.get_or_create(slug='tutor', defaults={'name': 'TUTOR'})
        self.client.force_authenticate(user=self.user)

    def test_create_ad_success(self):
        url = '/api/ads/'
        data = {
            'title': 'Test Ad Campaign',
            'target_category': self.category.id,
            'budget': '150.00',
            'start_date': '2026-06-19',
            'end_date': '2026-06-25'
        }
        # Note: we are passing banner_image mock or empty since banner_image might be required.
        # Let's see if banner_image is required in Advertisement model:
        # yes: banner_image = models.ImageField(upload_to='ads/')
        # To bypass actual file upload in simple unit test, we can use SimpleUploadedFile
        from django.core.files.uploadedfile import SimpleUploadedFile
        gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9'
            b'\x04\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00'
            b'\x00\x02\x02\x4c\x01\x00\x3b'
        )
        banner_file = SimpleUploadedFile('banner.gif', gif, content_type='image/gif')
        data['banner_image'] = banner_file

        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Transaction.objects.filter(user=self.user, transaction_type='ADVERTISEMENT', amount=Decimal('150.00')).exists())

    # Removed test_create_ad_insufficient_funds as Wallet is removed

    def test_create_ad_negative_budget(self):
        url = '/api/ads/'
        from django.core.files.uploadedfile import SimpleUploadedFile
        banner_file = SimpleUploadedFile('banner.gif', b'gif', content_type='image/gif')
        data = {
            'title': 'Test Ad Campaign',
            'target_category': self.category.id,
            'budget': '-50.00', # Negative budget should fail validation
            'start_date': '2026-06-19',
            'end_date': '2026-06-25',
            'banner_image': banner_file
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ad_telemetry(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        banner_file = SimpleUploadedFile('banner.gif', b'gif', content_type='image/gif')
        ad = Advertisement.objects.create(
            business=self.business_profile,
            title='Test Ad',
            target_category=self.category,
            budget=Decimal('100.00'),
            start_date='2026-06-19',
            end_date='2026-06-25',
            banner_image=banner_file
        )
        
        # Test click increment
        click_url = f'/api/ads/{ad.id}/click_increment/'
        response = self.client.post(click_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ad.refresh_from_db()
        self.assertEqual(ad.clicks, 1)

        # Test view increment
        view_url = f'/api/ads/{ad.id}/view_increment/'
        response = self.client.post(view_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ad.refresh_from_db()
        self.assertEqual(ad.views, 1)

    def test_delete_ad_refund(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        banner_file = SimpleUploadedFile('banner.gif', b'gif', content_type='image/gif')
        ad = Advertisement.objects.create(
            business=self.business_profile,
            title='Test Ad',
            target_category=self.category,
            budget=Decimal('100.00'),
            start_date='2026-06-19',
            end_date='2026-06-25',
            banner_image=banner_file
        )
        # Deleting the ad should record a negative transaction
        delete_url = f'/api/ads/{ad.id}/'
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(Transaction.objects.filter(user=self.user, transaction_type='ADVERTISEMENT', amount=Decimal('-100.00')).exists())

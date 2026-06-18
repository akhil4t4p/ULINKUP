from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from apps.payments.models import Wallet, Transaction

User = get_user_model()

class WalletTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com', 
            password='password123'
        )
        self.client.force_authenticate(user=self.user)
        self.wallet, created = Wallet.objects.get_or_create(user=self.user, defaults={'balance': Decimal('100.00')})

    def test_recharge_wallet_success(self):
        url = '/api/wallets/recharge/'
        response = self.client.post(url, {'amount': '50.00'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.balance, Decimal('150.00'))
        self.assertTrue(Transaction.objects.filter(user=self.user, transaction_type='RECHARGE', status='SUCCESS').exists())

    def test_recharge_wallet_invalid_amount(self):
        url = '/api/wallets/recharge/'
        response = self.client.post(url, {'amount': '-50.00'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        response = self.client.post(url, {'amount': 'invalid_string'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_razorpay_order_valid(self):
        url = '/api/wallets/create_razorpay_order/'
        response = self.client.post(url, {'amount': '500.00', 'type': 'RECHARGE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('order_id', response.data)
        self.assertTrue(Transaction.objects.filter(user=self.user, status='PENDING').exists())

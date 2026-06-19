from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from decimal import Decimal
from apps.payments.models import UluCoinWallet, CoinTransactionHistory, Transaction

User = get_user_model()

class UluCoinWalletTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com', 
            password='password123'
        )
        self.client.force_authenticate(user=self.user)
        self.wallet, created = UluCoinWallet.objects.get_or_create(user=self.user, defaults={'coins': 100})

    def test_create_razorpay_order_valid(self):
        url = '/api/coin-wallets/create_razorpay_order/'
        response = self.client.post(url, {'amount': '15.00', 'type': 'RECHARGE', 'plan_type': 'STARTER'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('order_id', response.data)
        self.assertTrue(Transaction.objects.filter(user=self.user, status='PENDING').exists())

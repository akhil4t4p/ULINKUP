from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from apps.payments.models import UluCoinWallet, CoinTransactionHistory, ReferralTransaction
from apps.users.models import Notification

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

    def test_create_razorpay_order_fallback(self):
        # Even if Razorpay keys are not configured, our ViewSet handles fallback graciously
        from apps.users.models import PlatformAPIKey
        PlatformAPIKey.objects.create(name='RAZORPAY_KEY_ID', service_name='Razorpay', key_value='test_key')
        PlatformAPIKey.objects.create(name='RAZORPAY_KEY_SECRET', service_name='Razorpay', key_value='test_secret')
        
        url = '/api/coin-wallets/create_razorpay_order/'
        response = self.client.post(url, {'amount': '15.00', 'type': 'RECHARGE', 'plan_type': 'STARTER'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('order_id', response.data)

class ReferralSystemTests(APITestCase):
    def setUp(self):
        self.inviter = User.objects.create_user(
            username='inviter',
            email='inviter@example.com',
            password='password123'
        )
        self.new_user = User.objects.create_user(
            username='referee',
            email='referee@example.com',
            password='password123'
        )

    def test_referral_code_generated(self):
        # Verify that referral codes are automatically generated upon user creation
        self.assertIsNotNone(self.inviter.referral_code)
        self.assertTrue(len(self.inviter.referral_code) > 5)
        self.assertTrue(self.inviter.referral_code.startswith('INVIT'))

    def test_apply_referral_success(self):
        # Set up a new user signup with inviter's referral code
        from apps.users.referral import apply_referral
        
        # Verify initial states
        self.assertEqual(self.inviter.ulu_coins, 0)
        self.assertEqual(self.new_user.ulu_coins, 0)

        # Apply the referral
        apply_referral(self.new_user, self.inviter.referral_code)

        # Refresh from database
        self.inviter.refresh_from_db()
        self.new_user.refresh_from_db()

        # Check coin distributions
        self.assertEqual(self.inviter.ulu_coins, 25)
        self.assertEqual(self.new_user.ulu_coins, 500)

        # Check transactions list
        self.assertTrue(ReferralTransaction.objects.filter(inviter=self.inviter, new_user=self.new_user, status='SUCCESS').exists())

        # Check notifications
        self.assertTrue(Notification.objects.filter(user=self.inviter).exists())
        self.assertTrue(Notification.objects.filter(user=self.new_user).exists())

    def test_apply_referral_self(self):
        # Set up self-referral
        from apps.users.referral import apply_referral
        apply_referral(self.inviter, self.inviter.referral_code)

        self.inviter.refresh_from_db()
        self.assertEqual(self.inviter.ulu_coins, 0)
        self.assertFalse(ReferralTransaction.objects.filter(new_user=self.inviter).exists())

    def test_apply_referral_invalid(self):
        # Set up invalid/expired code
        from apps.users.referral import apply_referral
        apply_referral(self.new_user, 'INVALIDCODE')

        self.inviter.refresh_from_db()
        self.new_user.refresh_from_db()
        self.assertEqual(self.inviter.ulu_coins, 0)
        self.assertEqual(self.new_user.ulu_coins, 0)
        self.assertFalse(ReferralTransaction.objects.exists())

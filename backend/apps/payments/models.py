from django.db import models
from django.conf import settings

class UluCoinWallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='coin_wallet'
    )
    coins = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Wallet ({self.coins} ULU Coins)"

class CoinTransactionHistory(models.Model):
    TRANSACTION_TYPES = (
        ('RECHARGE', 'Purchased ULU Coins'),
        ('SPEND', 'Spent ULU Coins'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='coin_transactions'
    )
    transaction_type = models.CharField(max_length=15, choices=TRANSACTION_TYPES)
    coins_amount = models.PositiveIntegerField()
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type}: {self.coins_amount} coins for {self.user.username}"

# Keep legacy Transaction model for Business Subscriptions (actual money transactions)
class Transaction(models.Model):
    TYPE_CHOICES = (
        ('SUBSCRIPTION', 'Business Subscription Purchase'),
        ('COIN_RECHARGE', 'ULU Coins Recharge'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='transactions'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    
    # Razorpay specific fields
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=255, blank=True, null=True)
    
    # Store what they bought (e.g., 'SILVER', 'GOLD', or '100' for coins)
    item_reference = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} of ₹{self.amount} for {self.user.username} - {self.status}"

class ReferralTransaction(models.Model):
    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='referral_invitations'
    )
    new_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='referral_received'
    )
    reward_to_inviter = models.PositiveIntegerField(default=25)
    reward_to_new_user = models.PositiveIntegerField(default=500)
    status = models.CharField(max_length=15, default='SUCCESS')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Referral: {self.new_user.username} referred by {self.inviter.username} - {self.status}"

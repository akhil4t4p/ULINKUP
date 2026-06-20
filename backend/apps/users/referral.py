from django.db import transaction
from django.contrib.auth import get_user_model
from apps.payments.models import UluCoinWallet, CoinTransactionHistory, ReferralTransaction
from apps.users.models import Notification, SystemLog

User = get_user_model()

def apply_referral(new_user, referral_code):
    """
    Validates a referral code, sets referred_by relationship, and awards coins.
    This is executed atomically to prevent race conditions.
    """
    if not referral_code:
        return
    
    referral_code = referral_code.strip()
    if not referral_code:
        return

    # 1. Look up the inviter
    try:
        inviter = User.objects.get(referral_code=referral_code)
    except User.DoesNotExist:
        # Ignore invalid/expired codes gracefully
        return

    # 2. Prevent self-referrals
    if inviter == new_user:
        return

    # 3. Check if user is already referred
    if new_user.referred_by:
        return

    # 4. Atomic transaction block to award coins and save records
    with transaction.atomic():
        # Use select_for_update on the inviter to prevent concurrent modification
        inviter_locked = User.objects.select_for_update().get(pk=inviter.pk)
        new_user_locked = User.objects.select_for_update().get(pk=new_user.pk)

        # Check if a referral transaction already exists for this new user (anti-abuse double check)
        if ReferralTransaction.objects.filter(new_user=new_user_locked).exists():
            return

        # Set referred_by on the new user
        new_user_locked.referred_by = inviter_locked
        new_user_locked.save(update_fields=['referred_by'])

        # New User Reward (500 ULU Coins)
        new_wallet, _ = UluCoinWallet.objects.get_or_create(user=new_user_locked)
        new_wallet.coins += 500
        new_wallet.save()

        # Update cached ulu_coins field
        new_user_locked.ulu_coins = new_wallet.coins
        new_user_locked.save(update_fields=['ulu_coins'])

        # Record new user transaction history
        CoinTransactionHistory.objects.create(
            user=new_user_locked,
            transaction_type='RECHARGE',
            coins_amount=500,
            description=f"Referral sign-up reward (Referred by {inviter_locked.email})"
        )

        # Inviter Reward (25 ULU Coins)
        inviter_wallet, _ = UluCoinWallet.objects.get_or_create(user=inviter_locked)
        inviter_wallet.coins += 25
        inviter_wallet.save()

        # Update inviter's cached ulu_coins field
        inviter_locked.ulu_coins = inviter_wallet.coins
        inviter_locked.save(update_fields=['ulu_coins'])

        # Record inviter transaction history
        CoinTransactionHistory.objects.create(
            user=inviter_locked,
            transaction_type='RECHARGE',
            coins_amount=25,
            description=f"Referral reward for inviting {new_user_locked.email}"
        )

        # Create ReferralTransaction audit record
        ReferralTransaction.objects.create(
            inviter=inviter_locked,
            new_user=new_user_locked,
            reward_to_inviter=25,
            reward_to_new_user=500,
            status='SUCCESS'
        )

        # Create notifications
        Notification.objects.create(
            user=new_user_locked,
            message="🎉 Welcome to ULINKUP!\nYou received 500 ULU Coins for joining with a referral code."
        )

        Notification.objects.create(
            user=inviter_locked,
            message="🎉 Referral Successful!\nYou earned 25 ULU Coins because a new user joined using your invitation."
        )

        # Log system action
        SystemLog.objects.create(
            user=new_user_locked,
            action_type='UPGRADE',
            description=f"Referral completed. Inviter: {inviter_locked.email}, New User: {new_user_locked.email}."
        )

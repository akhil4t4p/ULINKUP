from django.contrib import admin
from .models import UluCoinWallet, CoinTransactionHistory, Transaction

@admin.register(UluCoinWallet)
class UluCoinWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'coins', 'updated_at')
    
@admin.register(CoinTransactionHistory)
class CoinTransactionHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_type', 'coins_amount', 'created_at')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('created_at',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'transaction_type', 'status', 'razorpay_order_id', 'created_at')
    list_filter = ('transaction_type', 'status', 'created_at')
    search_fields = ('razorpay_order_id', 'razorpay_payment_id', 'user__email', 'user__username')
    readonly_fields = ('created_at',)

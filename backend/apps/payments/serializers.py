from rest_framework import serializers
from .models import UluCoinWallet, CoinTransactionHistory, Transaction

class UluCoinWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = UluCoinWallet
        fields = ('id', 'coins', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

class CoinTransactionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CoinTransactionHistory
        fields = ('id', 'transaction_type', 'coins_amount', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('id', 'amount', 'transaction_type', 'status', 'reference_id', 'created_at')
        read_only_fields = ('id', 'created_at')

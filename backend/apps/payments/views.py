from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Wallet, Transaction
from .serializers import WalletSerializer, TransactionSerializer
from decimal import Decimal

class WalletViewSet(viewsets.ModelViewSet):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only access their own wallet details
        return Wallet.objects.filter(user=self.request.user)

    # Custom action to recharge wallet (simulates payment checkout)
    @action(detail=False, methods=['post'])
    def recharge(self, request):
        amount = request.data.get('amount')
        if not amount or float(amount) <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        wallet.balance += Decimal(amount)
        wallet.save()

        # Record the transaction
        Transaction.objects.create(
            user=request.user,
            amount=Decimal(amount),
            transaction_type='RECHARGE',
            status='SUCCESS',
            reference_id=f'PAY_MOCK_{wallet.id}'
        )

        return Response(WalletSerializer(wallet).data)

    # Custom action to unlock lead contact detail
    @action(detail=False, methods=['post'])
    def unlock_contact(self, request):
        business_id = request.data.get('business_id')
        if not business_id:
            return Response({'error': 'Business ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        wallet, created = Wallet.objects.get_or_create(user=request.user)
        if wallet.balance < Decimal('15.00'):
            return Response(
                {'error': 'Insufficient wallet balance. Cost is ₹15.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        wallet.balance -= Decimal('15.00')
        wallet.save()

        # Record transaction
        Transaction.objects.create(
            user=request.user,
            amount=Decimal('15.00'),
            transaction_type='LEAD_UNLOCK',
            status='SUCCESS',
            reference_id=f'UNLK_{business_id}'
        )

        return Response({'success': True, 'new_balance': wallet.balance})

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')

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
        try:
            val = float(amount)
            if val <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        wallet.balance += Decimal(str(val))
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

    @action(detail=False, methods=['post'])
    def create_razorpay_order(self, request):
        amount = request.data.get('amount')
        payment_type = request.data.get('type', 'RECHARGE')
        plan_type = request.data.get('plan_type', '')

        try:
            val = float(amount)
            if val <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        from django.conf import settings
        order_id = ""
        mock_mode = True

        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            try:
                import razorpay
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                razorpay_order = client.order.create({
                    'amount': int(float(amount) * 100),  # In paise
                    'currency': 'INR',
                    'payment_capture': '1'
                })
                order_id = razorpay_order['id']
                mock_mode = False
            except Exception:
                import uuid
                order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
        else:
            import uuid
            order_id = f"order_mock_{uuid.uuid4().hex[:12]}"

        Transaction.objects.create(
            user=request.user,
            amount=Decimal(str(amount)),
            transaction_type=payment_type,
            status='PENDING',
            reference_id=order_id
        )

        return Response({
            'order_id': order_id,
            'amount': amount,
            'key_id': settings.RAZORPAY_KEY_ID,
            'mock': mock_mode,
            'type': payment_type,
            'plan_type': plan_type
        })

    @action(detail=False, methods=['post'])
    def verify_razorpay_payment(self, request):
        order_id = request.data.get('razorpay_order_id')
        payment_id = request.data.get('razorpay_payment_id')
        signature = request.data.get('razorpay_signature')
        payment_type = request.data.get('type', 'RECHARGE')
        plan_type = request.data.get('plan_type', '')

        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = Transaction.objects.get(user=request.user, reference_id=order_id, status='PENDING')
        except Transaction.DoesNotExist:
            return Response({'error': 'Pending transaction not found'}, status=status.HTTP_404_NOT_FOUND)

        from django.conf import settings
        verified = False

        if not order_id.startswith('order_mock_') and settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            try:
                import razorpay
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                client.utility.verify_payment_signature({
                    'razorpay_order_id': order_id,
                    'razorpay_payment_id': payment_id,
                    'razorpay_signature': signature
                })
                verified = True
            except Exception:
                verified = False
        else:
            verified = True

        if not verified:
            transaction.status = 'FAILED'
            transaction.save()
            return Response({'success': False, 'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)

        transaction.status = 'SUCCESS'
        transaction.save()

        wallet, created = Wallet.objects.get_or_create(user=request.user)

        if payment_type == 'RECHARGE':
            wallet.balance += transaction.amount
            wallet.save()
        elif payment_type == 'SUBSCRIPTION':
            from apps.subscriptions.models import Subscription
            Subscription.objects.create(
                user=request.user,
                plan_type=plan_type or 'SILVER',
                is_active=True
            )
            if plan_type == 'GOLD' and hasattr(request.user, 'business_profile'):
                request.user.business_profile.is_featured = True
                request.user.business_profile.save()
        elif payment_type == 'VERIFICATION':
            if hasattr(request.user, 'business_profile'):
                request.user.business_profile.verified = True
                request.user.business_profile.save()
        elif payment_type == 'FEATURE':
            if hasattr(request.user, 'business_profile'):
                request.user.business_profile.is_featured = True
                request.user.business_profile.save()

        return Response({
            'success': True,
            'balance': wallet.balance,
            'transaction': TransactionSerializer(transaction).data
        })

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')

from rest_framework import viewsets, permissions
from .models import Category, BusinessProfile
from .serializers import CategorySerializer, BusinessProfileSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class BusinessProfileViewSet(viewsets.ModelViewSet):
    queryset = BusinessProfile.objects.all()
    serializer_class = BusinessProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = BusinessProfile.objects.all()
        
        # Search and filters (supports Phase 9 search queries)
        q = self.request.query_params.get('q', None)
        loc = self.request.query_params.get('loc', None)
        category = self.request.query_params.get('category', None)
        
        if q:
            queryset = queryset.filter(about__icontains=q) | queryset.filter(user__username__icontains=q)
        if loc:
            queryset = queryset.filter(location__icontains=loc)
        if category:
            queryset = queryset.filter(category__name__iexact=category)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

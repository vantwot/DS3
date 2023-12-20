from rest_framework import viewsets
from dolist.serializers import *

class dolist_view(viewsets.ModelViewSet):
    serializer_class = dolist_serializer
    queryset = dolist_serializer.Meta.model.objects.all()

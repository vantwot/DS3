from rest_framework import serializers
from dolist.models import *

class dolist_serializer(serializers.ModelSerializer):

	class Meta:
		model = dolist
		fields = '__all__'

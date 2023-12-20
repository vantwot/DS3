from django.db import models

# Create your models here.
class dolist(models.Model):
    describe = models.CharField(null=False,blank=False,max_length=10000)
    checked = models.BooleanField(default=False)

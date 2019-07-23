from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
# Create your models here.


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, null=False, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=30, null=True)
    last_name = models.CharField(max_length=30, null=True)
    age = models.PositiveIntegerField(null=True)
    company_name = models.CharField(max_length=160, null=True)
    company_address = models.TextField(null=True)
    email = models.EmailField(null=True)
    tel = models.CharField(max_length=20, null=True)
    url = models.TextField(null=True)
    photo_url = models.TextField(null=True)
    admin_name = models.CharField(max_length=50, null=True)
    company_position = models.CharField(max_length=30, null=True)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_profile_exists(sender, **kwargs):
    if kwargs.get('created'):
        UserProfile.objects.get_or_create(user=kwargs.get('instance'))

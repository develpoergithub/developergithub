import uuid
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

# Create your models here.


class UserProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, null=False, on_delete=models.CASCADE
    )
    first_name = models.CharField(max_length=30, null=True)
    last_name = models.CharField(max_length=30, null=True)
    age = models.PositiveIntegerField(null=True)
    company_name = models.CharField(max_length=160, null=True)
    company_address = models.TextField(null=True)
    # Already Exist in User table, remove duplicate...
    email = models.EmailField(null=True)
    # ...remove duplicate.
    tel = models.CharField(max_length=20, null=True)
    url = models.TextField(null=True)
    photo_url = models.TextField(null=True)
    admin_name = models.CharField(max_length=50, null=True)
    company_position = models.CharField(max_length=30, null=True)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_profile_exists(sender, instance, created, **kwargs):
    if created:
        name = instance.username
        if instance.is_company:
            UserProfile.objects.get_or_create(user=instance, company_name=name)
        else:
            first_name = ""
            last_name = ""

            if " " in name:
                name_list = name.split(" ", 2)
                for x in range(2):
                    if x == 0:
                        first_name = name_list[x]
                    else:
                        last_name = name_list[x]
            else:
                first_name = name

            first_name = first_name.strip()
            last_name = last_name.strip()

            UserProfile.objects.get_or_create(
                user=instance, first_name=first_name, last_name=last_name
            )
        instance.username = ""
        instance.save()

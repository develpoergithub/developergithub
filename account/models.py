import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.core.mail import send_mail
from django.utils.crypto import get_random_string

# Create your models here.


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_company = models.BooleanField(default=False)
    REQUIRED_FIELDS = ["is_company"]
    USERNAME_FIELD = "email"


User._meta.get_field("email")._unique = True
User._meta.get_field("username")._unique = False


class UserConnection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    company = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="company_set",
        null=False,
        on_delete=models.CASCADE,
    )
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="employee_set",
        null=False,
        on_delete=models.CASCADE,
    )
    is_confirmed = models.BooleanField(default=False)


class UserActivation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, null=False, on_delete=models.CASCADE
    )
    code = models.CharField(max_length=6)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_and_send_activation_email(sender, **kwargs):
    if kwargs.get("created"):
        code = get_random_string(length=6, allowed_chars="1234567890")
        UserActivation.objects.get_or_create(user=kwargs.get("instance"), code=code)
        send_mail(
            "Welcome to SwapBoard!",
            "Thank you for signing up to SwapBoard, your activation code is " + code,
            settings.DEFAULT_FROM_EMAIL,
            [kwargs.get("instance").email],
        )


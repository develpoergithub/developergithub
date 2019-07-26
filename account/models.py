from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.core.mail import send_mail

# Create your models here.


class User(AbstractUser):
    is_company = models.BooleanField(default=False)
    REQUIRED_FIELDS = ["is_company", "username"]
    USERNAME_FIELD = "email"


class UserConnection(models.Model):
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


User._meta.get_field("email")._unique = True


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def send_email(sender, **kwargs):
    if kwargs.get("created"):
        send_mail(
            "Welcome to SwapBoard!",
            "Thank you for signing up to SwapBoard, sent through Mailgun.",
            settings.DEFAULT_FROM_EMAIL,
            [kwargs.get("instance").email],
        )


import uuid
from django.db import models
from django.conf import settings

# Create your models here.


class Shift(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    from_time = models.DateTimeField()
    to_time = models.DateTimeField()
    note = models.CharField(max_length=120)
    is_sponsored = models.BooleanField(default=False)
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="posted_by_set",
        null=False,
        on_delete=models.CASCADE,
    )
    # The Company that this Shift is posted on
    posted_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="posted_to_set",
        null=False,
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return self.time


class ShiftConnection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created = models.DateTimeField(auto_now_add=True, editable=False)
    # The Shift that is beign conneted to
    shift = models.ForeignKey(
        Shift, related_name="shift_set", null=False, on_delete=models.CASCADE
    )
    proposed_shift = models.ForeignKey(
        Shift, related_name="proposed_shift_set", null=False, on_delete=models.CASCADE
    )
    is_accepted = models.BooleanField(default=False)

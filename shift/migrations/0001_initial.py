# Generated by Django 2.2.3 on 2019-08-03 20:49

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Shift',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('from_time', models.DateTimeField()),
                ('to_time', models.DateTimeField()),
                ('note', models.CharField(max_length=120)),
                ('is_sponsored', models.BooleanField(default=False)),
                ('posted_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='posted_by_set', to=settings.AUTH_USER_MODEL)),
                ('posted_to', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='posted_to_set', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='ShiftConnection',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('is_accepted', models.BooleanField(default=False)),
                ('proposed_shift', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='proposed_shift_set', to='shift.Shift')),
                ('shift', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shift_set', to='shift.Shift')),
            ],
        ),
    ]

# Generated by Django 2.2.3 on 2019-08-18 07:09

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
            name='UserProfile',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('first_name', models.CharField(max_length=30, null=True)),
                ('last_name', models.CharField(max_length=30, null=True)),
                ('age', models.PositiveIntegerField(null=True)),
                ('company_name', models.CharField(max_length=160, null=True)),
                ('company_address', models.TextField(null=True)),
                ('email', models.EmailField(max_length=254, null=True)),
                ('tel', models.CharField(max_length=20, null=True)),
                ('url', models.TextField(null=True)),
                ('photo_url', models.TextField(null=True)),
                ('admin_name', models.CharField(max_length=50, null=True)),
                ('company_position', models.CharField(max_length=30, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]

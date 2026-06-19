"""
Management command to create/update the ULINKUP superadmin user.
Run with: python manage.py create_admin
"""
from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = 'Creates or updates the ULINKUP superadmin account'

    def handle(self, *args, **options):
        email = 'admin@ulinkup.com'
        username = 'ulinkup_admin'
        password = 'ULinkup@Admin2026!'

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )

        if not created:
            # Update existing admin
            user.username = username
            user.role = 'ADMIN'
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True

        user.set_password(password)
        user.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ {action} superadmin:\n'
                f'   Email:    {email}\n'
                f'   Username: {username}\n'
                f'   Password: {password}\n'
                f'   Role:     ADMIN'
            )
        )

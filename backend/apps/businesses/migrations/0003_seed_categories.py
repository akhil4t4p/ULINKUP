from django.db import migrations

DEFAULT_CATEGORIES = [
    ('PLUMBER', 'plumber'),
    ('ELECTRICIAN', 'electrician'),
    ('CARPENTER', 'carpenter'),
    ('PAINTER', 'painter'),
    ('MECHANIC', 'mechanic'),
    ('TUTOR', 'tutor'),
    ('CLEANER', 'cleaner'),
    ('COOK', 'cook'),
    ('DRIVER', 'driver'),
    ('PHOTOGRAPHER', 'photographer'),
    ('VIDEOGRAPHER', 'videographer'),
    ('WEB DESIGNER', 'web-designer'),
    ('GRAPHIC DESIGNER', 'graphic-designer'),
    ('SOFTWARE DEVELOPER', 'software-developer'),
    ('DIGITAL MARKETER', 'digital-marketer'),
    ('SALON & SPA', 'salon-spa'),
    ('FITNESS TRAINER', 'fitness-trainer'),
    ('YOGA INSTRUCTOR', 'yoga-instructor'),
    ('INTERIOR DESIGNER', 'interior-designer'),
    ('ARCHITECT', 'architect'),
    ('REAL ESTATE AGENT', 'real-estate-agent'),
    ('LAWYER', 'lawyer'),
    ('ACCOUNTANT', 'accountant'),
    ('DOCTOR', 'doctor'),
    ('DENTIST', 'dentist'),
    ('VETERINARIAN', 'veterinarian'),
    ('PEST CONTROL', 'pest-control'),
    ('AC REPAIR', 'ac-repair'),
    ('APPLIANCE REPAIR', 'appliance-repair'),
    ('TAILOR', 'tailor'),
    ('EVENT PLANNER', 'event-planner'),
    ('CATERER', 'caterer'),
    ('DJ & MUSIC', 'dj-music'),
    ('SECURITY GUARD', 'security-guard'),
    ('DELIVERY SERVICE', 'delivery-service'),
    ('PACKERS & MOVERS', 'packers-movers'),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model('businesses', 'Category')
    for name, slug in DEFAULT_CATEGORIES:
        Category.objects.get_or_create(name=name, defaults={'slug': slug})


def remove_categories(apps, schema_editor):
    Category = apps.get_model('businesses', 'Category')
    slugs = [slug for _, slug in DEFAULT_CATEGORIES]
    Category.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('businesses', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_categories),
    ]

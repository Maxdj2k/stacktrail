"""
Seed 3 demo orgs for the demo user; run scan + assessment for each.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from core.demo_data import seed_demo_for_user

User = get_user_model()


class Command(BaseCommand):
    help = "Seed 3 demo orgs for user 'demo'; run scan + assessment for each."

    def handle(self, *args, **options):
        user, _ = User.objects.get_or_create(
            username="demo",
            defaults={"email": "demo@example.com"},
        )
        if not user.has_usable_password():
            user.set_password("demo1234!")
            user.save()

        created = seed_demo_for_user(user)
        for org in created:
            self.stdout.write(f"Created org: {org.name}")
        self.stdout.write(self.style.SUCCESS("Seed complete: 3 orgs, scan + assessment each."))

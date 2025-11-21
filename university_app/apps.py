# university_app/apps.py
from django.apps import AppConfig

class UniversityAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'university_app'

    def ready(self):
        from .models import Course, Schedule, Payment
        from .cache import UniversityCache
        from django.db.models.signals import post_save, post_delete

        def invalidate_cache(sender, **kwargs):
            UniversityCache.invalidate_all()

        post_save.connect(invalidate_cache, sender=Course)
        post_delete.connect(invalidate_cache, sender=Course)
        post_save.connect(invalidate_cache, sender=Schedule)
        post_delete.connect(invalidate_cache, sender=Schedule)
        post_save.connect(invalidate_cache, sender=Payment)
        post_delete.connect(invalidate_cache, sender=Payment)
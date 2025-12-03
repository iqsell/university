from django.apps import AppConfig


class UniversityAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'university_app'

    def ready(self):
        import university_app.signals

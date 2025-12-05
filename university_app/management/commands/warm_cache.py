from django.core.management.base import BaseCommand
from university_app.cache import UniversityCache


class Command(BaseCommand):
    help = 'Прогрев кэша университета'

    def handle(self, *args, **options):
        self.stdout.write("Прогреваем кэш...")

        UniversityCache.get_courses()
        self.stdout.write(self.style.SUCCESS("✓ Курсы закэшированы"))

        UniversityCache.get_schedule()
        self.stdout.write(self.style.SUCCESS("✓ Расписание закэшировано"))

        UniversityCache.get_debtors()
        self.stdout.write(self.style.SUCCESS("✓ Отчёт по долгам закэширован"))

        self.stdout.write(self.style.SUCCESS("Кэш успешно прогрет!"))

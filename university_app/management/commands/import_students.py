import pandas as pd
from django.core.management.base import BaseCommand
from university_app.models import Student
from django.db import transaction
import os


class Command(BaseCommand):
    help = 'Импорт студентов из CSV/XLSX'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Путь к файлу CSV или XLSX')

    def handle(self, *args, **options):
        file_path = options['file_path']
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f"Файл не найден: {file_path}"))
            return

        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)

            created = 0
            updated = 0
            errors = []

            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        email = str(row['email']).strip()
                        full_name = str(row['full_name']).strip()
                        gpa = float(row.get('gpa', 0)) if pd.notna(row.get('gpa')) else 0.0

                        obj, was_created = Student.objects.update_or_create(
                            email=email,
                            defaults={
                                'full_name': full_name,
                                'gpa': round(gpa, 2),
                                'status': row.get('status', 'active') or 'active'
                            }
                        )
                        if was_created:
                            created += 1
                        else:
                            updated += 1

                    except Exception as e:
                        errors.append(f"Строка {index + 2}: {e}")

            self.stdout.write(self.style.SUCCESS(f"Успешно: создано {created}, обновлено {updated}"))
            if errors:
                self.stdout.write(self.style.WARNING("Ошибки:"))
                for err in errors[:10]:
                    self.stdout.write(f"  • {err}")
                if len(errors) > 10:
                    self.stdout.write(f"  ... и ещё {len(errors) - 10} ошибок")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Ошибка чтения файла: {e}"))

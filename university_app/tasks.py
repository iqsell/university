# university_app/tasks.py — АСИНХРОННЫЕ ЗАДАЧИ
from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .models import Exam, Enrollment, Student


@shared_task
def send_exam_reminders():
    """Рассылка уведомлений за 24 часа до экзамена"""
    tomorrow = timezone.now() + timedelta(days=1)
    exams = Exam.objects.filter(date__date=tomorrow.date())

    for exam in exams:
        students = Student.objects.filter(enrollments__course=exam.course)
        for student in students:
            send_mail(
                subject=f"Напоминание: экзамен по {exam.course.name}",
                message=f"Уважаемый {student.full_name}!\n\n"
                        f"Завтра {exam.date.strftime('%d.%m.%Y в %H:%M')} у вас экзамен по курсу '{exam.course.name}'.\n"
                        f"Не забудьте подготовиться!\n\nС уважением, Университет",
                from_email='no-reply@university.ru',
                recipient_list=[student.email],
                fail_silently=False,
            )
    return f"Отправлено {students.count()} напоминаний"


@shared_task
def generate_performance_report(student_id):
    """Генерация отчёта об успеваемости в фоне"""
    from .models import Student, Enrollment
    import json
    from django.conf import settings
    import os

    student = Student.objects.get(id=student_id)
    enrollments = Enrollment.objects.filter(student=student).select_related('course')

    report = {
        "student": student.full_name,
        "gpa": float(student.gpa),
        "courses": [
            {
                "name": e.course.name,
                "grade": e.grade,
                "passed": e.passed
            } for e in enrollments
        ],
        "generated_at": timezone.now().isoformat()
    }

    # Сохраняем отчёт
    reports_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
    os.makedirs(reports_dir, exist_ok=True)
    filename = f"report_{student.id}_{timezone.now().strftime('%Y%m%d_%H%M')}.json"
    filepath = os.path.join(reports_dir, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return f"Отчёт сохранён: {filepath}"


# university_app/tasks.py — ФИНАЛЬНАЯ ВЕРСИЯ ИМПОРТА (РАБОТАЕТ!)
import pandas as pd
from celery import shared_task
from django.db import transaction
from .models import Student
import os
from django.core.mail import EmailMessage
from django.conf import settings


@shared_task(bind=True)
def import_students_task(self, file_path, user_email=None):
    """Асинхронный импорт студентов из CSV/XLSX"""

    # Проверяем, существует ли файл
    if not os.path.exists(file_path):
        error_msg = f"Файл не найден по пути: {file_path}"
        if user_email:
            EmailMessage(
                subject='Ошибка импорта студентов',
                body=error_msg,
                from_email='no-reply@university.ru',
                to=[user_email]
            ).send(fail_silently=True)
        raise FileNotFoundError(error_msg)

    try:
        # Читаем файл с правильным движком
        if file_path.lower().endswith('.csv'):
            df = pd.read_csv(file_path, encoding='utf-8')
        else:
            df = pd.read_excel(file_path, engine='openpyxl')  # ← ВАЖНО!

        created = 0
        updated = 0
        errors = []

        with transaction.atomic():
            for index, row in df.iterrows():
                try:
                    email = str(row['email']).strip()
                    full_name = str(row['full_name']).strip()
                    gpa = float(row['gpa']) if pd.notna(row.get('gpa')) else 0.0
                    status = str(row.get('status', 'active')).strip().lower()

                    if status not in ['active', 'academic_leave', 'expelled', 'graduated']:
                        status = 'active'

                    obj, was_created = Student.objects.update_or_create(
                        email=email,
                        defaults={
                            'full_name': full_name,
                            'gpa': round(float(gpa), 2),
                            'status': status
                        }
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1

                except Exception as e:
                    errors.append(f"Строка {index + 2}: {str(e)}")

        # Отчёт
        report = f"Импорт завершён!\nСоздано: {created}\nОбновлено: {updated}\nОшибок: {len(errors)}"
        if errors:
            report += "\n\nОшибки:\n" + "\n".join(errors[:20])

        if user_email:
            EmailMessage(
                subject='Отчёт по импорту студентов',
                body=report,
                from_email='no-reply@university.ru',
                to=[user_email]
            ).send(fail_silently=True)

        return report

    except Exception as e:
        error_msg = f"Критическая ошибка: {str(e)}"
        if user_email:
            EmailMessage(
                subject='Ошибка импорта студентов',
                body=error_msg,
                from_email='no-reply@university.ru',
                to=[user_email]
            ).send(fail_silently=True)
        raise
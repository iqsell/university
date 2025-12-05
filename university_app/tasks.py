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
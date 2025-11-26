# university_app/reports.py — ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
from django.db.models import Avg, Sum, Count, Q, F, Value, DecimalField
from django.db.models.functions import Coalesce
from django.db import connection
from .models import Student, Enrollment, Schedule, Payment


class UniversityReports:
    """Все 5 сложных отчётов — теперь работают на 100% с твоими моделями"""

    @staticmethod
    def students_above_course_average():
        """1. Студенты с GPA > среднего по их курсам"""
        return list(
            Student.objects.annotate(
                course_avg_grade=Coalesce(Avg('enrollments__grade'), 0.0)  # ← ВОТ ПРАВИЛЬНОЕ ИМЯ!
            )
            .filter(gpa__gt=F('course_avg_grade'))
            .values('id', 'full_name', 'email', 'gpa', 'course_avg_grade')
        )

    @staticmethod
    def teacher_week_schedule(teacher_id: int):
        """2. Расписание преподавателя на неделю"""
        return list(
            Schedule.objects.filter(teacher_id=teacher_id)
            .select_related('course')
            .order_by('day_of_week', 'start_time')
            .values(
                'course__name', 'room', 'day_of_week',
                'start_time', 'end_time'
            )
        )

    @staticmethod
    def course_average_grade(course_id: int):
        """3. Средний балл по курсу"""
        stats = Enrollment.objects.filter(course_id=course_id).aggregate(
            avg_grade=Avg('grade'),
            passed_count=Count('id', filter=Q(passed=True)),
            total=Count('id')
        )
        avg = round(stats['avg_grade'] or 0, 2)
        return {
            "course_id": course_id,
            "average_grade": avg,
            "passed_students": stats['passed_count'],
            "total_students": stats['total'],
            "success_rate_percent": round((stats['passed_count'] / stats['total'] * 100) if stats['total'] else 0, 2)
        }

    @staticmethod
    def top_5_students_by_gpa():
        """4. Топ-5 студентов по GPA (оконная функция)"""
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id, full_name, email, gpa,
                    RANK() OVER (ORDER BY gpa DESC) as rank_position
                FROM university_app_student
                ORDER BY gpa DESC
                LIMIT 5;
            """)
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    @staticmethod
    def debtors_with_debt_amount():
        """5. Студенты с долгами + сумма"""
        return list(
            Student.objects.annotate(
                debt=Coalesce(
                    Sum('payments__amount', filter=Q(payments__status__in=['pending', 'overdue'])),
                    Value(0),
                    output_field=DecimalField(max_digits=12, decimal_places=2)
                )
            )
            .filter(debt__gt=0)
            .order_by('-debt')
            .values('id', 'full_name', 'email', 'debt')
        )
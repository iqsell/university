# university_app/cache.py
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Course, Schedule, Payment
import logging

logger = logging.getLogger(__name__)

class UniversityCache:
    @staticmethod
    def get_courses_key():
        return "courses_with_teachers"

    @staticmethod
    def get_schedule_key():
        return "weekly_schedule"

    @staticmethod
    def get_debtors_key():
        return "debtors_report"

    @staticmethod
    def invalidate_all():
        keys = [
            UniversityCache.get_courses_key(),
            UniversityCache.get_schedule_key(),
            UniversityCache.get_debtors_key(),
        ]
        cache.delete_many(keys)
        logger.info("University cache invalidated")

    @staticmethod
    def get_courses():
        key = UniversityCache.get_courses_key()
        data = cache.get(key)
        if data is None:
            data = list(Course.objects.select_related('teacher').values(
                'id', 'name', 'description', 'credits',
                'teacher__full_name', 'teacher__position'
            ))
            cache.set(key, data, timeout=60 * 15)
        return data

    @staticmethod
    def get_schedule():
        key = UniversityCache.get_schedule_key()
        data = cache.get(key)
        if data is None:
            from .models import Schedule
            data = list(Schedule.objects.select_related('course', 'teacher').values(
                'course__name', 'teacher__full_name', 'room',
                'day_of_week', 'start_time', 'end_time'
            ))
            cache.set(key, data, timeout=60 * 30)  # расписание меняется редко
        return data

    @staticmethod
    def get_debtors():
        key = UniversityCache.get_debtors_key()
        data = cache.get(key)
        if data is None:
            from .reports import UniversityReports
            data = UniversityReports.debtors_with_debt_amount()
            cache.set(key, data, timeout=60 * 10)
        return data
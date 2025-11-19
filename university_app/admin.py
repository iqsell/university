from django.contrib import admin
from .models import (
    Department, Teacher, Student, Course,
    Enrollment, Schedule, Exam, ExamResult, Payment
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'department', 'position')
    search_fields = ('full_name', 'email')
    list_filter = ('department', 'position')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'status', 'gpa')
    list_filter = ('status',)
    search_fields = ('full_name', 'email')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'teacher', 'credits')
    search_fields = ('name',)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'enrollment_date', 'grade', 'passed')
    list_filter = ('passed',)


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ('course', 'teacher', 'day_of_week', 'start_time', 'end_time', 'room')
    list_filter = ('day_of_week', 'room')


class ExamResultInline(admin.TabularInline):
    model = ExamResult
    extra = 1
    autocomplete_fields = ('student',)


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('course', 'date')
    inlines = [ExamResultInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('student', 'amount', 'status', 'date_created', 'date_paid')
    list_filter = ('status',)
    search_fields = ('student__full_name',)

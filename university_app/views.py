# university_app/views.py
from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .cache import UniversityCache
from .models import (
    Department, Teacher, Student, Course,
    Enrollment, Schedule, Exam, Payment
)
from .serializers import (
    DepartmentSerializer, TeacherSerializer, StudentSerializer, CourseSerializer,
    EnrollmentSerializer, ScheduleSerializer, ExamSerializer, PaymentSerializer
)
from .reports import UniversityReports


class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


# === Все ViewSet'ы (CRUD) ===
class DepartmentViewSet(BaseViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class TeacherViewSet(BaseViewSet):
    queryset = Teacher.objects.select_related('department').all()
    serializer_class = TeacherSerializer
    search_fields = ['full_name', 'email']


class StudentViewSet(BaseViewSet):
    queryset = Student.objects.all().order_by('full_name')
    serializer_class = StudentSerializer
    search_fields = ['full_name', 'email']
    filterset_fields = ['status']


class CourseViewSet(BaseViewSet):
    queryset = Course.objects.select_related('teacher').all()
    serializer_class = CourseSerializer
    search_fields = ['name']


class EnrollmentViewSet(BaseViewSet):
    queryset = Enrollment.objects.select_related('student', 'course').all()
    serializer_class = EnrollmentSerializer


class ScheduleViewSet(BaseViewSet):
    queryset = Schedule.objects.select_related('course', 'teacher').all()
    serializer_class = ScheduleSerializer


class ExamViewSet(BaseViewSet):
    queryset = Exam.objects.select_related('course').all()
    serializer_class = ExamSerializer


class PaymentViewSet(BaseViewSet):
    queryset = Payment.objects.select_related('student').all()
    serializer_class = PaymentSerializer


# === Отчёты (сложные запросы) ===
@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def report_students_above_average(request):
    data = UniversityReports.students_above_course_average()
    return Response({"results": data})


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def report_teacher_schedule(request, teacher_id):
    data = UniversityReports.teacher_week_schedule(teacher_id)
    return Response({"schedule": data})


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def report_course_average(request, course_id):
    data = UniversityReports.course_average_grade(course_id)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def report_top_5_students(request):
    data = UniversityReports.top_5_students_by_gpa()
    return Response({"top_5": data})


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def report_debtors(request):
    data = UniversityReports.debtors_with_debt_amount()
    return Response({"debtors": data})


@api_view(['GET'])
def cached_courses(request):
    data = UniversityCache.get_courses()
    return Response({"courses": data})

@api_view(['GET'])
def cached_schedule(request):
    data = UniversityCache.get_schedule()
    return Response({"schedule": data})

@api_view(['GET'])
def cached_debtors(request):
    data = UniversityCache.get_debtors()
    return Response({"debtors": data})
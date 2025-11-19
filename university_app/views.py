# university_app/views.py
from rest_framework import viewsets, permissions
from .models import (
    Department, Teacher, Student, Course,
    Enrollment, Schedule, Exam, Payment
)
from .serializers import (
    DepartmentSerializer, TeacherSerializer, StudentSerializer, CourseSerializer,
    EnrollmentSerializer, ScheduleSerializer, ExamSerializer, PaymentSerializer
)


class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


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
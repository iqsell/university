from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role

        if role == 'admin':
            return self.queryset.all()

        if role == 'teacher':
            teacher_profile = user.teacher_profile
            if not teacher_profile:
                return self.queryset.none()

            if self.queryset.model == Course:
                return Course.objects.filter(teacher=teacher_profile)
            if self.queryset.model == Enrollment:
                return Enrollment.objects.filter(course__teacher=teacher_profile)
            if self.queryset.model == Schedule:
                return Schedule.objects.filter(teacher=teacher_profile)
            if self.queryset.model == Student:
                return Student.objects.filter(enrollments__course__teacher=teacher_profile).distinct()

        if role == 'student':
            student_profile = user.student_profile
            if not student_profile:
                return self.queryset.none()

            if self.queryset.model == Enrollment:
                return Enrollment.objects.filter(student=student_profile)
            if self.queryset.model == Course:
                return Course.objects.filter(enrollments__student=student_profile).distinct()
            if self.queryset.model == Payment:
                return Payment.objects.filter(student=student_profile)
            if self.queryset.model == Exam:
                return Exam.objects.filter(course__enrollments__student=student_profile).distinct()
            if self.queryset.model == Schedule:
                return Schedule.objects.filter(course__enrollments__student=student_profile).distinct()

        return self.queryset.none()


# === Все ViewSet'ы ===
class DepartmentViewSet(BaseViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class TeacherViewSet(BaseViewSet):
    queryset = Teacher.objects.select_related('department').all()
    serializer_class = TeacherSerializer


class StudentViewSet(BaseViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer


class CourseViewSet(BaseViewSet):
    queryset = Course.objects.select_related('teacher').all()
    serializer_class = CourseSerializer


class EnrollmentViewSet(BaseViewSet):
    queryset = Enrollment.objects.select_related('student', 'course__teacher').all()
    serializer_class = EnrollmentSerializer


class ScheduleViewSet(BaseViewSet):
    queryset = Schedule.objects.select_related('course__teacher', 'teacher').all()
    serializer_class = ScheduleSerializer


class ExamViewSet(BaseViewSet):
    queryset = Exam.objects.select_related('course__teacher').all()
    serializer_class = ExamSerializer


class PaymentViewSet(BaseViewSet):
    queryset = Payment.objects.select_related('student').all()
    serializer_class = PaymentSerializer


# === ОТЧЁТЫ ===
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_students_above_average(request):
    if request.user.role not in ['admin', 'teacher']:
        return Response({"error": "Доступ запрещён"}, status=403)
    data = UniversityReports.students_above_course_average()
    return Response({"results": data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_teacher_schedule(request, teacher_id):
    if request.user.role == 'teacher' and getattr(request.user.teacher_profile, 'id', None) != teacher_id:
        return Response({"error": "Можно просматривать только своё расписание"}, status=403)
    if request.user.role not in ['admin', 'teacher']:
        return Response({"error": "Доступ запрещён"}, status=403)
    data = UniversityReports.teacher_week_schedule(teacher_id)
    return Response({"schedule": data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_course_average(request, course_id):
    if request.user.role not in ['admin', 'teacher']:
        return Response({"error": "Доступ запрещён"}, status=403)
    data = UniversityReports.course_average_grade(course_id)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_top_5_students(request):
    if request.user.role != 'admin':
        return Response({"error": "Доступ запрещён"}, status=403)
    data = UniversityReports.top_5_students_by_gpa()
    return Response({"top_5": data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_debtors(request):
    if request.user.role != 'admin':
        return Response({"error": "Доступ запрещён"}, status=403)
    data = UniversityReports.debtors_with_debt_amount()
    return Response({"debtors": data})

# university_app/serializers.py
from rest_framework import serializers
from .models import (
    Department, Teacher, Student, Course,
    Enrollment, Schedule, Exam, Payment
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class TeacherSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Teacher
        fields = ['id', 'full_name', 'email', 'department', 'department_name', 'position']


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

    def validate_gpa(self, value):
        if not 0 <= value <= 4.0:
            raise serializers.ValidationError("GPA должен быть от 0.00 до 4.00")
        return value


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'credits', 'teacher', 'teacher_name']


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['passed', 'enrollment_date']


class ScheduleSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = Schedule
        fields = '__all__'


class ExamSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)

    class Meta:
        model = Exam
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['date_created', 'date_paid']
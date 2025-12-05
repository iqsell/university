import os
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from university_app.models import Student, Teacher, Course, Enrollment
from university_app.tasks import generate_performance_report
from django.conf import settings

User = get_user_model()


class BusinessLogicTests(TestCase):
    def setUp(self):
        self.teacher = Teacher.objects.create(
            full_name="Профессор Иванов",
            email="prof@example.com",
            position="professor"
        )
        self.student = Student.objects.create(
            full_name="Тест Студент",
            email="test@student.ru",
            gpa=0.0
        )
        self.course1 = Course.objects.create(name="Курс 1", credits=6, teacher=self.teacher)
        self.course2 = Course.objects.create(name="Курс 2", credits=6, teacher=self.teacher)

    def test_enrollment_passed_status(self):
        e1 = Enrollment.objects.create(student=self.student, course=self.course1, grade=59)
        e2 = Enrollment.objects.create(student=self.student, course=self.course2, grade=60)
        self.assertFalse(e1.passed)
        self.assertTrue(e2.passed)


class APITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@uni.ru', '123')
        self.admin.role = 'admin'
        self.admin.save()

        self.teacher = Teacher.objects.create(full_name="Иванов", email="t@uni.ru", position="professor")
        self.teacher_user = User.objects.create_user('teacher', 't@uni.ru', '123')
        self.teacher_user.role = 'teacher'
        self.teacher_user.teacher_profile = self.teacher
        self.teacher_user.save()

        self.student = Student.objects.create(full_name="Петров", email="s@uni.ru", gpa=3.5)
        self.student_user = User.objects.create_user('student', 's@uni.ru', '123')
        self.student_user.role = 'student'
        self.student_user.student_profile = self.student
        self.student_user.save()

        self.client = APIClient()

    def test_create_course_as_teacher(self):
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(reverse('course-list'), {
            'name': 'Python',
            'credits': 6,
            'teacher': self.teacher.id
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_student_cannot_delete_course(self):
        """Студент не может удалить курс"""
        course = Course.objects.create(name="Запрет", credits=3, teacher=self.teacher)
        self.client.force_authenticate(user=self.student_user)
        url = reverse('course-detail', kwargs={'pk': course.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND or status.HTTP_403_FORBIDDEN)

    def test_teacher_sees_only_his_students(self):
        my_course = Course.objects.create(name="Мой курс", credits=6, teacher=self.teacher)
        Enrollment.objects.create(student=self.student, course=my_course)

        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.get(reverse('student-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data)
        names = [s['full_name'] for s in data]
        self.assertIn("Петров", names)

    def test_student_sees_only_own_courses(self):
        my_course = Course.objects.create(name="Мой курс", credits=6, teacher=self.teacher)
        other_course = Course.objects.create(name="Чужой", credits=6, teacher=self.teacher)
        Enrollment.objects.create(student=self.student, course=my_course)

        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(reverse('course-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data)
        names = [c['name'] for c in data]
        self.assertIn("Мой курс", names)
        self.assertNotIn("Чужой", names)


class CeleryTaskTests(TestCase):
    def setUp(self):
        self.teacher = Teacher.objects.create(full_name="Проф", email="prof@uni.ru", position="professor")
        self.student = Student.objects.create(full_name="Тест", email="test@uni.ru", gpa=0)
        self.course = Course.objects.create(name="Celery", credits=6, teacher=self.teacher)
        Enrollment.objects.create(student=self.student, course=self.course, grade=90)
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'reports'), exist_ok=True)

    def test_generate_performance_report(self):
        """Тест генерации отчёта"""
        # Запускаем задачу синхронно (для теста)
        result = generate_performance_report(self.student.id)
        self.assertIn("Отчёт сохранён", result)

        report_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
        files = os.listdir(report_dir)
        self.assertTrue(any('report' in f for f in files))

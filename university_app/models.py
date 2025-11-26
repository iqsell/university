# university_app/models.py — 100% РАБОЧАЯ ФИНАЛЬНАЯ ВЕРСИЯ
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


def validate_gpa(value):
    if not 0 <= value <= 4.0:
        raise ValidationError('GPA должен быть от 0 до 4.0')


# === КАСТОМНЫЙ ПОЛЬЗОВАТЕЛЬ С РОЛЯМИ ===
class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Администратор'),
        ('teacher', 'Преподаватель'),
        ('student', 'Студент'),
    ]

    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='student',
        verbose_name='Роль'
    )

    # Привязка к профилям — ОБЯЗАТЕЛЬНО!
    student_profile = models.OneToOneField(
        'Student', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='+', verbose_name='Профиль студента'
    )
    teacher_profile = models.OneToOneField(
        'Teacher', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='+', verbose_name='Профиль преподавателя'
    )

    # Убираем конфликт с auth.User
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='university_users',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='university_users_permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'


# === КАФЕДРА ===
class Department(models.Model):
    name = models.CharField(max_length=200, unique=True, verbose_name='Название кафедры')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Кафедра'
        verbose_name_plural = 'Кафедры'


# === ПРЕПОДАВАТЕЛЬ ===
class Teacher(models.Model):
    POSITION_CHOICES = [
        ('assistant', 'Ассистент'),
        ('lecturer', 'Старший преподаватель'),
        ('associate_professor', 'Доцент'),
        ('professor', 'Профессор'),
    ]

    full_name = models.CharField(max_length=300, verbose_name='ФИО')
    email = models.EmailField(unique=True, blank=True, null=True, verbose_name='Email')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Кафедра')
    position = models.CharField(max_length=50, choices=POSITION_CHOICES, default='lecturer', verbose_name='Должность')

    def __str__(self):
        return f"{self.full_name} ({self.get_position_display()})"

    class Meta:
        verbose_name = 'Преподаватель'
        verbose_name_plural = 'Преподаватели'


# === СТУДЕНТ ===
class Student(models.Model):
    STATUS_CHOICES = [
        ('active', 'Обучается'),
        ('academic_leave', 'Академический отпуск'),
        ('expelled', 'Отчислен'),
        ('graduated', 'Выпускник'),
    ]

    full_name = models.CharField(max_length=300, verbose_name='ФИО')
    email = models.EmailField(unique=True, verbose_name='Email')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Статус')
    gpa = models.DecimalField(
        max_digits=3, decimal_places=2, default=0.00,
        validators=[validate_gpa], verbose_name='GPA'
    )

    def __str__(self):
        return f"{self.full_name} (GPA: {self.gpa})"

    class Meta:
        verbose_name = 'Студент'
        verbose_name_plural = 'Студенты'


# === КУРС ===
class Course(models.Model):
    name = models.CharField(max_length=200, verbose_name='Название курса')
    description = models.TextField(blank=True, verbose_name='Описание')
    credits = models.PositiveSmallIntegerField(verbose_name='Кредиты (ECTS)')
    teacher = models.ForeignKey(
        Teacher, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='courses', verbose_name='Преподаватель'
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Курс'
        verbose_name_plural = 'Курсы'


# === ЗАПИСЬ НА КУРС ===
class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments', verbose_name='Студент')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments', verbose_name='Курс')
    enrollment_date = models.DateField(auto_now_add=True, verbose_name='Дата записи')
    grade = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Оценка (0-100)'
    )
    passed = models.BooleanField(default=False, verbose_name='Зачтено')

    class Meta:
        unique_together = ('student', 'course')
        verbose_name = 'Запись на курс'
        verbose_name_plural = 'Записи на курсы'

    def save(self, *args, **kwargs):
        if self.grade is not None and self.grade >= 60:
            self.passed = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student} → {self.course}"


# === РАСПИСАНИЕ ===
class Schedule(models.Model):
    DAY_OF_WEEK = [
        ('monday', 'Понедельник'), ('tuesday', 'Вторник'), ('wednesday', 'Среда'),
        ('thursday', 'Четверг'), ('friday', 'Пятница'), ('saturday', 'Суббота'), ('sunday', 'Воскресенье'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, verbose_name='Курс')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, verbose_name='Преподаватель')
    room = models.CharField(max_length=50, verbose_name='Аудитория')
    day_of_week = models.CharField(max_length=10, choices=DAY_OF_WEEK, verbose_name='День недели')
    start_time = models.TimeField(verbose_name='Начало')
    end_time = models.TimeField(verbose_name='Окончание')

    class Meta:
        unique_together = ('day_of_week', 'start_time', 'room')
        verbose_name = 'Расписание'
        verbose_name_plural = 'Расписание'

    def __str__(self):
        return f"{self.course} – {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


# === ЭКЗАМЕН ===
class Exam(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, verbose_name='Курс')
    date = models.DateTimeField(verbose_name='Дата и время экзамена')

    def __str__(self):
        return f"Экзамен по {self.course} – {self.date.strftime('%d.%m.%Y %H:%M')}"

    class Meta:
        verbose_name = 'Экзамен'
        verbose_name_plural = 'Экзамены'


class ExamResult(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    grade = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Оценка'
    )
    attended = models.BooleanField(default=True, verbose_name='Явка')

    class Meta:
        unique_together = ('exam', 'student')
        verbose_name = 'Результат экзамена'
        verbose_name_plural = 'Результаты экзаменов'


# === ПЛАТЁЖ ===
class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('paid', 'Оплачено'),
        ('overdue', 'Просрочено'),
        ('canceled', 'Отменено'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments', verbose_name='Студент')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Сумма')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    date_created = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    date_paid = models.DateTimeField(null=True, blank=True, verbose_name='Дата оплаты')

    def __str__(self):
        return f"{self.student} – {self.amount} ₽ ({self.get_status_display()})"

    class Meta:
        verbose_name = 'Платёж'
        verbose_name_plural = 'Платежи'


# === АУДИТ-ЛОГ ===
class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Создание'),
        ('update', 'Изменение'),
        ('delete', 'Удаление'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Пользователь')
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, verbose_name='Действие')
    model_name = models.CharField(max_length=100, verbose_name='Модель')
    object_id = models.PositiveIntegerField(null=True, blank=True)
    object_repr = models.CharField(max_length=200, verbose_name='Объект')
    changes = models.JSONField(null=True, blank=True, verbose_name='Изменения')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Время')

    class Meta:
        verbose_name = 'Журнал аудита'
        verbose_name_plural = 'Журнал аудита'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user or 'Система'} — {self.get_action_display()} — {self.object_repr}"
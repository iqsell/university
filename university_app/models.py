from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


def validate_gpa(value):
    if not 0 <= value <= 4.0:
        raise ValidationError('GPA должен быть от 0 до 4.0')


class Department(models.Model):
    """Кафедра (для удобства вынесена отдельно)"""
    name = models.CharField(max_length=200, unique=True, verbose_name='Название кафедры')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Кафедра'
        verbose_name_plural = 'Кафедры'


class Teacher(models.Model):
    POSITION_CHOICES = [
        ('assistant', 'Ассистент'),
        ('lecturer', 'Старший преподаватель'),
        ('associate_professor', 'Доцент'),
        ('professor', 'Профессор'),
    ]

    full_name = models.CharField(max_length=300, verbose_name='ФИО')
    email = models.EmailField(unique=True, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True,
                                   verbose_name='Кафедра')
    position = models.CharField(max_length=50, choices=POSITION_CHOICES, verbose_name='Должность')

    def __str__(self):
        return f"{self.full_name} ({self.get_position_display()})"

    def get_week_schedule(self):
        from .models import Schedule
        return Schedule.objects.filter(teacher=self).select_related('course').order_by(
            'day_of_week', 'start_time'
        )

    class Meta:
        verbose_name = 'Преподаватель'
        verbose_name_plural = 'Преподаватели'


class Student(models.Model):
    STATUS_CHOICES = [
        ('active', 'Обучается'),
        ('academic_leave', 'Академический отпуск'),
        ('expelled', 'Отчислен'),
        ('graduated', 'Выпускник'),
    ]

    full_name = models.CharField(max_length=300, verbose_name='ФИО')
    email = models.EmailField(unique=True, verbose_name='Email')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active',
                               verbose_name='Статус')
    gpa = models.DecimalField(max_digits=3, decimal_places=2, default=0.00,
                              validators=[validate_gpa], verbose_name='GPA')

    def __str__(self):
        return f"{self.full_name} (GPA: {self.gpa})"

    class Meta:
        verbose_name = 'Студент'
        verbose_name_plural = 'Студенты'


class Course(models.Model):
    name = models.CharField(max_length=200, verbose_name='Название курса')
    description = models.TextField(blank=True, verbose_name='Описание')
    credits = models.PositiveSmallIntegerField(verbose_name='Кредиты (ECTS)')
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True,
                                related_name='courses', verbose_name='Преподаватель')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Курс'
        verbose_name_plural = 'Курсы'


class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, verbose_name='Студент')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, verbose_name='Курс')
    enrollment_date = models.DateField(auto_now_add=True, verbose_name='Дата записи')
    grade = models.PositiveSmallIntegerField(null=True, blank=True,
                                             validators=[MinValueValidator(0), MaxValueValidator(100)],
                                             verbose_name='Оценка (0-100)')
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


class Schedule(models.Model):
    DAY_OF_WEEK = [
        ('monday', 'Понедельник'),
        ('tuesday', 'Вторник'),
        ('wednesday', 'Среда'),
        ('thursday', 'Четверг'),
        ('friday', 'Пятница'),
        ('saturday', 'Суббота'),
        ('sunday', 'Воскресенье'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, verbose_name='Курс')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, verbose_name='Преподаватель')
    room = models.CharField(max_length=50, verbose_name='Аудитория')
    day_of_week = models.CharField(max_length=10, choices=DAY_OF_WEEK, verbose_name='День недели')
    start_time = models.TimeField(verbose_name='Начало')
    end_time = models.TimeField(verbose_name='Окончание')

    class Meta:
        verbose_name = 'Расписание'
        verbose_name_plural = 'Расписание'
        unique_together = ('day_of_week', 'start_time', 'room')  # простая защита от пересечений

    def __str__(self):
        return f"{self.course} – {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class Exam(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, verbose_name='Курс')
    date = models.DateTimeField(verbose_name='Дата и время экзамена')
    students = models.ManyToManyField(Student, through='ExamResult', verbose_name='Студенты')

    def __str__(self):
        return f"Экзамен по {self.course} – {self.date.strftime('%d.%m.%Y %H:%M')}"

    class Meta:
        verbose_name = 'Экзамен'
        verbose_name_plural = 'Экзамены'


class ExamResult(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    grade = models.PositiveSmallIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)],
                                             verbose_name='Оценка')
    attended = models.BooleanField(default=True, verbose_name='Явка')

    class Meta:
        unique_together = ('exam', 'student')
        verbose_name = 'Результат экзамена'
        verbose_name_plural = 'Результаты экзаменов'


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('paid', 'Оплачено'),
        ('overdue', 'Просрочено'),
        ('canceled', 'Отменено'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE,
                                related_name='payments', verbose_name='Студент')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Сумма')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    date_created = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    date_paid = models.DateTimeField(null=True, blank=True, verbose_name='Дата оплаты')

    def __str__(self):
        return f"{self.student} – {self.amount} руб. ({self.get_status_display()})"

    class Meta:
        verbose_name = 'Платёж'
        verbose_name_plural = 'Платежи'
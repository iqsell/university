from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from university_app.views import (
    report_students_above_average,
    report_teacher_schedule,
    report_course_average,
    report_top_5_students,
    report_debtors
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static
from university_app import views

# Роутер для всех ViewSet'ов
router = DefaultRouter()
router.register(r'departments', views.DepartmentViewSet)
router.register(r'teachers', views.TeacherViewSet)
router.register(r'students', views.StudentViewSet)
router.register(r'courses', views.CourseViewSet)
router.register(r'enrollments', views.EnrollmentViewSet)
router.register(r'schedules', views.ScheduleViewSet)
router.register(r'exams', views.ExamViewSet)
router.register(r'payments', views.PaymentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API
    path('api/', include(router.urls)),

    # JWT авторизация
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # OpenAPI документация
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    path('api/reports/students-above-average/', report_students_above_average, name='students_above_average'),
    path('api/reports/teacher-schedule/<int:teacher_id>/', report_teacher_schedule, name='teacher_schedule'),
    path('api/reports/course-average/<int:course_id>/', report_course_average, name='course_average'),
    path('api/reports/top-5-students/', report_top_5_students, name='top_5_students'),
    path('api/reports/debtors/', report_debtors, name='debtors'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


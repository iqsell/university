from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

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
]

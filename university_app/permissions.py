from rest_framework import permissions


class RoleBasedPermission(permissions.BasePermission):
    """
    Права доступа по ролям:
    - admin: всё
    - teacher: свои курсы, студенты на курсах, своё расписание
    - student: только свои данные
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        role = request.user.role

        if role == 'admin':
            return True

        if role == 'teacher':

            if view.basename == 'course' and request.method in ['POST', 'PUT', 'PATCH']:
                return request.data.get('teacher') == request.user.teacher_profile_id
            return True

        if role == 'student':
            return request.method in permissions.SAFE_METHODS

        return False

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        role = request.user.role

        if role == 'admin':
            return True

        if role == 'teacher':

            if hasattr(obj, 'teacher'):
                return obj.teacher == request.user.teacher_profile
            if hasattr(obj, 'course') and hasattr(obj.course, 'teacher'):
                return obj.course.teacher == request.user.teacher_profile
            return True

        if role == 'student':
            return getattr(obj, 'student', None) == request.user.student_profile

        return False

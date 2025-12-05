from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog


@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if getattr(sender, '_meta', None) is None:
        return
    if sender._meta.app_label in ['admin', 'auth', 'contenttypes', 'sessions', 'django_celery_beat']:
        return
    if sender == AuditLog:
        return

    if hasattr(sender, '_meta') and sender._meta.db_table == 'django_migrations':
        return

    action = 'create' if created else 'update'
    changes = None
    user = None

    if hasattr(instance, 'request'):
        try:
            if instance.request.user.is_authenticated:
                user = instance.request.user
        except:
            pass

    if not created and hasattr(instance, '_audit_old_state'):
        old = instance._audit_old_state
        changes = {}
        for field in instance._meta.fields:
            if field.name in ['password', 'last_login']:
                continue
            old_val = getattr(old, field.name, None)
            new_val = getattr(instance, field.name, None)
            if str(old_val) != str(new_val):
                changes[field.verbose_name or field.name] = {
                    'old': str(old_val) if old_val is not None else None,
                    'new': str(new_val) if new_val is not None else None
                }

    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=sender._meta.verbose_name,
        object_id=getattr(instance, 'pk', None),
        object_repr=str(instance)[:200],
        changes=changes
    )


@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if sender == AuditLog or sender._meta.app_label in ['admin', 'auth', 'contenttypes', 'sessions']:
        return
    if hasattr(sender, '_meta') and sender._meta.db_table == 'django_migrations':
        return

    user = None
    if hasattr(instance, 'request'):
        try:
            if instance.request.user.is_authenticated:
                user = instance.request.user
        except:
            pass

    AuditLog.objects.create(
        user=user,
        action='delete',
        model_name=sender._meta.verbose_name,
        object_id=getattr(instance, 'pk', None),
        object_repr=str(instance)[:200]
    )

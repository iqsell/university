# university/celery_app.py — ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ WINDOWS + Python 3.13
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'university.settings')

app = Celery('university')

# ← КРИТИЧЕСКИ ВАЖНАЯ СТРОКА ДЛЯ WINDOWS!
app.conf.task_eager_propagates = True
app.conf.task_always_eager = False  # False = асинхронно, True = синхронно (для теста)

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
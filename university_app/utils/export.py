# university_app/utils/export.py
import csv
from django.http import HttpResponse
from weasyprint import HTML
from django.template.loader import render_to_string
from django.utils import timezone


def export_students_csv(queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="students_{timezone.now().strftime("%Y%m%d")}.csv"'
    response.write(u'\ufeff'.encode('utf8'))  # BOM для Excel

    writer = csv.writer(response)
    writer.writerow(['ID', 'ФИО', 'Email', 'GPA', 'Статус'])

    for s in queryset:
        writer.writerow([s.id, s.full_name, s.email, s.gpa, s.get_status_display()])

    return response


def export_students_pdf(queryset):
    html_string = render_to_string('reports/students_pdf.html', {
        'students': queryset,
        'title': 'Отчёт по студентам',
        'generated_at': timezone.now()
    })
    html = HTML(string=html_string)
    pdf = html.write_pdf()

    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="students_report_{timezone.now().strftime("%Y%m%d")}.pdf"'
    return response
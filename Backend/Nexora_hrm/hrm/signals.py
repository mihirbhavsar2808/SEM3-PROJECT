import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Employee
from .emails import send_employee_welcome_email

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Employee)
def employee_created_send_welcome_email(sender, instance, created, **kwargs):
    """
    Triggered when an Employee record is saved.
    Sends a company welcome email to the newly entered employee's email on creation.
    """
    if created and instance.email:
        raw_password = getattr(instance, "_raw_password", "Employee@123")
        logger.info(
            "New employee created: %s (%s, %s). Triggering welcome email...",
            instance.name,
            instance.employee_code,
            instance.email,
        )
        try:
            from accounts.models import User
            user = User.objects.filter(email__iexact=instance.email).first()
            name_parts = (instance.name or "").split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""

            if not user:
                User.objects.create_user(
                    email=instance.email,
                    password=raw_password,
                    first_name=first_name,
                    last_name=last_name,
                    role=User.Role.EMPLOYEE,
                )
                logger.info("Created User account for employee %s with role=employee", instance.email)
            else:
                user.set_password(raw_password)
                user.first_name = first_name
                user.last_name = last_name
                user.role = User.Role.EMPLOYEE
                user.save()
                logger.info("Synchronized existing User account for employee %s with new password", instance.email)
        except Exception as e:
            logger.warning("Could not auto-create user for employee %s: %s", instance.email, e)

        # 2. Auto-create today's Attendance
        try:
            from django.utils import timezone
            from .models import Attendance
            today = timezone.localdate()
            Attendance.objects.get_or_create(
                employee=instance,
                date=today,
                defaults={
                    "status": Attendance.Status.PRESENT,
                    "check_in": "09:30 AM",
                    "check_out": "--",
                }
            )
        except Exception as e:
            logger.warning("Could not create initial attendance for employee %s: %s", instance.email, e)

        # 3. Auto-create Leave Balances for all leave types
        try:
            from django.utils import timezone
            from .models import LeaveType, LeaveBalance
            current_year = timezone.localdate().year
            for lt in LeaveType.objects.all():
                LeaveBalance.objects.get_or_create(
                    employee=instance,
                    leave_type=lt,
                    year=current_year,
                    defaults={"allocated": lt.days_allowed, "used": 0}
                )
        except Exception as e:
            logger.warning("Could not create initial leave balances for employee %s: %s", instance.email, e)

        # 4. Auto-create current month's Payroll
        try:
            from django.utils import timezone
            from .models import Payroll
            current_month = timezone.localdate().strftime("%B %Y")
            salary = float(instance.salary or 0)
            Payroll.objects.get_or_create(
                employee=instance,
                month=current_month,
                defaults={
                    "basic": salary,
                    "allowances": 0,
                    "deductions": 0,
                    "net": salary,
                    "status": Payroll.Status.PENDING,
                }
            )
        except Exception as e:
            logger.warning("Could not create initial payroll for employee %s: %s", instance.email, e)

        # 5. Auto-create Performance Review
        try:
            from .models import PerformanceReview
            PerformanceReview.objects.get_or_create(
                employee=instance,
                period="H1 2026",
                defaults={
                    "reviewer": "Admin",
                    "rating": 5,
                    "status": PerformanceReview.Status.COMPLETED,
                    "comments": f"{instance.name} is demonstrating strong performance, productivity, and team collaboration.",
                }
            )
        except Exception as e:
            logger.warning("Could not create initial performance review for employee %s: %s", instance.email, e)

        # 6. Welcome Email with login credentials
        send_employee_welcome_email(instance, password=raw_password)




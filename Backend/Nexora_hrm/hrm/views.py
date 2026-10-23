from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from subscriptions.permissions import HasActiveSubscription

from .models import (
    Announcement, Asset, Attendance, Candidate, Department, Designation,
    Employee, Expense, Holiday, Job, LeaveBalance, LeaveRequest, LeaveType,
    Overtime, Payroll, PerformanceReview, Shift, Training, TrainingEnrollment,
)
from .serializers import (
    AnnouncementSerializer, AssetSerializer, AttendanceListSerializer,
    AttendanceSerializer, CandidateListSerializer, CandidateSerializer,
    DepartmentSerializer, DesignationSerializer, EmployeeListSerializer,
    EmployeeSerializer, ExpenseSerializer, HolidaySerializer,
    JobListSerializer, JobSerializer, LeaveBalanceSerializer,
    LeaveListSerializer, LeaveRequestSerializer, LeaveTypeSerializer,
    OvertimeSerializer, PayrollListSerializer, PayrollSerializer,
    PerformanceListSerializer, PerformanceReviewSerializer, ShiftSerializer,
    TrainingEnrollmentSerializer, TrainingSerializer,
)
from .emails import send_employee_welcome_email, send_payroll_payslip_email



# ── Department ────────────────────────────────────────────────────────────────

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset         = Department.objects.all()
    serializer_class = DepartmentSerializer
    search_fields    = ["name", "head"]
    ordering_fields  = ["name"]

    permission_classes = [IsAuthenticated,HasActiveSubscription]

# ── Designation ───────────────────────────────────────────────────────────────

class DesignationViewSet(viewsets.ModelViewSet):
    queryset         = Designation.objects.select_related("department").all()
    serializer_class = DesignationSerializer
    filterset_fields = ["department"]
    search_fields    = ["title"]

    permission_classes = [IsAuthenticated,HasActiveSubscription]

# ── Shift ─────────────────────────────────────────────────────────────────────

class ShiftViewSet(viewsets.ModelViewSet):
    queryset         = Shift.objects.all()
    serializer_class = ShiftSerializer

    permission_classes = [IsAuthenticated,HasActiveSubscription]

# ── Employee ──────────────────────────────────────────────────────────────────

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset         = Employee.objects.select_related("department", "designation", "shift").all()
    filterset_fields = ["status", "department", "location"]
    search_fields    = ["name", "email", "employee_code", "role"]
    ordering_fields  = ["name", "join_date", "salary"]

    def get_serializer_class(self):
        return EmployeeListSerializer if self.action == "list" else EmployeeSerializer

    @action(detail=False, methods=["get"])
    def active(self, request):
        qs = self.queryset.filter(status=Employee.Status.ACTIVE)
        return Response(EmployeeListSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        emp = self.get_object()
        emp.status = Employee.Status.INACTIVE
        emp.save(update_fields=["status"])
        return Response({"detail": "Employee deactivated."})

    @action(detail=True, methods=["post"])
    def send_welcome_email(self, request, pk=None):
        emp = self.get_object()
        if not emp.email:
            return Response({"error": "Employee does not have an email address."}, status=status.HTTP_400_BAD_REQUEST)
        sent = send_employee_welcome_email(emp)
        if sent:
            return Response({"detail": f"Welcome email sent successfully to {emp.email}"})
        return Response(
            {"detail": f"Failed to send email to {emp.email}. Check email server settings in .env."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    permission_classes = [IsAuthenticated,HasActiveSubscription]



# ── Holiday ───────────────────────────────────────────────────────────────────

class HolidayViewSet(viewsets.ModelViewSet):
    queryset         = Holiday.objects.all()
    serializer_class = HolidaySerializer
    filterset_fields = ["type"]
    ordering_fields  = ["date"]

    permission_classes = [IsAuthenticated,HasActiveSubscription]



# ── Leave ─────────────────────────────────────────────────────────────────────

class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset         = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer

    permission_classes = [IsAuthenticated,HasActiveSubscription]

class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset         = LeaveBalance.objects.select_related("employee", "leave_type").all()
    serializer_class = LeaveBalanceSerializer
    filterset_fields = ["employee", "leave_type", "year"]

    permission_classes = [IsAuthenticated,HasActiveSubscription]


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset         = LeaveRequest.objects.select_related("employee", "leave_type").all()
    filterset_fields = ["status", "leave_type", "employee"]
    search_fields    = ["employee__name", "status"]
    ordering_fields  = ["from_date", "created_at"]

    def get_serializer_class(self):
        return LeaveListSerializer if self.action == "list" else LeaveRequestSerializer

    def perform_create(self, serializer):
        extra = {}
        if not serializer.validated_data.get("employee") and hasattr(self.request.user, "email"):
            emp = Employee.objects.filter(email__iexact=self.request.user.email).first()
            if emp:
                extra["employee"] = emp
        serializer.save(**extra)

    @action(detail=False, methods=["get", "post"])
    def my_leaves(self, request):
        emp = Employee.objects.filter(email__iexact=request.user.email).first()
        if request.method == "POST":
            data = request.data.copy()
            s = LeaveRequestSerializer(data=data)
            s.is_valid(raise_exception=True)
            leave = s.save(employee=emp if emp else s.validated_data.get("employee"))
            return Response(LeaveListSerializer(leave).data, status=status.HTTP_201_CREATED)

        if not emp:
            # If user has no direct match, return empty list or fallback
            return Response([])
        qs = self.queryset.filter(employee=emp)
        return Response(LeaveListSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != LeaveRequest.Status.PENDING:
            return Response({"detail": "Only pending requests can be approved."}, status=400)
        leave.status = LeaveRequest.Status.APPROVED
        leave.save(update_fields=["status"])
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != LeaveRequest.Status.PENDING:
            return Response({"detail": "Only pending requests can be rejected."}, status=400)
        leave.status = LeaveRequest.Status.REJECTED
        leave.save(update_fields=["status"])
        return Response(LeaveRequestSerializer(leave).data)

    permission_classes = [IsAuthenticated,HasActiveSubscription]


# ── Attendance ────────────────────────────────────────────────────────────────

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset         = Attendance.objects.select_related("employee", "employee__department").all()
    filterset_fields = ["status", "date", "employee"]
    search_fields    = ["employee__name"]
    ordering_fields  = ["date"]

    def get_serializer_class(self):
        return AttendanceListSerializer if self.action == "list" else AttendanceSerializer

    def list(self, request, *args, **kwargs):
        # Auto-ensure all active employees have an attendance record for the date
        today = timezone.localdate()
        date_param = request.query_params.get("date")
        target_date = today
        if date_param:
            try:
                from datetime import date
                target_date = date.fromisoformat(date_param)
            except ValueError:
                target_date = today

        active_emps = Employee.objects.filter(status=Employee.Status.ACTIVE)
        for emp in active_emps:
            Attendance.objects.get_or_create(
                employee=emp,
                date=target_date,
                defaults={
                    "status": Attendance.Status.PRESENT,
                    "check_in": "09:30 AM",
                    "check_out": "--",
                }
            )
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def today(self, request):
        today = timezone.localdate()
        active_emps = Employee.objects.filter(status=Employee.Status.ACTIVE)
        for emp in active_emps:
            Attendance.objects.get_or_create(
                employee=emp,
                date=today,
                defaults={
                    "status": Attendance.Status.PRESENT,
                    "check_in": "09:30 AM",
                    "check_out": "--",
                }
            )
        qs = self.queryset.filter(date=today)
        return Response(AttendanceListSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def mark_status(self, request, pk=None):
        att = self.get_object()
        new_status = request.data.get("status")
        if new_status in [c[0] for c in Attendance.Status.choices]:
            att.status = new_status
            if new_status == Attendance.Status.ABSENT:
                att.check_in = "--"
                att.check_out = "--"
            elif att.check_in == "--":
                att.check_in = "09:30 AM"
            att.save()
            return Response(AttendanceListSerializer(att).data)
        return Response({"detail": "Invalid status value"}, status=400)

    @action(detail=False, methods=["post"])
    def bulk_mark(self, request):
        status_val = request.data.get("status", Attendance.Status.PRESENT)
        today = timezone.localdate()
        date_param = request.data.get("date")
        target_date = today
        if date_param:
            try:
                from datetime import date
                target_date = date.fromisoformat(date_param)
            except ValueError:
                target_date = today

        active_emps = Employee.objects.filter(status=Employee.Status.ACTIVE)
        updated = 0
        for emp in active_emps:
            obj, _ = Attendance.objects.get_or_create(
                employee=emp,
                date=target_date,
                defaults={"status": status_val, "check_in": "09:30 AM", "check_out": "--"}
            )
            obj.status = status_val
            obj.save(update_fields=["status"])
            updated += 1
        return Response({"detail": f"Updated attendance to {status_val} for {updated} employees.", "updated": updated})

    @action(detail=False, methods=["get"])
    def summary(self, request):
        date = request.query_params.get("date", str(timezone.localdate()))
        qs   = Attendance.objects.filter(date=date)
        data = qs.values("status").annotate(count=Count("id"))
        total_active = Employee.objects.filter(status=Employee.Status.ACTIVE).count()
        return Response({"date": date, "total_active": total_active, "breakdown": list(data)})

    permission_classes = [IsAuthenticated, HasActiveSubscription]



# ── Payroll ───────────────────────────────────────────────────────────────────

class PayrollViewSet(viewsets.ModelViewSet):
    queryset         = Payroll.objects.select_related("employee", "employee__department").all()
    filterset_fields = ["status", "month", "employee"]
    search_fields    = ["employee__name", "month"]
    ordering_fields  = ["created_at", "net"]

    def get_serializer_class(self):
        return PayrollListSerializer if self.action == "list" else PayrollSerializer

    def list(self, request, *args, **kwargs):
        current_month = timezone.localdate().strftime("%B %Y")
        active_emps = Employee.objects.filter(status=Employee.Status.ACTIVE)
        for emp in active_emps:
            salary = float(emp.salary or 0)
            Payroll.objects.get_or_create(
                employee=emp,
                month=current_month,
                defaults={
                    "basic": salary,
                    "allowances": 0,
                    "deductions": 0,
                    "net": salary,
                    "status": Payroll.Status.PENDING,
                }
            )
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        record = self.get_object()
        record.status = Payroll.Status.PAID
        record.save(update_fields=["status"])
        return Response(PayrollSerializer(record).data)

    @action(detail=True, methods=["post"])
    def send_payslip(self, request, pk=None):
        """
        Sends the complete payslip directly to the employee's registered email address.
        """
        record = self.get_object()
        if not record.employee or not record.employee.email:
            return Response(
                {"detail": "This employee does not have a registered email address to receive payslips."},
                status=400,
            )

        ok, msg = send_payroll_payslip_email(record)
        if ok:
            return Response({
                "detail": f"Payslip for {record.month} successfully emailed to {record.employee.email}.",
                "email": record.employee.email,
                "status": "success",
            })
        else:
            return Response(
                {"detail": f"Failed to send payslip email: {msg}"},
                status=500,
            )

    @action(detail=False, methods=["post"])
    def bulk_send_payslips(self, request):
        """
        Sends payslip emails to all employees for a given month.
        """
        month = request.data.get("month")
        if not month:
            return Response({"detail": "month is required (e.g. 'October 2026')."}, status=400)

        records = Payroll.objects.filter(month=month).select_related("employee", "employee__department")
        if not records.exists():
            return Response({"detail": f"No payroll records found for {month}."}, status=404)

        sent_count = 0
        recipients = []
        errors = []

        for p in records:
            if p.employee and p.employee.email:
                ok, msg = send_payroll_payslip_email(p)
                if ok:
                    sent_count += 1
                    recipients.append(p.employee.email)
                else:
                    errors.append(f"{p.employee.name} ({p.employee.email}): {msg}")

        return Response({
            "detail": f"Successfully emailed payslips to {sent_count} employees for {month}.",
            "sent_count": sent_count,
            "recipients": recipients,
            "errors": errors,
        })

    @action(detail=False, methods=["post"])
    def bulk_mark_paid(self, request):
        """
        Marks all pending payroll records for a given month as Paid.
        """
        month = request.data.get("month")
        if not month:
            return Response({"detail": "month is required (e.g. 'October 2026')."}, status=400)

        qs = Payroll.objects.filter(month=month)
        updated = qs.filter(status=Payroll.Status.PENDING).update(status=Payroll.Status.PAID)
        return Response({
            "detail": f"Marked {updated} payroll records as Paid for {month}.",
            "updated": updated,
            "total_for_month": qs.count(),
        })

    @action(detail=False, methods=["post"])
    def bulk_process(self, request):
        """
        Auto-generate / sync payroll for all active employees for a given month.
        - Basic pay  = Employee's salary (set at joining, stays fixed)
        - Deductions = (salary / 30) × approved leave days in that month
        - Net pay    = basic - deductions
        """
        import calendar
        from datetime import date

        month = request.data.get("month")
        if not month:
            return Response({"detail": "month is required (e.g. 'October 2026')."}, status=400)

        # Parse "October 2026" or similar → (year, month_number)
        try:
            parts = month.strip().split()
            month_names = {
                "January": 1, "February": 2, "March": 3, "April": 4,
                "May": 5, "June": 6, "July": 7, "August": 8,
                "September": 9, "October": 10, "November": 11, "December": 12,
            }
            m_num = month_names.get(parts[0].capitalize())
            y_num = int(parts[1])
            if not m_num:
                raise ValueError("Invalid month name")
            month_start = date(y_num, m_num, 1)
            month_end   = date(y_num, m_num, calendar.monthrange(y_num, m_num)[1])
        except (IndexError, ValueError, KeyError):
            return Response(
                {"detail": "Invalid month format. Use format like 'October 2026'."},
                status=400,
            )

        employees = Employee.objects.filter(status=Employee.Status.ACTIVE)
        created = 0
        updated = 0
        results = []

        for emp in employees:
            salary = float(emp.salary or 0)
            basic  = round(salary, 2)

            # Count approved leave days that overlap with this month
            approved_leaves = LeaveRequest.objects.filter(
                employee=emp,
                status=LeaveRequest.Status.APPROVED,
                from_date__lte=month_end,
                to_date__gte=month_start,
            )
            total_leave_days = 0
            for leave in approved_leaves:
                eff_start = max(leave.from_date, month_start)
                eff_end   = min(leave.to_date, month_end)
                days_in_month = (eff_end - eff_start).days + 1
                total_leave_days += max(0, days_in_month)

            per_day      = round(salary / 30, 2) if salary > 0 else 0
            deductions   = round(per_day * total_leave_days, 2)
            allowances   = 0
            net          = round(max(0, basic + allowances - deductions), 2)

            obj, was_created = Payroll.objects.get_or_create(
                employee=emp, month=month,
                defaults={
                    "basic": basic,
                    "allowances": allowances,
                    "deductions": deductions,
                    "net": net,
                    "status": Payroll.Status.PENDING,
                },
            )
            if was_created:
                created += 1
            else:
                if obj.status == Payroll.Status.PENDING:
                    obj.basic = basic
                    obj.deductions = deductions
                    obj.net = net
                    obj.save(update_fields=["basic", "deductions", "net"])
                    updated += 1

            results.append({
                "employee": emp.name,
                "email": emp.email,
                "basic": basic,
                "leave_days": total_leave_days,
                "deductions": deductions,
                "net": net,
                "status": obj.status,
            })

        return Response({
            "detail": f"Payroll synchronized for {created + updated} employees ({created} new, {updated} updated).",
            "month": month,
            "created": created,
            "updated": updated,
            "total_employees": employees.count(),
            "records": results,
        })

    permission_classes = [IsAuthenticated, HasActiveSubscription]

# ── Overtime ──────────────────────────────────────────────────────────────────

class OvertimeViewSet(viewsets.ModelViewSet):
    queryset         = Overtime.objects.select_related("employee").all()
    serializer_class = OvertimeSerializer
    filterset_fields = ["status", "employee"]
    ordering_fields  = ["date"]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        obj = self.get_object()
        obj.status = Overtime.Status.APPROVED
        obj.save(update_fields=["status"])
        return Response(OvertimeSerializer(obj).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        obj = self.get_object()
        obj.status = Overtime.Status.REJECTED
        obj.save(update_fields=["status"])
        return Response(OvertimeSerializer(obj).data)

    permission_classes = [IsAuthenticated,HasActiveSubscription]

# ── Expense ───────────────────────────────────────────────────────────────────

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset         = Expense.objects.select_related("employee").all()
    serializer_class = ExpenseSerializer
    filterset_fields = ["status", "category", "employee"]
    ordering_fields  = ["date", "amount"]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        obj = self.get_object()
        obj.status = Expense.Status.APPROVED
        obj.save(update_fields=["status"])
        return Response(ExpenseSerializer(obj).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        obj = self.get_object()
        obj.status = Expense.Status.REJECTED
        obj.save(update_fields=["status"])
        return Response(ExpenseSerializer(obj).data)

    permission_classes = [IsAuthenticated,HasActiveSubscription]


# ── Recruitment ───────────────────────────────────────────────────────────────

class JobViewSet(viewsets.ModelViewSet):
    queryset         = Job.objects.select_related("department").prefetch_related("candidates").all()
    filterset_fields = ["status", "department", "job_type"]
    search_fields    = ["title", "location"]
    ordering_fields  = ["created_at", "title"]

    def get_serializer_class(self):
        return JobListSerializer if self.action == "list" else JobSerializer

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        job = self.get_object()
        job.status = Job.Status.CLOSED
        job.save(update_fields=["status"])
        return Response({"detail": "Job closed."})

    permission_classes = [IsAuthenticated,HasActiveSubscription]


class CandidateViewSet(viewsets.ModelViewSet):
    queryset         = Candidate.objects.select_related("job").all()
    filterset_fields = ["stage", "job"]
    search_fields    = ["name", "email"]
    ordering_fields  = ["applied_date"]

    def get_serializer_class(self):
        return CandidateListSerializer if self.action == "list" else CandidateSerializer

    @action(detail=True, methods=["post"])
    def move_stage(self, request, pk=None):
        candidate = self.get_object()
        new_stage = request.data.get("stage")
        valid = [s[0] for s in Candidate.Stage.choices]
        if new_stage not in valid:
            return Response({"detail": f"Invalid stage. Choose from: {valid}"}, status=400)
        candidate.stage = new_stage
        candidate.save(update_fields=["stage"])
        return Response(CandidateSerializer(candidate).data)

    permission_classes = [IsAuthenticated,HasActiveSubscription]


# ── Performance ───────────────────────────────────────────────────────────────

class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset         = PerformanceReview.objects.select_related("employee", "employee__department").all()
    filterset_fields = ["status", "employee"]
    search_fields    = ["employee__name", "reviewer", "period"]
    ordering_fields  = ["created_at", "rating"]

    def get_serializer_class(self):
        return PerformanceListSerializer if self.action == "list" else PerformanceReviewSerializer

    def list(self, request, *args, **kwargs):
        active_emps = Employee.objects.filter(status=Employee.Status.ACTIVE)
        for emp in active_emps:
            PerformanceReview.objects.get_or_create(
                employee=emp,
                period="H1 2026",
                defaults={
                    "reviewer": "Admin",
                    "rating": 5,
                    "status": PerformanceReview.Status.COMPLETED,
                    "comments": f"{emp.name} is demonstrating strong performance, productivity, and team collaboration.",
                }
            )
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        review = self.get_object()
        review.status = PerformanceReview.Status.COMPLETED
        review.save(update_fields=["status"])
        return Response(PerformanceReviewSerializer(review).data)

    permission_classes = [IsAuthenticated,HasActiveSubscription]

# ── Training ──────────────────────────────────────────────────────────────────

class TrainingViewSet(viewsets.ModelViewSet):
    queryset         = Training.objects.prefetch_related("enrollments").all()
    serializer_class = TrainingSerializer
    filterset_fields = ["status"]
    search_fields    = ["title", "trainer"]
    ordering_fields  = ["start_date"]

    permission_classes = [IsAuthenticated,HasActiveSubscription]


class TrainingEnrollmentViewSet(viewsets.ModelViewSet):
    queryset         = TrainingEnrollment.objects.select_related("training", "employee").all()
    serializer_class = TrainingEnrollmentSerializer
    filterset_fields = ["training", "employee", "completed"]

    permission_classes = [IsAuthenticated,HasActiveSubscription]


# ── Asset ─────────────────────────────────────────────────────────────────────

class AssetViewSet(viewsets.ModelViewSet):
    queryset         = Asset.objects.select_related("assigned_to").all()
    serializer_class = AssetSerializer
    filterset_fields = ["status", "category", "assigned_to"]
    search_fields    = ["name", "asset_code", "serial_number"]

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        asset       = self.get_object()
        employee_id = request.data.get("employee_id")
        try:
            employee = Employee.objects.get(pk=employee_id)
        except Employee.DoesNotExist:
            return Response({"detail": "Employee not found."}, status=404)
        asset.assigned_to = employee
        asset.status      = Asset.Status.ASSIGNED
        asset.save(update_fields=["assigned_to", "status"])
        return Response(AssetSerializer(asset).data)

    @action(detail=True, methods=["post"])
    def return_asset(self, request, pk=None):
        asset = self.get_object()
        asset.assigned_to = None
        asset.status      = Asset.Status.AVAILABLE
        asset.save(update_fields=["assigned_to", "status"])
        return Response(AssetSerializer(asset).data)

    permission_classes = [IsAuthenticated,HasActiveSubscription]


# ── Announcement ──────────────────────────────────────────────────────────────

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset         = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    filterset_fields = ["priority", "is_active"]
    ordering_fields  = ["created_at"]

    permission_classes = [IsAuthenticated,HasActiveSubscription]


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    def get(self, request):
        today    = timezone.localdate()
        employees = Employee.objects.all()
        leaves    = LeaveRequest.objects.all()
        att_today = Attendance.objects.filter(date=today)
        payroll   = Payroll.objects.all()

        dept_breakdown = (
            Department.objects
            .annotate(count=Count("employees"))
            .values("name", "color", "count")
        )

        headcount_trend = []
        for i in range(5, -1, -1):
            from dateutil.relativedelta import relativedelta
            month_date = today - relativedelta(months=i)
            label = month_date.strftime("%b")
            count = Employee.objects.filter(join_date__lte=month_date).count()
            headcount_trend.append({"month": label, "count": count})

        return Response({
            "total_employees":  employees.count(),
            "active_employees": employees.filter(status=Employee.Status.ACTIVE).count(),
            "on_leave":         employees.filter(status=Employee.Status.ON_LEAVE).count(),
            "inactive":         employees.filter(status=Employee.Status.INACTIVE).count(),
            "pending_leaves":   leaves.filter(status=LeaveRequest.Status.PENDING).count(),
            "approved_leaves":  leaves.filter(status=LeaveRequest.Status.APPROVED).count(),
            "present_today":    att_today.filter(status=Attendance.Status.PRESENT).count(),
            "late_today":       att_today.filter(status=Attendance.Status.LATE).count(),
            "wfh_today":        att_today.filter(status=Attendance.Status.WFH).count(),
            "absent_today":     att_today.filter(status=Attendance.Status.ABSENT).count(),
            "payroll_pending":  payroll.filter(status=Payroll.Status.PENDING).count(),
            "payroll_total_net": payroll.aggregate(total=Sum("net"))["total"] or 0,
            "open_jobs":        Job.objects.filter(status=Job.Status.OPEN).count(),
            "avg_rating":       PerformanceReview.objects.aggregate(avg=Avg("rating"))["avg"] or 0,
            "dept_breakdown":   list(dept_breakdown),
            "headcount_trend":  headcount_trend,
        })

    permission_classes = [IsAuthenticated,HasActiveSubscription]


# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        notifications = []
        is_admin = getattr(user, "role", "") in ["hr", "admin"] or user.is_superuser or user.is_staff
        today = timezone.localdate()

        if is_admin:
            # 1. Pending Leave Requests
            pending_leaves = LeaveRequest.objects.filter(status=LeaveRequest.Status.PENDING).select_related("employee", "leave_type")[:10]
            for lr in pending_leaves:
                notifications.append({
                    "id": f"leave-{lr.id}",
                    "title": "Pending Leave Request",
                    "message": f"{lr.employee.name} applied for {lr.leave_type.name if lr.leave_type else 'Leave'} ({lr.days}d) from {lr.from_date}",
                    "category": "leave",
                    "target": "leave",
                    "time": "Needs Approval",
                    "dot": "#B9790A",
                    "badge": "Leave",
                    "priority": "high",
                })

            # 2. Attendance Summary Today
            att_qs = Attendance.objects.filter(date=today)
            present_cnt = att_qs.filter(status__in=[Attendance.Status.PRESENT, Attendance.Status.WFH]).count()
            absent_cnt = att_qs.filter(status=Attendance.Status.ABSENT).count()
            late_cnt = att_qs.filter(status=Attendance.Status.LATE).count()
            total_active = Employee.objects.filter(status=Employee.Status.ACTIVE).count()
            notifications.append({
                "id": "att-today",
                "title": "Today's Attendance Status",
                "message": f"{present_cnt}/{total_active} active employees present today ({late_cnt} late, {absent_cnt} absent).",
                "category": "attendance",
                "target": "attendance",
                "time": "Today",
                "dot": "#1F8A70",
                "badge": "Attendance",
                "priority": "normal",
            })

            # 3. Payroll Status for Current Month
            current_month = today.strftime("%B %Y")
            pay_qs = Payroll.objects.filter(month=current_month)
            pending_pay = pay_qs.filter(status=Payroll.Status.PENDING).count()
            paid_pay = pay_qs.filter(status=Payroll.Status.PAID).count()
            if pending_pay > 0:
                notifications.append({
                    "id": f"payroll-{current_month.replace(' ', '-')}",
                    "title": f"Payroll Review ({current_month})",
                    "message": f"{pending_pay} employee salary records pending payment disbursal.",
                    "category": "payroll",
                    "target": "payroll",
                    "time": current_month,
                    "dot": "#2A5C9A",
                    "badge": "Payroll",
                    "priority": "high",
                })
            elif paid_pay > 0:
                notifications.append({
                    "id": f"payroll-paid-{current_month.replace(' ', '-')}",
                    "title": f"Payroll Disbursed ({current_month})",
                    "message": f"All {paid_pay} payroll records for {current_month} marked as Paid.",
                    "category": "payroll",
                    "target": "payroll",
                    "time": current_month,
                    "dot": "#1F8A70",
                    "badge": "Payroll",
                    "priority": "normal",
                })

            # 4. Active Department / Staff Overview
            notifications.append({
                "id": "dept-overview",
                "title": "Connected Workforce",
                "message": f"{total_active} active employees assigned across organizational departments.",
                "category": "departments",
                "target": "departments",
                "time": "Roster",
                "dot": "#6B46A8",
                "badge": "Departments",
                "priority": "normal",
            })

            # 5. Announcements
            announcements = Announcement.objects.filter(is_active=True).order_by("-created_at")[:5]
            for a in announcements:
                notifications.append({
                    "id": f"ann-{a.id}",
                    "title": a.title,
                    "message": a.content[:95] + ("..." if len(a.content) > 95 else ""),
                    "category": "announcement",
                    "target": "dashboard",
                    "time": "Notice",
                    "dot": "#C4432F" if a.priority in ["Urgent", "High"] else "#1471A8",
                    "badge": a.priority,
                    "priority": a.priority.lower(),
                })

        else:
            # Employee Portal Notifications
            emp = Employee.objects.filter(email__iexact=user.email).first()
            if emp:
                # 1. Today's Attendance
                att = Attendance.objects.filter(employee=emp, date=today).first()
                if att:
                    notifications.append({
                        "id": f"myatt-{att.id}",
                        "title": f"Attendance: {att.status}",
                        "message": f"Your check-in was logged at {att.check_in} today. Status is {att.status}.",
                        "category": "attendance",
                        "target": "user-attendance",
                        "time": "Today",
                        "dot": "#1F8A70" if att.status == "Present" else "#B9790A",
                        "badge": "Attendance",
                        "priority": "normal",
                    })

                # 2. My Leave Requests
                my_leaves = LeaveRequest.objects.filter(employee=emp).select_related("leave_type").order_by("-created_at")[:5]
                for lr in my_leaves:
                    dot_color = "#1F8A70" if lr.status == "Approved" else ("#C4432F" if lr.status == "Rejected" else "#B9790A")
                    notifications.append({
                        "id": f"myleave-{lr.id}",
                        "title": f"Leave Request {lr.status}",
                        "message": f"Your {lr.leave_type.name if lr.leave_type else 'Leave'} application ({lr.from_date} to {lr.to_date}) is {lr.status}.",
                        "category": "leave",
                        "target": "user-leave",
                        "time": lr.status,
                        "dot": dot_color,
                        "badge": "Leave",
                        "priority": "high" if lr.status != "Pending" else "normal",
                    })

                # 3. Latest Salary Payslip
                current_month = today.strftime("%B %Y")
                pay = Payroll.objects.filter(employee=emp, month=current_month).first()
                if not pay:
                    pay = Payroll.objects.filter(employee=emp).order_by("-created_at").first()
                if pay:
                    notifications.append({
                        "id": f"mypay-{pay.id}",
                        "title": f"Payslip: {pay.month}",
                        "message": f"Net take-home pay is ₹{float(pay.net):,.2f} ({pay.status}). Click to view dashboard.",
                        "category": "payroll",
                        "target": "user-dashboard",
                        "time": pay.month,
                        "dot": "#2A5C9A",
                        "badge": "Payslip",
                        "priority": "normal",
                    })

                # 4. Profile Status
                notifications.append({
                    "id": f"myprof-{emp.id}",
                    "title": "Employee Profile Active",
                    "message": f"Registered as {emp.role} in {emp.department.name if emp.department else 'Engineering'}.",
                    "category": "profile",
                    "target": "user-profile",
                    "time": "Active",
                    "dot": "#059669",
                    "badge": "Profile",
                    "priority": "normal",
                })

            # 5. Announcements for employees
            announcements = Announcement.objects.filter(is_active=True).order_by("-created_at")[:5]
            for a in announcements:
                notifications.append({
                    "id": f"ann-{a.id}",
                    "title": a.title,
                    "message": a.content[:95] + ("..." if len(a.content) > 95 else ""),
                    "category": "announcement",
                    "target": "user-dashboard",
                    "time": "Notice",
                    "dot": "#C4432F" if a.priority in ["Urgent", "High"] else "#1471A8",
                    "badge": a.priority,
                    "priority": a.priority.lower(),
                })

        return Response({"count": len(notifications), "results": notifications})


# ── Health ────────────────────────────────────────────────────────────────────

class HealthCheckView(APIView):
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok", "service": "ORbit HRM API"})

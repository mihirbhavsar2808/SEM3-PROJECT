from rest_framework import serializers
from .models import (
    Announcement, Asset, Attendance, Candidate, Department, Designation,
    Employee, Expense, Holiday, Job, LeaveBalance, LeaveRequest, LeaveType,
    Overtime, Payroll, PerformanceReview, Shift, Training, TrainingEnrollment,
)


# ── Department ────────────────────────────────────────────────────────────────

class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()

    class Meta:
        model  = Department
        fields = ("id", "name", "head", "color", "employee_count")

    def get_employee_count(self, obj):
        return obj.employees.count()


# ── Designation ───────────────────────────────────────────────────────────────

class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model  = Designation
        fields = ("id", "title", "department", "department_name")


# ── Shift ─────────────────────────────────────────────────────────────────────

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Shift
        fields = ("id", "name", "start_time", "end_time", "grace_mins")


# ── Employee ──────────────────────────────────────────────────────────────────

class EmployeeSerializer(serializers.ModelSerializer):
    department_name  = serializers.CharField(source="department.name",       read_only=True)
    designation_name = serializers.CharField(source="designation.title",     read_only=True)
    shift_name       = serializers.CharField(source="shift.name",            read_only=True)
    password         = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)

    class Meta:
        model  = Employee
        fields = (
            "id", "employee_code", "name", "email", "phone", "role",
            "department", "department_name", "designation", "designation_name",
            "shift", "shift_name", "manager", "status",
            "join_date", "salary", "location", "avatar",
            "address", "city", "state",
            "bank_name", "account_no", "ifsc",
            "emergency_name", "emergency_phone",
            "created_at", "updated_at", "password",
        )
        read_only_fields = ("id", "employee_code", "created_at", "updated_at")

    def create(self, validated_data):
        raw_password = validated_data.pop("password", None) or "Employee@123"
        employee = super().create(validated_data)
        employee._raw_password = raw_password

        # Ensure corresponding User account is created or updated
        if employee.email:
            try:
                from accounts.models import User
                user = User.objects.filter(email__iexact=employee.email).first()
                name_parts = (employee.name or "").split(" ", 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ""

                if not user:
                    User.objects.create_user(
                        email=employee.email,
                        password=raw_password,
                        first_name=first_name,
                        last_name=last_name,
                        role=User.Role.EMPLOYEE,
                    )
                else:
                    user.set_password(raw_password)
                    user.first_name = first_name
                    user.last_name = last_name
                    user.role = User.Role.EMPLOYEE
                    user.save()
            except Exception:
                pass
        return employee

    def update(self, instance, validated_data):
        raw_password = validated_data.pop("password", None)
        employee = super().update(instance, validated_data)
        if raw_password and employee.email:
            try:
                from accounts.models import User
                user = User.objects.filter(email__iexact=employee.email).first()
                if user:
                    user.set_password(raw_password)
                    user.save()
                else:
                    name_parts = (employee.name or "").split(" ", 1)
                    first_name = name_parts[0]
                    last_name = name_parts[1] if len(name_parts) > 1 else ""
                    User.objects.create_user(
                        email=employee.email,
                        password=raw_password,
                        first_name=first_name,
                        last_name=last_name,
                        role=User.Role.EMPLOYEE,
                    )
            except Exception:
                pass
        return employee

    def validate_phone(self, value):
        if value:
            cleaned = "".join(c for c in value if c.isdigit() or c == "+")
            if cleaned.startswith("+91"):
                digits = cleaned[3:]
                if len(digits) != 10 or digits[0] not in "6789":
                    raise serializers.ValidationError("Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.")
            elif len(cleaned.replace("+", "")) < 7:
                raise serializers.ValidationError("Phone number must contain at least 7 digits.")
        return value


class EmployeeListSerializer(serializers.ModelSerializer):
    """Flat shape matching the React frontend mock data keys."""
    id         = serializers.CharField(source="employee_code", read_only=True)
    pk         = serializers.IntegerField(source="id", read_only=True)
    department = serializers.CharField(source="department.name", read_only=True)
    joinDate   = serializers.DateField(source="join_date")

    class Meta:
        model  = Employee
        fields = ("id", "pk", "name", "email", "phone", "role", "department", "manager", "status", "joinDate", "salary", "location")



# ── Holiday ───────────────────────────────────────────────────────────────────

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Holiday
        fields = ("id", "name", "date", "type")


# ── Leave ─────────────────────────────────────────────────────────────────────

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LeaveType
        fields = ("id", "name", "days_allowed", "is_paid", "carry_forward")


class LeaveBalanceSerializer(serializers.ModelSerializer):
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    employee_name   = serializers.CharField(source="employee.name",   read_only=True)
    remaining       = serializers.ReadOnlyField()

    class Meta:
        model  = LeaveBalance
        fields = ("id", "employee", "employee_name", "leave_type", "leave_type_name", "year", "allocated", "used", "remaining")


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name   = serializers.CharField(source="employee.name",       read_only=True)
    employee_code   = serializers.CharField(source="employee.employee_code", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name",     read_only=True)
    name            = serializers.CharField(source="employee.name",       read_only=True)

    class Meta:
        model  = LeaveRequest
        fields = (
            "id", "employee", "employee_name", "employee_code", "name",
            "leave_type", "leave_type_name", "from_date", "to_date",
            "days", "status", "reason", "created_at",
        )
        read_only_fields = ("id", "created_at")
        extra_kwargs = {
            "employee": {"required": False},
            "leave_type": {"required": False},
        }

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        if "from" in data and "from_date" not in data:
            data["from_date"] = data["from"]
        if "to" in data and "to_date" not in data:
            data["to_date"] = data["to"]
        if "type" in data and "leave_type" not in data:
            lt_name = str(data["type"]).strip()
            lt = LeaveType.objects.filter(name__iexact=lt_name).first()
            if not lt and lt_name:
                lt, _ = LeaveType.objects.get_or_create(name=lt_name)
            if lt:
                data["leave_type"] = lt.id
        if "employee" not in data:
            if "employeeId" in data:
                emp = Employee.objects.filter(employee_code=data["employeeId"]).first()
                if emp:
                    data["employee"] = emp.id
            if "employee" not in data and "email" in data:
                emp = Employee.objects.filter(email__iexact=data["email"]).first()
                if emp:
                    data["employee"] = emp.id
        return super().to_internal_value(data)



class LeaveListSerializer(serializers.ModelSerializer):
    employeeId = serializers.CharField(source="employee.employee_code", read_only=True)
    name       = serializers.CharField(source="employee.name",          read_only=True)
    type       = serializers.CharField(source="leave_type.name",        read_only=True)
    from_field = serializers.DateField(source="from_date")
    to         = serializers.DateField(source="to_date")

    class Meta:
        model  = LeaveRequest
        fields = ("id", "employeeId", "name", "type", "from_field", "to", "days", "status", "reason")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["from"] = data.pop("from_field")
        return data


# ── Attendance ────────────────────────────────────────────────────────────────

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name   = serializers.CharField(source="employee.name",            read_only=True)
    department_name = serializers.CharField(source="employee.department.name", read_only=True)

    class Meta:
        model  = Attendance
        fields = ("id", "employee", "employee_name", "department_name", "date", "check_in", "check_out", "status")


class AttendanceListSerializer(serializers.ModelSerializer):
    employeeId = serializers.CharField(source="employee.employee_code",        read_only=True)
    name       = serializers.CharField(source="employee.name",                 read_only=True)
    department = serializers.CharField(source="employee.department.name",      read_only=True)
    checkIn    = serializers.CharField(source="check_in")
    checkOut   = serializers.CharField(source="check_out")

    class Meta:
        model  = Attendance
        fields = ("id", "employeeId", "name", "department", "checkIn", "checkOut", "status", "date")


# ── Payroll ───────────────────────────────────────────────────────────────────

class PayrollSerializer(serializers.ModelSerializer):
    employee_name   = serializers.CharField(source="employee.name",            read_only=True)
    employee_code   = serializers.CharField(source="employee.employee_code",   read_only=True)
    department_name = serializers.CharField(source="employee.department.name", read_only=True)
    email           = serializers.CharField(source="employee.email",           read_only=True)
    role            = serializers.CharField(source="employee.role",            read_only=True)
    bank_name       = serializers.CharField(source="employee.bank_name",       read_only=True)
    account_no      = serializers.CharField(source="employee.account_no",      read_only=True)

    class Meta:
        model  = Payroll
        fields = (
            "id", "employee", "employee_name", "employee_code", "department_name",
            "email", "role", "bank_name", "account_no",
            "month", "basic", "allowances", "deductions", "net", "status", "created_at",
        )
        read_only_fields = ("id", "created_at")


class PayrollListSerializer(serializers.ModelSerializer):
    employeeId = serializers.CharField(source="employee.employee_code",        read_only=True)
    name       = serializers.CharField(source="employee.name",                 read_only=True)
    department = serializers.CharField(source="employee.department.name",      read_only=True)
    email      = serializers.CharField(source="employee.email",                read_only=True)
    role       = serializers.CharField(source="employee.role",                 read_only=True)
    bank_name  = serializers.CharField(source="employee.bank_name",            read_only=True)
    account_no = serializers.CharField(source="employee.account_no",           read_only=True)

    class Meta:
        model  = Payroll
        fields = (
            "id", "employee", "employeeId", "name", "email", "role", "department",
            "bank_name", "account_no", "month", "basic", "allowances", "deductions",
            "net", "status", "created_at",
        )


# ── Overtime ──────────────────────────────────────────────────────────────────

class OvertimeSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)

    class Meta:
        model  = Overtime
        fields = ("id", "employee", "employee_name", "date", "hours", "reason", "status", "created_at")
        read_only_fields = ("id", "created_at")


# ── Expense ───────────────────────────────────────────────────────────────────

class ExpenseSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name", read_only=True)

    class Meta:
        model  = Expense
        fields = ("id", "employee", "employee_name", "title", "category", "amount", "date", "receipt", "notes", "status", "created_at")
        read_only_fields = ("id", "created_at")


# ── Recruitment ───────────────────────────────────────────────────────────────

class JobSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    applicants      = serializers.ReadOnlyField()

    class Meta:
        model  = Job
        fields = ("id", "title", "department", "department_name", "location", "job_type", "openings", "status", "description", "applicants", "created_at")
        read_only_fields = ("id", "created_at")


class JobListSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name", read_only=True)
    type       = serializers.CharField(source="job_type")
    applicants = serializers.ReadOnlyField()

    class Meta:
        model  = Job
        fields = ("id", "title", "department", "location", "type", "openings", "status", "applicants")


class CandidateSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source="job.title", read_only=True)

    class Meta:
        model  = Candidate
        fields = ("id", "job", "job_title", "name", "email", "phone", "resume", "stage", "applied_date", "notes")


class CandidateListSerializer(serializers.ModelSerializer):
    jobId       = serializers.IntegerField(source="job_id",    read_only=True)
    jobTitle    = serializers.CharField(source="job.title",    read_only=True)
    appliedDate = serializers.DateField(source="applied_date")

    class Meta:
        model  = Candidate
        fields = ("id", "name", "jobId", "jobTitle", "stage", "email", "appliedDate")


# ── Performance ───────────────────────────────────────────────────────────────

class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name   = serializers.CharField(source="employee.name",            read_only=True)
    department_name = serializers.CharField(source="employee.department.name", read_only=True)

    class Meta:
        model  = PerformanceReview
        fields = ("id", "employee", "employee_name", "department_name", "period", "reviewer", "rating", "status", "comments", "created_at")
        read_only_fields = ("id", "created_at")


class PerformanceListSerializer(serializers.ModelSerializer):
    employeeId = serializers.CharField(source="employee.employee_code",        read_only=True)
    name       = serializers.CharField(source="employee.name",                 read_only=True)
    department = serializers.CharField(source="employee.department.name",      read_only=True)

    class Meta:
        model  = PerformanceReview
        fields = ("id", "employeeId", "name", "department", "period", "reviewer", "rating", "status", "comments")


# ── Training ──────────────────────────────────────────────────────────────────

class TrainingSerializer(serializers.ModelSerializer):
    enrollment_count = serializers.SerializerMethodField()

    class Meta:
        model  = Training
        fields = ("id", "title", "trainer", "start_date", "end_date", "location", "status", "description", "enrollment_count", "created_at")
        read_only_fields = ("id", "created_at")

    def get_enrollment_count(self, obj):
        return obj.enrollments.count()


class TrainingEnrollmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.name",   read_only=True)
    training_title = serializers.CharField(source="training.title", read_only=True)

    class Meta:
        model  = TrainingEnrollment
        fields = ("id", "training", "training_title", "employee", "employee_name", "enrolled_at", "completed", "score")
        read_only_fields = ("id", "enrolled_at")


# ── Asset ─────────────────────────────────────────────────────────────────────

class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)

    class Meta:
        model  = Asset
        fields = ("id", "name", "asset_code", "category", "serial_number", "purchase_date", "purchase_cost", "assigned_to", "assigned_to_name", "status", "notes", "created_at")
        read_only_fields = ("id", "created_at")


# ── Announcement ──────────────────────────────────────────────────────────────

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Announcement
        fields = ("id", "title", "content", "priority", "is_active", "created_at")
        read_only_fields = ("id", "created_at")

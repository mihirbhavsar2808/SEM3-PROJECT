import uuid
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    ChangePasswordSerializer, LoginSerializer, PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer, RegisterSerializer, UserSerializer,
)


def _token_response(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        try:
            from subscriptions.models import Plan, Subscription
            from django.utils import timezone
            from dateutil.relativedelta import relativedelta
            default_plan = (
                Plan.objects.filter(is_active=True, is_default=True).first()
                or Plan.objects.filter(is_active=True, price=0).first()
            )
            if default_plan:
                now = timezone.now()
                Subscription.objects.create(
                    user=user,
                    plan=default_plan,
                    start_date=now,
                    end_date=now + relativedelta(months=default_plan.duration_months),
                    status="active",
                )
        except Exception:
            pass
        return Response(_token_response(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(
            request,
            email=email,
            password=password
        )

        if user is None:
            return Response(
                {
                    "detail": "Invalid email or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        user_data["is_staff"] = user.is_staff
        user_data["is_superuser"] = user.is_superuser
        try:
            from hrm.models import Employee
            emp = Employee.objects.filter(email__iexact=user.email).first()
            if emp:
                user_data["employee"] = {
                    "id": emp.employee_code,
                    "pk": emp.id,
                    "name": emp.name,
                    "role": emp.role,
                    "department": emp.department.name if emp.department else "General",
                    "phone": emp.phone,
                    "location": emp.location,
                    "salary": float(emp.salary) if emp.salary else 0,
                    "status": emp.status,
                    "joinDate": str(emp.join_date) if emp.join_date else None,
                    "manager": emp.manager or "Admin",
                }
        except Exception:
            pass

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_data
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            RefreshToken(request.data["refresh"]).blacklist()
        except Exception:
            pass
        return Response({"detail": "Logged out."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_data = UserSerializer(request.user).data
        user_data["is_staff"] = request.user.is_staff
        user_data["is_superuser"] = request.user.is_superuser
        try:
            from hrm.models import Employee
            emp = Employee.objects.filter(email__iexact=request.user.email).first()
            if emp:
                user_data["employee"] = {
                    "id": emp.employee_code,
                    "pk": emp.id,
                    "name": emp.name,
                    "role": emp.role,
                    "department": emp.department.name if emp.department else "General",
                    "phone": emp.phone,
                    "location": emp.location,
                    "salary": float(emp.salary) if emp.salary else 0,
                    "status": emp.status,
                    "joinDate": str(emp.join_date) if emp.join_date else None,
                    "manager": emp.manager or "Admin",
                }
        except Exception:
            pass
        return Response(user_data)

    def patch(self, request):
        s = UserSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)



class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = ChangePasswordSerializer(data=request.data, context={"request": request})
        s.is_valid(raise_exception=True)
        s.save()
        return Response({"detail": "Password changed successfully."})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"]
        try:
            user = User.objects.get(email=email)
            token = str(uuid.uuid4())
            cache.set(f"pwd_reset_{token}", user.pk, timeout=600)   # 10 min
            reset_link = f"http://localhost:5173/reset-password?token={token}"
            send_mail(
                subject="ORbit HRM — Password Reset",
                message=f"Click the link to reset your password:\n{reset_link}\n\nThis link expires in 10 minutes.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass  # Don't reveal whether email exists
        return Response({"detail": "If that email exists, a reset link has been sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetConfirmSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        token = s.validated_data["token"]
        user_pk = cache.get(f"pwd_reset_{token}")
        if not user_pk:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.get(pk=user_pk)
        user.set_password(s.validated_data["password"])
        user.save(update_fields=["password"])
        cache.delete(f"pwd_reset_{token}")
        return Response({"detail": "Password reset successful."})

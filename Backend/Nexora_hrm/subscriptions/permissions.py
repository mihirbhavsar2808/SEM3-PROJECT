from rest_framework.permissions import BasePermission
from .models import Subscription


class HasActiveSubscription(BasePermission):
    message = "Your subscription has expired. Please renew your subscription."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers, staff, and employees always have access
        # (Employees are workforce members under the company account)
        if (
            getattr(request.user, "is_superuser", False)
            or getattr(request.user, "is_staff", False)
            or getattr(request.user, "role", None) == "employee"
        ):
            return True

        # Check user's own subscription
        try:
            subscription = request.user.subscription
            return subscription.check_expiry()
        except Subscription.DoesNotExist:
            # If any active company subscription exists, allow
            return Subscription.objects.filter(status="active").exists()
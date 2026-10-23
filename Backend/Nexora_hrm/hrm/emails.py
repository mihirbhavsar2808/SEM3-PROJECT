import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import escape

logger = logging.getLogger(__name__)


def send_employee_welcome_email(employee, password="Employee@123"):
    """
    Sends a personalized company welcome email to the newly created employee.
    Generates both rich responsive HTML and plain-text fallback.
    """
    if not employee or not employee.email:
        logger.warning("send_employee_welcome_email: No recipient email provided for employee ID %s", getattr(employee, "id", None))
        return False

    recipient_email = employee.email.strip()
    employee_name = employee.name or "New Team Member"
    employee_code = employee.employee_code or f"E{employee.id}"
    role = employee.role or (employee.designation.title if employee.designation else "Team Member")
    department_name = employee.department.name if employee.department else "General"
    location = employee.location or "Main Office"
    join_date = str(employee.join_date) if employee.join_date else "Immediate"
    shift_name = employee.shift.name if employee.shift else "Standard"

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "ORbit HRM <2504070100354@silveroakuni.ac.in>")
    subject = f"Welcome to the Team, {employee_name}! 🎉 — ORbit HRM"


    # Plain text version
    plain_text = f"""Welcome to ORbit HRM!

Dear {employee_name},

We are thrilled to welcome you to our organization! Your employee profile has been successfully set up in the ORbit HRM system.

Here are your key employment details:
--------------------------------------------------
• Employee ID    : {employee_code}
• Full Name      : {employee_name}
• Work Email     : {recipient_email}
• Role           : {role}
• Department     : {department_name}
• Joining Date   : {join_date}
• Work Location  : {location}
• Shift          : {shift_name}
--------------------------------------------------

Next Steps & Portal Access:
1. Log in to your Employee Portal at: {frontend_url}/login
   • Username: {recipient_email}
   • Login Password: {password}
2. Explore your employee self-service dashboard to track daily attendance, apply for leaves, and view your profile.
3. Reach out to the HR Operations team or your manager if you have any questions.

We are excited to have you with us and wish you great success in your journey here!

Warm regards,
HR Operations Team
ORbit HRM

"""

    # HTML version with high email client compatibility & sleek modern aesthetics
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ORbit HRM</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1F8A70 100%); padding: 36px 32px 30px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(255,255,255,0.15); color: #a7f3d0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 5px 12px; border-radius: 20px; margin-bottom: 12px; backdrop-filter: blur(4px);">
                      ✦ Official Welcome
                    </div>
                    <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                      Welcome to ORbit HRM
                    </h1>
                    <p style="margin: 0; color: #cbd5e1; font-size: 14px;">
                      Your employee journey starts today
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Welcome Body -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
                Hello {escape(employee_name)} 👋
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 14.5px; line-height: 1.6;">
                On behalf of the entire team, we are absolutely delighted to welcome you to the company! Your employee profile has been officially created in our Human Resource Management system.
              </p>

              <!-- Profile Details Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                  Employee Onboarding Summary
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 13.5px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 40%; font-weight: 500;">Employee ID:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: 'Courier New', Courier, monospace;">{escape(employee_code)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Full Name:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{escape(employee_name)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Designation / Role:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{escape(role)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Department:</td>
                    <td style="padding: 6px 0; color: #1F8A70; font-weight: 600;">{escape(department_name)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Registered Email:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{escape(recipient_email)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Joining Date:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{escape(join_date)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Work Location:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">{escape(location)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Login Password:</td>
                    <td style="padding: 6px 0; color: #1F8A70; font-weight: 700; font-family: 'Courier New', Courier, monospace;">{escape(password)}</td>
                  </tr>
                </table>
              </div>

              <!-- Next Steps Callout -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 18px 20px; margin-bottom: 26px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 16px; margin-right: 8px;">🚀</span>
                  <strong style="color: #065f46; font-size: 14px;">Next Steps & Portal Access:</strong>
                </div>
                <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 13px; line-height: 1.6;">
                  <li><strong>Portal Login:</strong> Use your registered email (<code>{escape(recipient_email)}</code>) and login password <code>{escape(password)}</code>.</li>
                  <li>Log in to access your employee dashboard, view shift schedules, and apply for leaves.</li>
                  <li>Review company policies and contact your team lead for orientation.</li>
                </ul>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="{frontend_url}/login" target="_blank" style="display: inline-block; background-color: #1F8A70; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 28px; border-radius: 8px; box-shadow: 0 2px 8px rgba(31, 138, 112, 0.35);">
                  Open Employee Portal &rarr;
                </a>
              </div>


              <p style="margin: 0 0 6px 0; color: #475569; font-size: 13.5px;">
                We are excited to see you grow and thrive with us!
              </p>
              <p style="margin: 0; color: #0f172a; font-size: 14px; font-weight: 600;">
                Warm regards,<br>
                <span style="color: #64748b; font-weight: 500;">HR Operations Team &bull; ORbit HRM</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 12px;">
                ORbit HRM &bull; Human Capital Management System
              </p>
              <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                This email was sent to {escape(recipient_email)} because a new employee profile was registered.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=from_email,
            to=[recipient_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info("Welcome email successfully sent to %s for employee %s (%s)", recipient_email, employee_name, employee_code)
        return True
    except Exception as exc:
        logger.error("Failed to send welcome email to %s: %s", recipient_email, exc, exc_info=True)
        return False


def send_payroll_payslip_email(payroll):
    """
    Sends an official salary payslip email to the employee's registered email address.
    Includes full salary breakdown (Basic, Allowances, Deductions, Net Pay), payment status,
    bank info, employee details, and corporate ORbit HRM formatting.
    """
    if not payroll or not getattr(payroll, "employee", None):
        return False, "Invalid payroll record or missing employee data."

    emp = payroll.employee
    if not emp.email or not emp.email.strip():
        logger.warning("send_payroll_payslip_email: Employee %s has no registered email.", emp.id)
        return False, f"Employee {emp.name or ''} does not have a registered email address."

    recipient_email = emp.email.strip()
    employee_name = emp.name or "Valued Team Member"
    employee_code = emp.employee_code or f"E{emp.id}"
    role = emp.role or (emp.designation.title if getattr(emp, "designation", None) else "Team Member")
    department_name = emp.department.name if getattr(emp, "department", None) else "Operations"
    bank_name = emp.bank_name or "Registered Bank"
    account_no = emp.account_no or "On Record"
    ifsc = emp.ifsc or "--"

    month = payroll.month or "Current Month"
    basic_val = float(payroll.basic or 0)
    allowances_val = float(payroll.allowances or 0)
    deductions_val = float(payroll.deductions or 0)
    net_val = float(payroll.net or 0)
    gross_val = basic_val + allowances_val
    status = payroll.status or "Paid"

    basic_fmt = f"₹{basic_val:,.2f}"
    allowances_fmt = f"₹{allowances_val:,.2f}"
    deductions_fmt = f"₹{deductions_val:,.2f}"
    net_fmt = f"₹{net_val:,.2f}"
    gross_fmt = f"₹{gross_val:,.2f}"

    slip_ref = f"PAY-{payroll.id:05d}"
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "ORbit HRM <2504070100354@silveroakuni.ac.in>")
    subject = f"Salary Payslip for {month} — {employee_name} ({employee_code}) | ORbit HRM"

    # Plain text version
    plain_text = f"""ORBIT HRM — OFFICIAL SALARY PAYSLIP
==================================================
Reference : {slip_ref}
Month     : {month}
Status    : {status.upper()}
==================================================

EMPLOYEE INFORMATION:
• Name        : {employee_name}
• Employee ID : {employee_code}
• Designation : {role}
• Department  : {department_name}
• Work Email  : {recipient_email}
• Bank        : {bank_name}
• Account No  : {account_no}
• IFSC        : {ifsc}

SALARY BREAKDOWN:
--------------------------------------------------
Basic Salary           : {basic_fmt}
Allowances             : {allowances_fmt}
Gross Earnings         : {gross_fmt}
Deductions (Leaves/Tax): -{deductions_fmt}
--------------------------------------------------
NET TAKE-HOME PAY      : {net_fmt}
==================================================
Payment Status: {status}

View your digital dashboard and payslip history at:
{frontend_url}/login

This is a confidential computer-generated document issued by ORbit HRM.
For inquiries, contact the HR Operations / Finance team.
"""

    # Rich HTML version
    status_color = "#059669" if status.lower() == "paid" else "#d97706"
    status_bg = "#ecfdf5" if status.lower() == "paid" else "#fef3c7"
    status_border = "#a7f3d0" if status.lower() == "paid" else "#fde68a"
    status_text = "PAID · PAYMENT COMPLETED" if status.lower() == "paid" else "PENDING PROCESSING"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - {escape(month)} - {escape(employee_name)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Payslip Container -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">

          <!-- Top Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1F8A70 100%); padding: 32px 32px 28px; text-align: left;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(255,255,255,0.15); color: #a7f3d0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 20px; margin-bottom: 10px;">
                      ✦ Official Salary Statement
                    </div>
                    <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                      ORbit HRM
                    </h1>
                    <p style="margin: 0; color: #cbd5e1; font-size: 13.5px;">
                      Salary Payslip for <strong>{escape(month)}</strong> · Ref: <span style="font-family: 'Courier New', Courier, monospace; color: #a7f3d0;">{escape(slip_ref)}</span>
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <div style="background-color: {status_bg}; border: 1px solid {status_border}; color: {status_color}; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
                      {status_text}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Net Pay Highlight Hero -->
          <tr>
            <td style="padding: 24px 32px 10px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 4px;">
                      Net Salary Credited
                    </div>
                    <div style="font-size: 32px; font-weight: 800; color: #1F8A70; letter-spacing: -1px; font-family: 'Sora', 'Inter', -apple-system, sans-serif;">
                      {net_fmt}
                    </div>
                    <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">
                      Disbursed to: <strong>{escape(bank_name)}</strong> (A/C: <span style="font-family: 'Courier New', monospace;">{escape(account_no)}</span>)
                    </div>
                  </td>
                  <td align="right">
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 18px; text-align: right; display: inline-block;">
                      <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Pay Period</div>
                      <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">{escape(month)}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Employee Details Section -->
          <tr>
            <td style="padding: 26px 32px 16px;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 12px;">
                Employee Summary
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; font-size: 13.5px;">
                <tr>
                  <td style="padding: 6px 10px; width: 50%; vertical-align: top;">
                    <span style="color: #64748b; display: block; font-size: 11.5px; text-transform: uppercase; font-weight: 600;">Employee Name</span>
                    <strong style="color: #0f172a; font-size: 14px;">{escape(employee_name)}</strong>
                  </td>
                  <td style="padding: 6px 10px; width: 50%; vertical-align: top;">
                    <span style="color: #64748b; display: block; font-size: 11.5px; text-transform: uppercase; font-weight: 600;">Employee ID</span>
                    <strong style="color: #0f172a; font-family: 'Courier New', monospace; font-size: 14px;">{escape(employee_code)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; vertical-align: top;">
                    <span style="color: #64748b; display: block; font-size: 11.5px; text-transform: uppercase; font-weight: 600;">Department</span>
                    <span style="color: #0f172a; font-weight: 600;">{escape(department_name)}</span>
                  </td>
                  <td style="padding: 6px 10px; vertical-align: top;">
                    <span style="color: #64748b; display: block; font-size: 11.5px; text-transform: uppercase; font-weight: 600;">Designation / Role</span>
                    <span style="color: #0f172a; font-weight: 600;">{escape(role)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; vertical-align: top;">
                    <span style="color: #64748b; display: block; font-size: 11.5px; text-transform: uppercase; font-weight: 600;">Registered Email</span>
                    <span style="color: #1F8A70; font-weight: 600;">{escape(recipient_email)}</span>
                  </td>
                  <td style="padding: 6px 10px; vertical-align: top;">
                    <span style="color: #64748b; display: block; font-size: 11.5px; text-transform: uppercase; font-weight: 600;">IFSC Code</span>
                    <span style="color: #0f172a; font-family: 'Courier New', monospace; font-weight: 600;">{escape(ifsc)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Salary Breakdown Table -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 12px;">
                Salary Components & Computations
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; font-size: 13.5px;">
                <!-- Table Headers -->
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <th align="left" style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Earnings</th>
                  <th align="right" style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Amount</th>
                  <th align="left" style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border-left: 1px solid #e2e8f0;">Deductions</th>
                  <th align="right" style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Amount</th>
                </tr>

                <!-- Row 1: Basic vs Leave Deductions -->
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 14px; color: #334155;">Basic Salary</td>
                  <td align="right" style="padding: 10px 14px; font-weight: 600; color: #0f172a;">{basic_fmt}</td>
                  <td style="padding: 10px 14px; color: #334155; border-left: 1px solid #e2e8f0;">Leave / Absence</td>
                  <td align="right" style="padding: 10px 14px; font-weight: 600; color: #e11d48;">-{deductions_fmt}</td>
                </tr>

                <!-- Row 2: Allowances vs Taxes/PF -->
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 14px; color: #334155;">Allowances</td>
                  <td align="right" style="padding: 10px 14px; font-weight: 600; color: #0f172a;">{allowances_fmt}</td>
                  <td style="padding: 10px 14px; color: #334155; border-left: 1px solid #e2e8f0;">Taxes / Other</td>
                  <td align="right" style="padding: 10px 14px; font-weight: 600; color: #64748b;">₹0.00</td>
                </tr>

                <!-- Totals Row -->
                <tr style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-weight: 700;">
                  <td style="padding: 11px 14px; color: #0f172a;">Total Earnings</td>
                  <td align="right" style="padding: 11px 14px; color: #0f172a;">{gross_fmt}</td>
                  <td style="padding: 11px 14px; color: #0f172a; border-left: 1px solid #e2e8f0;">Total Deductions</td>
                  <td align="right" style="padding: 11px 14px; color: #e11d48;">-{deductions_fmt}</td>
                </tr>

                <!-- Net Take Home Row -->
                <tr style="background-color: #ecfdf5; border-top: 2px solid #1F8A70;">
                  <td colspan="2" style="padding: 14px 16px; font-size: 15px; font-weight: 800; color: #065f46;">
                    NET SALARY PAYABLE
                  </td>
                  <td colspan="2" align="right" style="padding: 14px 16px; font-size: 18px; font-weight: 800; color: #1F8A70; font-family: 'Sora', 'Inter', sans-serif;">
                    {net_fmt}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Portal Access CTA -->
          <tr>
            <td style="padding: 0 32px 28px; text-align: center;">
              <a href="{frontend_url}/login" target="_blank" style="display: inline-block; background-color: #1F8A70; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 26px; border-radius: 8px; box-shadow: 0 2px 8px rgba(31, 138, 112, 0.35);">
                Open Employee Portal &rarr;
              </a>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
                Log in anytime to download historical payslips and tax forms.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #94a3b8; font-size: 12px; font-weight: 600;">
                ORbit HRM &bull; Payroll & Human Resource Management
              </p>
              <p style="margin: 0 0 4px 0; color: #cbd5e1; font-size: 11px;">
                This is a confidential computer-generated document. No physical signature is required.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Delivered to {escape(recipient_email)} per employee records.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=from_email,
            to=[recipient_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(
            "Payslip email successfully sent to %s for %s (%s) - Month: %s - Net: %s",
            recipient_email, employee_name, employee_code, month, net_fmt,
        )
        return True, f"Payslip for {month} successfully sent to {recipient_email}."
    except Exception as exc:
        logger.error("Failed to send payslip email to %s: %s", recipient_email, exc, exc_info=True)
        return False, f"Failed to send email to {recipient_email}: {str(exc)}"

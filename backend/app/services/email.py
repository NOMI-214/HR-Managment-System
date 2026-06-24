import httpx
from app.config import settings

MAILTRAP_URL = "https://send.api.mailtrap.io/api/send"
HEADERS = {
    "Authorization": f"Bearer {settings.mailtrap_api_key}",
    "Content-Type": "application/json"
}


async def send_email(to_email: str, to_name: str, subject: str, html_body: str):
    payload = {
        "from": {"email": "noreply@talentflow.io", "name": "TalentFlow HRMS"},
        "to": [{"email": to_email, "name": to_name}],
        "subject": subject,
        "html": html_body
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(MAILTRAP_URL, json=payload, headers=HEADERS, timeout=10)
            return response.status_code == 200
        except Exception:
            return False


async def send_verification_email(name: str, email: str, token: str, frontend_url: str):
    link = f"{frontend_url}/verify-email?token={token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#6366f1;padding:30px;text-align:center">
        <h1 style="color:white;margin:0">TalentFlow HRMS</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9">
        <h2>Welcome, {name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="{link}" style="background:#6366f1;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:20px 0">
          Verify Email
        </a>
        <p style="color:#666;font-size:12px">Link expires in 24 hours. If you didn't register, ignore this email.</p>
      </div>
    </div>
    """
    return await send_email(email, name, "Verify your TalentFlow account", html)


async def send_password_reset_email(name: str, email: str, token: str, frontend_url: str):
    link = f"{frontend_url}/reset-password?token={token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#6366f1;padding:30px;text-align:center">
        <h1 style="color:white;margin:0">TalentFlow HRMS</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9">
        <h2>Password Reset Request</h2>
        <p>Hi {name}, we received a request to reset your password.</p>
        <a href="{link}" style="background:#6366f1;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:20px 0">
          Reset Password
        </a>
        <p style="color:#666;font-size:12px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    </div>
    """
    return await send_email(email, name, "Reset your TalentFlow password", html)


async def send_leave_notification(name: str, email: str, status: str, leave_type: str):
    color = "#22c55e" if status == "APPROVED" else "#ef4444"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#6366f1;padding:30px;text-align:center">
        <h1 style="color:white;margin:0">TalentFlow HRMS</h1>
      </div>
      <div style="padding:30px;background:#f9f9f9">
        <h2>Leave Request Update</h2>
        <p>Hi {name}, your {leave_type} leave request has been <strong style="color:{color}">{status}</strong>.</p>
        <p>Log in to TalentFlow to view details.</p>
      </div>
    </div>
    """
    return await send_email(email, name, f"Leave Request {status} - TalentFlow", html)

import smtplib
from email.message import EmailMessage
from app.config import settings

def send_otp_email(to_email: str, otp: str):
    """
    Sends an OTP to the provided email address using SMTP.
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        print(f"Mock email sent to {to_email}. OTP: {otp} (Configure SMTP_USERNAME and SMTP_PASSWORD to send real emails)")
        return
        
    msg = EmailMessage()
    msg['Subject'] = 'StockSense Password Reset OTP'
    msg['From'] = settings.SENDER_EMAIL
    msg['To'] = to_email

    msg.set_content(f"""\
Hello,

We received a request to reset your StockSense account password.
Your verification code is:

{otp}

This OTP will expire in 5 minutes.
If you did not request a password reset, you can safely ignore this email.
Do not share this OTP with anyone.

Regards,
StockSense Team
""")

    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            print(f"OTP email successfully sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

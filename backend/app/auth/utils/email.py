import os
import smtplib
from email.message import EmailMessage
import logging

logger = logging.getLogger("email")


def send_otp_email(email: str, otp: str):
    """
    Send OTP email using SMTP settings from environment variables.
    Supports Gmail, Office365, college domains, and other SMTP providers.
    
    For Gmail: Use App Password (not regular password)
    For Office365: Use your outlook email
    For college domains: Use your institutional email
    
    Falls back to console output if SMTP is not configured (development mode).
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_from = os.getenv("SMTP_FROM", smtp_user or "no-reply@algosphere.local")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")

    if not smtp_host or not smtp_user or not smtp_pass:
        # Fallback for development mode
        logger.info(f"[DEV MODE] Sending OTP to {email}: {otp}")
        print(f"\n{'='*60}")
        print(f"[DEV MODE - OTP EMAIL]")
        print(f"Recipient: {email}")
        print(f"OTP Code: {otp}")
        print(f"Expires: In 10 minutes")
        print(f"{'='*60}\n")
        return

    try:
        msg = EmailMessage()
        msg["Subject"] = "Your AlgoSphere OTP for Password Reset"
        msg["From"] = smtp_from
        msg["To"] = email
        msg.set_content(
            f"""AlgoSphere Password Reset

Your OTP code is: {otp}

This code will expire in 10 minutes.

If you did not request a password reset, you can safely ignore this email.

---
AlgoSphere Team
"""
        )

        # Add HTML version for better email clients
        msg.add_alternative(f"""
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>AlgoSphere Password Reset</h2>
            <p>Your OTP code is:</p>
            <h1 style="background-color: #f0f0f0; padding: 10px; letter-spacing: 2px;">{otp}</h1>
            <p>This code will expire in <strong>10 minutes</strong>.</p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <hr>
            <p><em>AlgoSphere Team</em></p>
          </body>
        </html>
        """, subtype="html")

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        
        logger.info(f"OTP email sent successfully to {email}")

    except smtplib.SMTPAuthenticationError:
        logger.error(f"SMTP authentication failed. Check SMTP_USER and SMTP_PASS.")
        raise
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error while sending OTP to {email}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error sending OTP to {email}: {str(e)}")
        raise

    

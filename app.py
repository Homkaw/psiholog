
import os
import re
import ssl
import smtplib
import socket
from email.message import EmailMessage

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

# Загружаем .env именно из папки проекта
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

load_dotenv(
    os.path.join(BASE_DIR, ".env"),
    override=True
)

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

FORMATS = {
    "online": "Онлайн",
    "offline": "Очно",
    "not_selected": "Не выбран"
}


# =========================================
# СТРАНИЦЫ
# =========================================

@app.get("/")
@app.get("/index.html")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/style.css")
def stylesheet():
    return send_from_directory(
        BASE_DIR, "style.css",
        mimetype="text/css"
    )


@app.get("/script.js")
def javascript():
    return send_from_directory(
        BASE_DIR, "script.js",
        mimetype="application/javascript"
    )


@app.get("/privacy.html")
def privacy():
    return send_from_directory(BASE_DIR, "privacy.html")


# =========================================
# НАСТРОЙКИ ПОЧТЫ
# =========================================

def get_mail_settings():
    return {
        "host": os.getenv("SMTP_HOST", "").strip(),
        "port": int(os.getenv("SMTP_PORT", "465")),
        "user": os.getenv("SMTP_USER", "").strip(),
        "password": os.getenv("SMTP_PASSWORD", ""),
        "sender": os.getenv("MAIL_SENDER", "").strip(),
        "receiver": os.getenv("MAIL_RECEIVER", "").strip()
    }


def send_application_email(name, email, meeting_format, message):
    settings = get_mail_settings()

    required = [
        "host",
        "user",
        "password",
        "sender",
        "receiver"
    ]

    missing = [
        key for key in required
        if not settings[key]
    ]

    if missing:
        app.logger.error(
            "Missing mail settings: %s",
            ", ".join(missing)
        )
        return False

    mail = EmailMessage()

    mail["Subject"] = "Новая заявка — Точка опоры"
    mail["From"] = settings["sender"]
    mail["To"] = settings["receiver"]
    mail["Reply-To"] = email

    mail.set_content(
        "НОВАЯ ЗАЯВКА С САЙТА\n"
        "Точка опоры\n\n"
        f"Имя: {name}\n"
        f"Email: {email}\n"
        f"Формат: {FORMATS[meeting_format]}\n\n"
        "Комментарий:\n"
        f"{message or 'Не указан'}\n\n"
        "Согласие на обработку данных: подтверждено\n"
    )

    try:
        context = ssl.create_default_context()

        with smtplib.SMTP_SSL(
            host=settings["host"],
            port=settings["port"],
            timeout=15,
            context=context
        ) as smtp:
            smtp.login(
                settings["user"],
                settings["password"]
            )

            smtp.send_message(mail)

        app.logger.info("Application email sent")
        return True

    except socket.gaierror:
        app.logger.error(
            "Cannot resolve SMTP host: %r",
            settings["host"]
        )

    except smtplib.SMTPAuthenticationError:
        app.logger.error(
            "Gmail authentication failed. Check app password."
        )

    except (smtplib.SMTPException, OSError):
        app.logger.exception("SMTP delivery failure")

    return False


# =========================================
# ОБРАБОТКА ЗАЯВКИ
# =========================================

@app.post("/api/appointment")
def appointment():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "message": "Некорректные данные заявки."
        }), 400

    # Защита от простых ботов
    if data.get("website"):
        return jsonify({
            "success": True
        })

    name = data.get("name", "")
    email = data.get("email", "")
    meeting_format = data.get("format", "not_selected")
    message = data.get("message", "")
    consent = data.get("consent", False)

    if not all(isinstance(value, str) for value in [
        name, email, meeting_format, message
    ]):
        return jsonify({
            "message": "Некорректные поля формы."
        }), 400

    name = name.strip()
    email = email.strip()
    message = message.strip()

    # Имя
    if not 2 <= len(name) <= 100:
        return jsonify({
            "message": "Имя должно содержать от 2 до 100 символов."
        }), 400

    # Почта
    if len(email) > 254 or not EMAIL_RE.fullmatch(email):
        return jsonify({
            "message": "Введите корректный email."
        }), 400

    # Комментарий
    if len(message) > 500:
        return jsonify({
            "message": "Комментарий не должен превышать 500 символов."
        }), 400

    # Формат встречи
    if meeting_format not in FORMATS:
        return jsonify({
            "message": "Выбран некорректный формат встречи."
        }), 400

    # Согласие
    if consent is not True:
        return jsonify({
            "message": "Необходимо согласие на обработку данных."
        }), 400

    # Отправка
    success = send_application_email(
        name,
        email,
        meeting_format,
        message
    )

    if not success:
        return jsonify({
            "message": (
                "Не удалось отправить заявку. "
                "Пожалуйста, попробуйте позже."
            )
        }), 503

    return jsonify({
        "success": True,
        "message": "Ваша заявка успешно отправлена!"
    })


# =========================================
# ЗАПУСК
# =========================================

if __name__ == "__main__":
    settings = get_mail_settings()

    print("\n" + "=" * 45)
    print("ТОЧКА ОПОРЫ — FLASK SERVER")
    print("=" * 45)
    print("SMTP HOST:", repr(settings["host"]))
    print("SMTP PORT:", settings["port"])
    print("SMTP USER configured:", bool(settings["user"]))
    print("SMTP PASSWORD configured:", bool(settings["password"]))
    print("MAIL RECEIVER configured:", bool(settings["receiver"]))
    print("=" * 45 + "\n")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )

# 🚀 Shortify: A Full-Stack URL Shortener & Analytics Platform

Shortify is a production-grade, full-stack URL shortening service built with a powerful FastAPI backend and a modern, responsive frontend. It goes beyond simple link shortening by offering a complete, multi-user platform with secure authentication, detailed analytics, and advanced link management capabilities. The project is designed from the ground up to be a secure, scalable, and feature-rich service.

---

## ✨ Core Features

This application has evolved into a comprehensive platform with a focus on security, user experience, and powerful analytics.

### Authentication & Security

- **Secure Email & Password Authentication**: Standard registration flow is protected with strong password validation (length, complexity) and an email-based One-Time Password (OTP) verification system to ensure valid user accounts.
- **Social Login (Sign in with Google)**: Offers a seamless and secure one-click registration and login option using Google's OAuth 2.0 protocol.
- **Isolated Authentication Methods**: A robust security rule prevents account takeovers by disallowing a user from signing in with Google if their account was created with an email/password, and vice-versa.
- **Token-Based Security (JWT)**: All user sessions and protected API actions are secured using industry-standard JSON Web Tokens.
- **API Rate Limiting**: Protects against brute-force attacks and service abuse by limiting the number of requests for sensitive endpoints like login and registration.

### Link Management & Analytics

- **Advanced Analytics Dashboard**: The heart of the application is a dashboard that provides a multi-dimensional view of link performance, including:
  - **Total vs. Unique Clicks:** Differentiates between raw click counts and the number of individual visitors.
  - **Click Timelines:** Aggregates clicks by day to identify peak engagement times.
  - **Referrer Tracking:** Identifies the source of your traffic (e.g., `facebook.com`, `t.co`, or "Direct").
  - **Geolocation:** Pinpoints the country, region, and city of each click.
  - **Device & Technology:** Breaks down clicks by browser, operating system, and device type (Desktop/Mobile).
- **Custom Short Links**: Users can customize the "back-half" of their links (e.g., `your-domain.com/summer-sale`) for better branding and memorability.
- **QR Code Generation**: Automatically generates a scannable QR code for every short link, accessible from the dashboard for easy sharing in print or digital media.
- **Link Editing**: Users can update the destination URL of an existing short link without changing the short link itself.
- **Link Expiration**: Set an optional expiration date and time for any short link, after which it will automatically deactivate.

### Application & Codebase

- **Modern Interactive UI**: A clean, beautiful, and fully responsive two-column UI that works seamlessly on desktop and mobile devices. It includes user-friendly features like a "copy to clipboard" button and interactive modals.
- **Centralized Exception Handling**: A production-grade middleware acts as a global "safety net," catching any unexpected server errors, logging them to a rotating file for debugging, and returning a safe, generic error message to the user.
- **Asynchronous Background Tasks**: Non-blocking `asyncio` tasks are used for operations like sending emails and clearing caches, ensuring the application remains fast and responsive.
- **Modular & Maintainable Code**: The project is structured with a clear separation of concerns, with distinct files for the API (`main.py`), database logic (`crud.py`), data models (`models.py`), schemas (`schemas.py`), authentication (`auth.py`), and other utilities.

---

## 🛠️ Tech Stack

- **Backend**: 🐍 Python 3 with [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: 💾 [SQLAlchemy](https://www.sqlalchemy.org/) ORM with a [SQLite](https://www.sqlite.org/index.html) database for local development.
- **Authentication**: 🔐 [Passlib](https://passlib.readthedocs.io/en/stable/) (Password Hashing), [python-jose](https://github.com/mpdavis/python-jose) (JWT), and a manual OAuth 2.0 implementation with [httpx](https://www.python-httpx.org/).
- **Email**: ✉️ Python's built-in `smtplib` for sending transactional emails (OTP, Password Reset).
- **Rate Limiting**: ⏱️ [SlowAPI](https://github.com/laurents/slowapi) to protect against brute-force attacks.
- **QR Codes & Analytics**: 🖼️ [qrcode](https://github.com/lincolnloop/python-qrcode) for QR generation and [user-agents](https://github.com/selwin/python-user-agents) for device parsing.
- **Frontend**: 🌐 HTML5, 🎨 CSS3, 💻 Vanilla JavaScript
- **Production**: 🦄 [Gunicorn](https://gunicorn.org/) (Server), `pydantic-settings` (Configuration Management), `logging` (File-based, rotating logs).

---

## 📂 Final Project Structure

```
url-shortener/
├── logs/
│   └── app.log              # Rotated log files for exceptions
├── static/
│   ├── styles.css           # All application styles
│   └── main.js              # All frontend JavaScript logic
├── templates/
│   └── index.html           # The single HTML page for the frontend
├── .env                     # All secrets and configurations (not committed)
├── .gitignore               # Files and folders to be ignored by Git
├── app_state.py             # Shared in-memory application state (e.g., cache)
├── auth.py                  # Core authentication and security functions
├── background_tasks.py      # Asynchronous background task definitions
├── config.py                # Pydantic settings management for .env
├── crud.py                  # All database interaction functions (CRUD)
├── database.py              # SQLAlchemy database engine and session setup
├── email_utils.py           # Utility for sending emails
├── enrichment.py            # Data enrichment (GeoIP, User-Agent parsing)
├── logging_config.py        # Configuration for file-based logging
├── main.py                  # The main FastAPI application and API endpoints
├── models.py                # SQLAlchemy database models (table schemas)
├── requirements.txt         # All Python dependencies
├── schemas.py               # Pydantic models for data validation and shaping
└── utils.py                 # General utility functions (e.g., QR code generation)
```

---

## 📜 License

This project is licensed under the MIT License.

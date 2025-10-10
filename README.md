# 🚀 Shortify: A FastAPI URL Shortener

A full-stack URL shortening service built with FastAPI and vanilla JavaScript. This application allows registered users to create, manage, and analyze short, memorable links from long URLs through a modern and interactive dashboard. The project is designed to be a secure, multi-user service that is simple, efficient, and easy to deploy.

---

## ✨ Key Features

- **User Accounts**: A complete authentication system where users can register, log in, and manage their own collection of links.
- **Detailed Analytics Dashboard**: View a dashboard of all your links with total click counts and a detailed, toggleable breakdown of click timestamps.
- **Edit Link Destination**: Easily update the target URL of an existing short link without changing the short link itself.
- **QR Code Generation**: Automatically generates a scannable QR code for every created link, accessible from the dashboard.
- **Link Expiration**: Set an optional expiration date and time for any short link, after which it will automatically deactivate.
- **API Rate Limiting**: Protects against abuse by limiting the number of requests for sensitive endpoints like login and registration.
- **Modern Interactive UI**: A clean, two-column single-page application that dynamically changes based on login status and includes engaging features like a one-click "copy to clipboard" button.
- **Automatic API Docs**: Interactive API documentation powered by FastAPI and Swagger UI for easy backend testing.

---

## 🛠️ Tech Stack

- **Backend**: 🐍 Python 3 with [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: 💾 [SQLAlchemy](https://www.sqlalchemy.org/) ORM with a [SQLite](https://www.sqlite.org/index.html) database for local development.
- **Authentication**: 🔐 [Passlib](https://passlib.readthedocs.io/en/stable/) for password hashing and [python-jose](https://github.com/mpdavis/python-jose) for JSON Web Tokens (JWT).
- **Rate Limiting**: ⏱️ [SlowAPI](https://github.com/laurents/slowapi) to protect against brute-force and denial-of-service attacks.
- **QR Codes**: 🖼️ [qrcode](https://github.com/lincolnloop/python-qrcode) for on-the-fly QR code generation.
- **Data Validation**: ✅ [Pydantic](https://docs.pydantic.dev/latest/)
- **Frontend**: 🌐 HTML5, 🎨 CSS3, 💻 Vanilla JavaScript (with `fetch` API)
- **Templating**: 📄 [Jinja2](https://jinja.palletsprojects.com/en/3.1.x/) for serving the HTML page.
- **Production Server**: 🦄 [Gunicorn](https://gunicorn.org/) with Uvicorn workers.

---

## 📂 Project Structure

Here is an overview of the project's file structure:

```
url-shortener/
├── templates/
│   └── index.html         # The single HTML page for the frontend
├── .gitignore             # Files and folders to be ignored by Git
├── auth.py                # Core authentication and security functions (JWT, hashing)
├── crud.py                # Contains all database interaction functions (CRUD)
├── database.py            # SQLAlchemy database engine and session setup
├── main.py                # The main FastAPI application, contains all API endpoints
├── models.py              # SQLAlchemy database models (the table schema)
├── requirements.txt       # A list of all Python dependencies
├── schemas.py             # Pydantic models for data validation and shaping
├── utils.py               # Helper utility functions (e.g., QR code generation)
└── url_shortener.db       # The SQLite database file (created on first run)
```

---

## ⚙️ Setup and Installation

To run this project locally, follow these steps:

1.  **Clone the repository (or download the files)**

    ```bash
    git clone [https://github.com/your-username/url-shortener.git](https://github.com/your-username/url-shortener.git)
    cd url-shortener
    ```

2.  **Create and activate a virtual environment**

    ```bash
    # Create the virtual environment
    python -m venv venv

    # Activate it (macOS/Linux)
    source venv/bin/activate

    # Activate it (Windows)
    venv\Scripts\activate
    ```

3.  **Install the required dependencies**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the development server**

    ```bash
    uvicorn main:app --reload
    ```

5.  **Access the application**
    - The web interface will be available at **`http://127.0.0.1:8000`**.
    - The interactive API documentation will be at **`http://127.0.0.1:8000/docs`**.

---

## 🔌 API Endpoints

The API is divided into public and protected endpoints. Protected endpoints require a valid JWT access token. Some endpoints are also rate-limited.

### Authentication Endpoints (Public)

#### 1. Register a User

- **Endpoint**: `POST /users`
- **Description**: Creates a new user account.
- **Rate Limit**: 10 requests per hour.

#### 2. Login for Access Token

- **Endpoint**: `POST /token`
- **Description**: Authenticates a user and returns a JWT access token.
- **Rate Limit**: 5 requests per minute.

---

### URL Management Endpoints (Protected 🔒)

**Note:** All endpoints in this section require authentication.

#### 1. Create a Short URL

- **Endpoint**: `POST /url`
- **Description**: Creates a new short URL associated with the logged-in user.
- **Rate Limit**: 30 requests per minute.
- **Request Body**:
  ```json
  {
    "target_url": "[https://www.google.com](https://www.google.com)",
    "custom_key": "my-google-link",
    "expires_at": "2025-12-31T23:59:59"
  }
  ```

#### 2. Get My URLs

- **Endpoint**: `GET /me/urls`
- **Description**: Retrieves a list of all short URLs created by the logged-in user.
- **Success Response (200 OK)**: A JSON array of URL Info objects, including the QR code and detailed click timestamps.

#### 3. Get URL Statistics

- **Endpoint**: `GET /admin/{secret_key}`
- **Description**: Retrieves statistics for a specific short URL. Only the owner of the link can access this.
- **Success Response (200 OK)**: A single URL Info object with a `qr_code` and detailed `clicks_info`.
  ```json
  {
    "target_url": "[https://www.google.com](https://www.google.com)",
    "is_active": true,
    "clicks": 1,
    "owner_id": 1,
    "expires_at": null,
    "url": "my-link",
    "admin_url": "some_secret_key",
    "qr_code": "data:image/png;base64,iVBORw0KGgo...",
    "clicks_info": [
      {
        "id": 1,
        "url_id": 1,
        "timestamp": "2025-10-10T19:30:00.123456"
      }
    ]
  }
  ```

#### 4. Edit a Short URL

- **Endpoint**: `PATCH /admin/{secret_key}`
- **Description**: Updates the `target_url` of an existing short link. Only the owner can perform this action.
- **Request Body**:
  ```json
  {
    "target_url": "[https://new-destination.com](https://new-destination.com)"
  }
  ```

#### 5. Deactivate a URL

- **Endpoint**: `DELETE /admin/{secret_key}`
- **Description**: Deactivates a short URL, preventing it from redirecting. Only the owner can perform this action.

---

### Public Redirect Endpoint

#### 1. Redirect to Target URL

- **Endpoint**: `GET /{url_key}`
- **Description**: Redirects to the original `target_url` and records a detailed click with a timestamp.
- **Success Response**: `307 Temporary Redirect` to the target URL.
- **Error Response**: `404 Not Found` if the `url_key` does not exist, is inactive, or has expired.

---

## ☁️ Deployment

To deploy this application to a production environment like Render or Heroku:

1.  **Switch to a Production Database**: For production, it is highly recommended to switch from SQLite to a more robust database like **PostgreSQL**. You will need to update the `SQLALCHEMY_DATABASE_URL` in `database.py` with your PostgreSQL connection string (usually stored in an environment variable).

2.  **Use Gunicorn**: The `requirements.txt` includes `gunicorn`, a production-grade WSGI server.

3.  **Start Command**: Use the following command to run the application in production:
    ```bash
    gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
    ```
    This command starts Gunicorn with 4 worker processes to handle requests.

---

## 📜 License

This project is licensed under the MIT License.

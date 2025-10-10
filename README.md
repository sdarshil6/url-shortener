# 🚀 FastAPI URL Shortener

A full-stack URL shortening service built with FastAPI and vanilla JavaScript. This application allows registered users to create, manage, and track short, memorable links from long URLs. The project is designed to be a secure, multi-user service that is simple, efficient, and easy to deploy.

---

## ✨ Key Features

- **User Accounts**: A complete authentication system where users can register, log in, and manage their own collection of links.
- **Link Expiration**: Set an optional expiration date and time for any short link, after which it will automatically deactivate.
- **Custom Short Links**: Users can choose their own custom, memorable names for their short links.
- **Click Tracking**: Automatically counts how many times a short link is visited.
- **Secure Link Management**: All link management is protected, ensuring users can only view stats for and deactivate the links they own.
- **Simple Web Interface**: A clean, single-page UI that dynamically changes based on login status, allowing for account management and link creation.
- **Automatic API Docs**: Interactive API documentation powered by FastAPI and Swagger UI.

---

## 🛠️ Tech Stack

- **Backend**: 🐍 Python 3 with [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: 💾 [SQLAlchemy](https://www.sqlalchemy.org/) ORM with a [SQLite](https://www.sqlite.org/index.html) database for local development.
- **Authentication**: 🔐 [Passlib](https://passlib.readthedocs.io/en/stable/) for password hashing and [python-jose](https://github.com/mpdavis/python-jose) for JSON Web Tokens (JWT).
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

The API is divided into public and protected endpoints. Protected endpoints require a valid JWT access token in the `Authorization` header (`Bearer <TOKEN>`).

### Authentication Endpoints (Public)

#### 1. Register a User

- **Endpoint**: `POST /users`
- **Description**: Creates a new user account.
- **Request Body**:
  ```json
  {
    "username": "newuser",
    "password": "a-strong-password"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "username": "newuser",
    "id": 1
  }
  ```
- **Error Response**: `400 Bad Request` if the username is already registered.

#### 2. Login for Access Token

- **Endpoint**: `POST /token`
- **Description**: Authenticates a user and returns a JWT access token.
- **Request Body**: `application/x-www-form-urlencoded` with `username` and `password` fields.
- **Success Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```
- **Error Response**: `401 Unauthorized` for incorrect credentials.

---

### URL Management Endpoints (Protected 🔒)

**Note:** All endpoints in this section require authentication.

#### 1. Create a Short URL

- **Endpoint**: `POST /url`
- **Description**: Creates a new short URL associated with the logged-in user.
- **Request Body**:
  ```json
  {
    "target_url": "[https://www.google.com](https://www.google.com)",
    "custom_key": "my-google-link",
    "expires_at": "2025-12-31T23:59:59"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "target_url": "[https://www.google.com](https://www.google.com)",
    "is_active": true,
    "clicks": 0,
    "owner_id": 1,
    "expires_at": "2025-12-31T23:59:59",
    "url": "my-google-link",
    "admin_url": "some_secret_key"
  }
  ```

#### 2. Get My URLs

- **Endpoint**: `GET /me/urls`
- **Description**: Retrieves a list of all short URLs created by the logged-in user.
- **Success Response (200 OK)**: A JSON array of URL Info objects.

#### 3. Get URL Statistics

- **Endpoint**: `GET /admin/{secret_key}`
- **Description**: Retrieves statistics for a specific short URL. Only the owner of the link can access this.
- **Success Response (200 OK)**: A single URL Info object.
- **Error Response**: `404 Not Found` if the link doesn't exist or the user is not the owner.

#### 4. Deactivate a URL

- **Endpoint**: `DELETE /admin/{secret_key}`
- **Description**: Deactivates a short URL, preventing it from redirecting. Only the owner can perform this action.
- **Success Response (200 OK)**:
  ```json
  {
    "detail": "Successfully deactivated short URL for '[https://www.google.com](https://www.google.com)'"
  }
  ```
- **Error Response**: `404 Not Found` if the link doesn't exist or the user is not the owner.

---

### Public Redirect Endpoint

#### 1. Redirect to Target URL

- **Endpoint**: `GET /{url_key}`
- **Description**: Redirects to the original `target_url` and increments the click counter.
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

## 🚀 Future Improvements

- **Analytics Dashboard**: Create a dashboard for users to view more detailed analytics (e.g., clicks over time, referrers).
- **QR Code Generation**: Automatically generate a QR code for each created short link.
- **Edit Destination URL**: Allow users to edit the `target_url` of an existing short link.

---

## 📜 License

This project is licensed under the MIT License.

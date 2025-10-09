# 🚀 FastAPI URL Shortener

A full-stack URL shortening service built with FastAPI and vanilla JavaScript. This application allows users to create short, memorable links from long URLs, track their usage, and manage them via a secure admin key. The project is designed to be simple, efficient, and easy to deploy.

---

## ✨ Key Features

- **Shorten Any URL**: Convert long, unwieldy links into a manageable short format.
- **Custom Short Links**: Users can choose their own custom names for their short links.
- **Click Tracking**: Automatically counts how many times a short link is visited.
- **Secure Link Management**: Each link is generated with a unique secret key for viewing stats or deactivating the link.
- **Link Deactivation**: The ability to disable a short link, which will stop it from redirecting.
- **Simple Web Interface**: A clean, single-page UI built with HTML, CSS, and JavaScript for easy interaction.
- **Automatic API Docs**: Interactive API documentation powered by FastAPI and Swagger UI.

---

## 🛠️ Tech Stack

- **Backend**: 🐍 Python 3 with [FastAPI](https://fastapi.tiangolo.com/)
- **Database**: 💾 [SQLAlchemy](https://www.sqlalchemy.org/) ORM with a [SQLite](https://www.sqlite.org/index.html) database for local development.
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

The following are the API endpoints provided by the application.

### 1. Create a Short URL

- **Endpoint**: `POST /url`
- **Description**: Creates a new short URL. Can be random or custom.
- **Request Body (Random Key)**:
  ```json
  {
    "target_url": "[https://en.wikipedia.org/wiki/FastAPI](https://en.wikipedia.org/wiki/FastAPI)"
  }
  ```
- **Request Body (Custom Key)**:
  ```json
  {
    "target_url": "[https://en.wikipedia.org/wiki/FastAPI](https://en.wikipedia.org/wiki/FastAPI)",
    "custom_key": "my-fastapi-link"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "target_url": "[https://en.wikipedia.org/wiki/FastAPI](https://en.wikipedia.org/wiki/FastAPI)",
    "is_active": true,
    "clicks": 0,
    "url": "my-fastapi-link",
    "admin_url": "vKqLpM9z_wE"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: If the provided `target_url` is not valid.
  - `400 Bad Request`: If the requested `custom_key` is already in use.

### 2. Redirect to Target URL

- **Endpoint**: `GET /{url_key}`
- **Description**: Redirects to the original `target_url` and increments the click counter.
- **Success Response**: `307 Temporary Redirect` to the target URL.
- **Error Response**: `404 Not Found` if the `url_key` does not exist or is inactive.

### 3. Get URL Statistics

- **Endpoint**: `GET /admin/{secret_key}`
- **Description**: Retrieves statistics for a short URL using its secret admin key.
- **Success Response (200 OK)**:
  ```json
  {
    "target_url": "[https://www.google.com](https://www.google.com)",
    "is_active": true,
    "clicks": 5,
    "url": "google",
    "admin_url": "some_secret_key"
  }
  ```
- **Error Response**: `404 Not Found` if the `secret_key` does not exist.

### 4. Deactivate a URL

- **Endpoint**: `DELETE /admin/{secret_key}`
- **Description**: Deactivates a short URL, preventing it from redirecting.
- **Success Response (200 OK)**:
  ```json
  {
    "detail": "Successfully deactivated short URL for '[https://www.google.com](https://www.google.com)'"
  }
  ```
- **Error Response**: `404 Not Found` if the `secret_key` does not exist.

---

## ☁️ Deployment

To deploy this application to a production environment like Render or Heroku:

1.  **Switch to a Production Database**: For production, it is highly recommended to switch from SQLite to a more robust database like **PostgreSQL**. You will need to update the `SQLALCHEMY_DATABASE_URL` in `database.py` with your PostgreSQL connection string.

2.  **Use Gunicorn**: The `requirements.txt` includes `gunicorn`, a production-grade WSGI server.

3.  **Start Command**: Use the following command to run the application in production:
    ```bash
    gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
    ```
    This command starts Gunicorn with 4 worker processes to handle requests.

---

## 🚀 Future Improvements

- **User Accounts**: Implement a user authentication system to allow users to manage all their links in one place.
- **Link Expiration**: Add an option to set an expiration date for short links.
- **Analytics Dashboard**: Create a dashboard for users to view more detailed analytics (e.g., clicks over time, referrers).
- **QR Code Generation**: Automatically generate a QR code for each created short link.

---

## 📜 License

This project is licensed under the MIT License.

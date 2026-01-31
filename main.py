from config import settings
import config
from database import SessionLocal, engine
import email_utils
import enrichment
import utils
import crud
import schemas
import models
import auth
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from slowapi import Limiter, _rate_limit_exceeded_handler
import secrets
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status, BackgroundTasks
import validators
from jose import JWTError, jwt
import logging
from fastapi.responses import JSONResponse
from logging_config import setup_logging
from app_state import RECENT_CLICKS_CACHE, DEDUPLICATION_TIMEDELTA
from background_tasks import lifespan
import razorpay
setup_logging()


models.Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware for Angular frontend
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:4200', 'http://127.0.0.1:4200'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)



@app.middleware("http")
async def log_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:

        logging.error("An unhandled error occurred", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred."},
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def add_qr_code_to_url_info(db_url: models.URL, request: Request):
    full_short_url = str(request.base_url) + db_url.key
    db_url.url = db_url.key
    db_url.admin_url = db_url.secret_key
    db_url.qr_code = utils.generate_qr_code(full_short_url)
    return db_url


@app.post("/users", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register_user(
    request: Request,
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    password = user.password
    if len(password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters long.")
    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=400, detail="Password must contain at least one number.")
    if not any(char.isupper() for char in password):
        raise HTTPException(
            status_code=400, detail="Password must contain at least one uppercase letter.")
    if not any(char.islower() for char in password):
        raise HTTPException(
            status_code=400, detail="Password must contain at least one lowercase letter.")
    special_characters = "!@#$%^&*"
    if not any(char in special_characters for char in password):
        raise HTTPException(
            status_code=400, detail=f"Password must contain at least one special character ({special_characters}).")
    otp = str(secrets.randbelow(900000) + 100000)
    otp_expires_at = datetime.utcnow() + timedelta(minutes=10)

    crud.create_user(db=db, user=user, otp=otp, otp_expires_at=otp_expires_at)

    background_tasks.add_task(email_utils.send_otp_email, user.email, otp)

    return {"message": "Registration successful. Please check your email for an OTP to verify your account."}


@app.post("/verify-otp")
def verify_otp(verification_data: schemas.OtpVerification, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=verification_data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.otp or user.otp != verification_data.otp:
        raise HTTPException(status_code=400, detail="Invalid or incorrect OTP")
    if user.otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP has expired")

    crud.verify_user_otp(db, user=user)
    return {"message": "Account verified successfully. You can now log in."}


@app.post("/token", response_model=schemas.Token)
@limiter.limit("10/minute")
def login_for_access_token(
    request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):

    user = crud.get_user_by_email(db, email=form_data.username)

    if user and user.auth_provider != 'email':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was created using a different method. Please use 'Sign in with Google'."
        )

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not verified. Please check your email for an OTP first.",
        )

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me/urls", response_model=List[schemas.URLInfo])
def get_my_urls(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    urls = crud.get_user_urls(db, owner_id=current_user.id)
    return [add_qr_code_to_url_info(url, request) for url in urls]


@app.post("/url", response_model=schemas.URLInfo)
@limiter.limit("30/minute")
def create_url(
    url: schemas.URLCreate,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not validators.url(url.target_url):
        raise HTTPException(
            status_code=400, detail="Your provided URL is not valid")

    db_url = crud.create_db_url(db=db, url=url, owner_id=current_user.id)
    if db_url is None:
        raise HTTPException(
            status_code=400, detail="Custom key already in use")

    return add_qr_code_to_url_info(db_url, request)


@app.get("/admin/{secret_key}", response_model=schemas.URLInfo)
def get_url_info(
    secret_key: str,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_url = crud.get_db_url_by_secret_key(db, secret_key=secret_key)
    if not db_url or db_url.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="URL not found")

    return add_qr_code_to_url_info(db_url, request)


@app.patch("/admin/{secret_key}", response_model=schemas.URLInfo)
def update_url(
    secret_key: str,
    url_update: schemas.URLUpdate,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not validators.url(url_update.target_url):
        raise HTTPException(
            status_code=400, detail="Your provided URL is not valid")

    db_url = crud.get_db_url_by_secret_key(db, secret_key=secret_key)
    if not db_url or db_url.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="URL not found")

    updated_db_url = crud.update_db_url(db, db_url, url_update.target_url)
    return add_qr_code_to_url_info(updated_db_url, request)


@app.delete("/admin/{secret_key}")
def delete_url(
    secret_key: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_url = crud.get_db_url_by_secret_key(db, secret_key)
    if not db_url or db_url.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="URL not found")

    crud.deactivate_db_url_by_secret_key(db, secret_key)
    return {"detail": f"Successfully deactivated short URL for '{db_url.target_url}'"}


@app.get("/{url_key}")
def forward_to_target_url(
    url_key: str,
    request: Request,
    db: Session = Depends(get_db)
):
    db_url = crud.get_db_url_by_key(db=db, url_key=url_key)
    if db_url:
        if db_url.expires_at and datetime.utcnow() > db_url.expires_at:
            crud.deactivate_db_url_by_secret_key(db, db_url.secret_key)
            raise HTTPException(status_code=404, detail="URL not found")

        current_time = datetime.utcnow()
        cache_key = f"{request.client.host}:{url_key}"

        # Check if this is a duplicate click
        if cache_key in RECENT_CLICKS_CACHE:
            last_click_time = RECENT_CLICKS_CACHE[cache_key]
            if current_time - last_click_time < DEDUPLICATION_TIMEDELTA:
                # If it's a duplicate, just redirect and do nothing else
                return RedirectResponse(db_url.target_url)

        # If it's not a duplicate, record the time and proceed
        RECENT_CLICKS_CACHE[cache_key] = current_time

        ip_address = request.client.host
        user_agent = request.headers.get("user-agent", "Unknown")
        referrer = request.headers.get("referer", "Direct")

        geo_data = enrichment.get_geolocation_for_ip(ip_address)
        device_data = enrichment.parse_user_agent(user_agent)

        crud.record_click(
            db, db_url, ip_address, user_agent, referrer, geo_data, device_data
        )

        return RedirectResponse(db_url.target_url)
    else:
        raise HTTPException(status_code=404, detail="URL not found")


@app.post("/forgot-password")
async def forgot_password(
    payload: schemas.PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=payload.email)
    if not user:

        return {"message": "If an account with that email exists, a password reset link has been sent."}

    if (user & user.auth_provider != 'email'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account was created using a different method. Please use 'Sign in with Google.'"
        )

    reset_token = auth.create_password_reset_token(data={"sub": user.email})
    crud.set_password_reset_token(db, user=user, token=reset_token)

    reset_link = f"{settings.APP_URL}#/reset-password?token={reset_token}"

    background_tasks.add_task(
        email_utils.send_password_reset_email, user.email, reset_link
    )

    return {"message": "If an account with that email exists, a password reset link has been sent."}


@app.post("/reset-password")
def reset_password(payload: schemas.PasswordReset, db: Session = Depends(get_db)):
    try:
        token_payload = jwt.decode(
            payload.token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        if token_payload.get("type") != "reset":
            raise HTTPException(status_code=401, detail="Invalid token type")
        email = token_payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = crud.get_user_by_reset_token(db, token=payload.token)
    if not user or user.email != email or user.reset_token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    crud.update_user_password(db, user=user, new_password=payload.new_password)
    return {"message": "Password has been reset successfully."}


@app.get("/auth/google/login")
async def google_login():
    """Generate login url and redirect."""
    return await auth.google_sso.get_login_redirect()


@app.get("/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Process login response from Google and return user token."""
    try:

        async with auth.google_sso as sso:
            sso_user = await sso.verify_and_process(request)

        if not sso_user or not sso_user.email:
            raise HTTPException(
                status_code=400, detail="Could not retrieve user info from Google")

        user = crud.get_user_by_email(db, email=sso_user.email)

        if user:
            if user.auth_provider != 'google':
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"An account with email {user.email} already exists. Please log in with your password."
                )
        else:
            new_user_data = schemas.UserCreate(
                email=sso_user.email, password=None)
            user = crud.create_user(
                db, user=new_user_data, is_verified=True, auth_provider='google')

        access_token = auth.create_access_token(data={"sub": user.email})

        # Redirect to frontend with token
        return RedirectResponse(
            url=f"http://localhost:4200/auth/login?token={access_token}"
        )
    except Exception as e:
        logging.error(f"Failed to authenticate with Google: {e}")
        return RedirectResponse(url="http://localhost:4200/auth/login?error=GoogleAuthFailed")


@app.get("/admin/{secret_key}/analytics", response_model=schemas.AnalyticsData)
def get_url_analytics(
    secret_key: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_url = crud.get_db_url_by_secret_key(db, secret_key=secret_key)
    if not db_url or db_url.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="URL not found")

    return crud.get_analytics_for_url(db_url)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)


@app.post("/payments/create-subscription", status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: schemas.SubscriptionRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    try:
        subscription = razorpay_client.subscription.create({
            "plan_id": payload.plan_id,
            "total_count": 12,  # For a 12-cycle (1 year) subscription
            "quantity": 1,
            "customer_notify": 0  # We will handle notifications
        })

        # Save the subscription ID to the user's record
        crud.update_user_subscription_id(
            db, current_user.id, sub_id=subscription['id'])

        return {
            "subscription_id": subscription['id'],
            "key_id": settings.RAZORPAY_KEY_ID
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error creating subscription: {str(e)}")


@app.post("/payments/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()
    try:
        signature = request.headers.get("x-razorpay-signature")
        razorpay_client.utility.verify_webhook_signature(
            raw_body.decode(), signature, settings.RAZORPAY_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(
            status_code=400, detail="Webhook signature verification failed")

    payload = await request.json()
    event = payload.get("event")

    if event == "invoice.paid":
        subscription_id = payload.get("payload", {}).get(
            "invoice", {}).get("entity", {}).get("subscription_id")
        plan_id = payload.get("payload", {}).get(
            "invoice", {}).get("entity", {}).get("plan_id")

        if not subscription_id:
            return Response(status_code=200)

        user = crud.get_user_by_subscription_id(db, sub_id=subscription_id)
        if user:
            plan_name = "pro" if plan_id == settings.RAZORPAY_PRO_PLAN_ID else "business"
            crud.update_user_plan_from_webhook(
                db, user, plan_name=plan_name, status="active")
            logging.info(
                f"Subscription activated for user {user.email}, plan: {plan_name}")

    return Response(status_code=200)

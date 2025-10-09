import validators
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime  # <-- NEW IMPORT
import auth
import models
import schemas
import crud
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

templates = Jinja2Templates(directory="templates")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/users", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)


@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me/urls", response_model=List[schemas.URLInfo])
def get_my_urls(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    urls = crud.get_user_urls(db, owner_id=current_user.id)
    for url in urls:
        url.url = url.key
        url.admin_url = url.secret_key
    return urls


@app.post("/url", response_model=schemas.URLInfo)
def create_url(
    url: schemas.URLCreate,
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

    db_url.url = db_url.key
    db_url.admin_url = db_url.secret_key
    return db_url


@app.get("/admin/{secret_key}", response_model=schemas.URLInfo)
def get_url_info(
    secret_key: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    db_url = crud.get_db_url_by_secret_key(db, secret_key=secret_key)
    if not db_url or db_url.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="URL not found")

    db_url.url = db_url.key
    db_url.admin_url = db_url.secret_key
    return db_url


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


@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


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

        crud.update_db_clicks(db=db, db_url=db_url)
        return RedirectResponse(db_url.target_url)
    else:
        raise HTTPException(status_code=404, detail="URL not found")

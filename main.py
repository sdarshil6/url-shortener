import validators
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
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


@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/url", response_model=schemas.URLInfo)
def create_url(url: schemas.URLCreate, db: Session = Depends(get_db)):
    if not validators.url(url.target_url):
        raise HTTPException(
            status_code=400, detail="Your provided URL is not valid")

    db_url = crud.create_db_url(db=db, url=url)
    if db_url is None:
        raise HTTPException(
            status_code=400, detail="Custom key already in use"
        )

    db_url.url = db_url.key
    db_url.admin_url = db_url.secret_key
    return db_url


@app.get("/{url_key}")
def forward_to_target_url(
    url_key: str,
    request: Request,
    db: Session = Depends(get_db)
):
    db_url = crud.get_db_url_by_key(db=db, url_key=url_key)
    if db_url:
        crud.update_db_clicks(db=db, db_url=db_url)
        return RedirectResponse(db_url.target_url)
    else:
        raise HTTPException(status_code=4e4, detail="URL not found")


@app.get("/admin/{secret_key}", response_model=schemas.URLInfo)
def get_url_info(secret_key: str, request: Request, db: Session = Depends(get_db)):
    db_url = crud.get_db_url_by_secret_key(db, secret_key=secret_key)
    if db_url:
        db_url.url = db_url.key
        db_url.admin_url = db_url.secret_key
        return db_url
    else:
        raise HTTPException(status_code=404, detail="URL not found")


@app.delete("/admin/{secret_key}")
def delete_url(secret_key: str, db: Session = Depends(get_db)):
    db_url = crud.deactivate_db_url_by_secret_key(db, secret_key)
    if db_url is None:
        raise HTTPException(
            status_code=404, detail="URL not found"
        )
    return {"detail": f"Successfully deactivated short URL for '{db_url.target_url}'"}

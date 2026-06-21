import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool

from app.env_loader import load_env_file

load_env_file()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost/car_rental")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    poolclass = StaticPool
else:
    connect_args = {}
    poolclass = None

engine_kwargs = {"connect_args": connect_args}
if poolclass is not None:
    engine_kwargs["poolclass"] = poolclass

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

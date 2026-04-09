from dotenv import load_dotenv
from .classes import PostgreSQL
import os

load_dotenv(override=True)

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', '')
    TOKEN_SECRET_KEY = os.getenv('TOKEN_SECRET_KEY', '')

    DB_HOST = os.getenv('DB_HOST', '')
    DB_NAME = os.getenv('DB_NAME', '')
    DB_PORT = os.getenv('DB_PORT', '')
    DB_USER = os.getenv('DB_USER', '')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '')

    SCHEMA = 'clinica'
    T_USER = 't_usuario'

db = PostgreSQL(
    Config.DB_HOST,
    Config.DB_PORT,
    Config.DB_NAME,
    Config.DB_USER,
    Config.DB_PASSWORD
)
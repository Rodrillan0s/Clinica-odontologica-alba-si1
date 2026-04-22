from dotenv import load_dotenv
from .classes import PostgreSQL
import os

load_dotenv(override=True) 

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', '')
    TOKEN_SECRET_KEY = os.getenv('TOKEN_SECRET_KEY', '')

    # CONFIGURACION BASE DE DATOS
    DB_HOST = os.getenv('DB_HOST','')
    DB_NAME = os.getenv('DB_NAME','')
    DB_PORT = os.getenv('DB_PORT','')
    DB_USER = os.getenv('DB_USER','')
    DB_PASSWORD = os.getenv('DB_PASSWORD','')

    # ==========================================
    # CONFIGURACION DE GMAIL (NUEVO)
    # ==========================================
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    # Estos los sacamos de tu .env para que no estén públicos
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'toledoquirogaeddy@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'gdcp iiyv xeqx jpup')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME', 'toledoquirogaeddy@gmail.com')

    # ESQUEMA CONTENEDOR DE LA APLICACION
    SCHEMA = 'clinica'
    
    # TABLAS A DISPOSICION EN LA BASE DE DATOS
    T_USER = 'T_USUARIO'
    T_CITAS = 'T_CITAS'

db = PostgreSQL(
    Config.DB_HOST,
    Config.DB_PORT,
    Config.DB_NAME,
    Config.DB_USER,
    Config.DB_PASSWORD
)
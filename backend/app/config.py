from dotenv import load_dotenv
from .classes import PostgreSQL
import os

class Config:
     #CLAVE PARA LA CONFIGURACION DE FLASK
    SECRET_KEY=os.getenv('SECRET_KEY','')

    #CLAVE SECRETA PARA CONFIGURACION DE ACCESS_TOKENS
    TOKEN_SECRET_KEY=os.getenv('TOKEN_SECRET_KEY','')

    #CONFIGURACION BASE DE DATOS
    DB_HOST=os.getenv('DB_HOST','')
    DB_NAME=os.getenv('DB_NAME','')
    DB_PORT=os.getenv('DB_PORT','')
    DB_USER=os.getenv('DB_USER','')
    DB_PASSWORD=os.getenv('DB_PASSWORD','')

    #ESQUEMA CONTENEDOR DE LA APLICACION
    SCHEMA='agroenlace'
    
    #TABLAS A DISPOSICION EN LA BASE DE DATOS
    T_USER='USUARIO'

db=PostgreSQL(
    Config.DB_HOST,
    Config.DB_PORT,
    Config.DB_NAME,
    Config.DB_USER,
    Config.DB_PASSWORD
)
import jwt
from functools import wraps
from flask import request, jsonify
from ..config import Config


class Security:

    @staticmethod
    def get_user_from_token():

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return None

        try:
            # Bearer TOKEN
            token = auth_header.split(" ")[1]

            data = jwt.decode(
                token,
                Config.SECRET_KEY,
                algorithms=["HS256"]
            )

            return {
                "id_usuario": data.get("id_usuario"),
                "rol": data.get("rol")
            }

        except Exception as e:
            print("ERROR TOKEN:", e)
            return None


    @staticmethod
    def is_admin():
        user = Security.get_user_from_token()

        return user and user["rol"] == 1


    @staticmethod
    def get_user_id():
        user = Security.get_user_from_token()

        return user["id_usuario"] if user else None


# =========================================================
# DECORATOR GLOBAL DE ADMIN
# =========================================================

def admin_required(f):

    @wraps(f)
    def wrapper(*args, **kwargs):

        user = Security.get_user_from_token()

        if not user:
            return jsonify({
                "success": False,
                "message": "No autenticado"
            }), 401

        if user["rol"] != 1:
            return jsonify({
                "success": False,
                "message": "No autorizado (solo ADMIN)"
            }), 403

        return f(*args, **kwargs)

    return wrapper
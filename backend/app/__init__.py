from .config import Config
from flask import Flask
from flask_cors import CORS
from .routes import main_routes,auth_routes

def create_app():
    app=Flask(__name__)

    app.config.from_object(Config)

    app.register_blueprint(main_routes)
    app.register_blueprint(auth_routes)

    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    return app
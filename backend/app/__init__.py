from .config import Config
from flask import Flask
from flask_cors import CORS
from flask_mail import Mail # <--- 1. Importar Mail
# 2. Instanciar Mail fuera para que sea importable en otros archivos
mail = Mail()

def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    # 3. Inicializar mail con la configuración de la app
    mail.init_app(app)
    from .routes import main_routes, auth_routes, citas_routes
    app.register_blueprint(main_routes)
    app.register_blueprint(auth_routes)
    app.register_blueprint(citas_routes)
    
    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"]
    )

    return app
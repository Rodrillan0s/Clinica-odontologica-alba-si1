from app import create_app
from app.routes.test_routes import test_routes 
app=create_app()
app.register_blueprint(test_routes)
if __name__=='__main__':
    app.run(debug=True)
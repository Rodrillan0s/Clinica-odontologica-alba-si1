from app import create_app

from app.routes.pacientes_routes import paciente_routes
from app.routes.usuario_routes import usuario_routes 


app=create_app()

app.register_blueprint(paciente_routes)

if __name__=='__main__':
    app.run(debug=True)


#HOLA 

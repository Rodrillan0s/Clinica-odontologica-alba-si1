from flask import Blueprint, request, jsonify
from ..services.citas_service import build_citas_query  

from ..config import db,Config

citas_routes = Blueprint('citas_routes', __name__)

@citas_routes.route('/api/citas', methods=['POST'])
def create_cita():
    data = request.get_json()

    required_fields=['fecha_agendamiento','id_paciente','id_odontologo','id_sala','cita_obs']

    for field in required_fields:
        if field not in data:
            return jsonify({
                'success':False,
                'message':'Debe Ingresar Todos los Campos Requeridos'
            })
    
    fecha_agendamiento=data.get('fecha_agendamiento')
    id_paciente=data.get('id_paciente')
    id_odontologo=data.get('id_odontologo')
    id_sala=data.get('id_sala')
    cita_obs=data.get('cita_obs')   

    try:
        db.create_connection()
        query = f"CALL {Config.SCHEMA}.p_crear_cita(%s, %s, %s, %s, %s)"
        params=(id_odontologo, id_paciente, fecha_agendamiento, id_sala, cita_obs)
        
        db.execute_query(query, params, commit=True)
        
        return jsonify({
            'success':True,
            'message':'Cita creada exitosamente'
        })
    except Exception as e:
        return jsonify({
            'success':False,
            'message':f'ERROR : {e}'
        })
    finally:
        db.close_connection()   

@citas_routes.route('/api/citas', methods=['GET'])
def get_citas():
    filters = request.args.to_dict()
    page = int(filters.get('page', 1))
    limit = int(filters.get('limit', 10))
    offset = (page - 1) * limit

    try:
        db.create_connection()            
        query, params = build_citas_query(filters, limit, offset, Config.SCHEMA, Config.T_CITAS)    
        results = db.execute_query(query, params, fetchall=True)

        citas_list = []
        if results:
            for row in results:
                citas_list.append({
                    "id_personal": row[0],
                    "id_paciente": row[1],
                    "fecha_registro": row[2],
                    "fecha_agendamiento": row[3],
                    "estado_cita": row[4],
                    "id_sala": row[5],
                    "cita_obs": row[6]  
                })
                
        response = {
            "data": citas_list,
            "page": page,
            "limit": limit
        }

        return jsonify(response), 200    
    except Exception as e:
        return jsonify({'message': f'Error al obtener las citas: {e}'}), 500
    finally:
        db.close_connection()


@citas_routes.route('/api/citas/<int:id>', methods=['PUT'])
def update_cita(id):
    data = request.get_json()
    return jsonify({'message': 'Cita actualizada exitosamente'}), 200

@citas_routes.route('/api/citas/<int:id>', methods=['GET'])
def get_cita(id):
    return jsonify({'message': 'Cita obtenida exitosamente'}), 200

   

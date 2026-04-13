from flask import Blueprint, request, jsonify
from ..services.citas_service import build_citas_query  

from ..config import db,Config

citas_routes = Blueprint('citas_routes', __name__)

@citas_routes.route('/api/citas', methods=['POST'])
def create_cita():
    data = request.get_json()

    required_fields=['fecha_registro','id_paciente','id_odontologo','id_sala','cita_obs']

    for field in required_fields:
        if field not in data:
            return jsonify({
                'success':False,
                'message':'Debe Ingresar Todos los Campos Requeridos'
            })
    
    fecha_registro=data.get('fecha_registro')
    id_paciente=data.get('id_paciente')
    id_odontologo=data.get('id_odontologo')
    id_sala=data.get('id_sala')
    cita_obs=data.get('cita_obs')   

    try:
        db.create_connection()
        query = f"""
            INSERT INTO {Config.SCHEMA}.{Config.T_CITAS} 
            (FECHA_REGISTRO,ID_PACIENTE,ID_ODONTOLOGO,ID_SALA,CITA_OBS)
            VALUES (%s,%s,%s,%s,%s)
        """
        params=(fecha_registro,id_paciente,id_odontologo,id_sala,cita_obs)
        result=db.execute_query(query,params,commit=True)
        if result<1:
            return jsonify({
                'success':False,
                'message':'Hubo un problema al registrar la cita'
            })
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

@citas_routes.route('/api/citas/<int:id>', methods=['DELETE'])
def delete_cita(id):
    return jsonify({'message': 'Cita eliminada exitosamente'}), 200 

@citas_routes.route('/api/citas/<int:id>', methods=['GET'])
def get_cita(id):
    return jsonify({'message': 'Cita obtenida exitosamente'}), 200

   

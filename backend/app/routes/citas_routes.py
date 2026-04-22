from flask import Blueprint, request, jsonify
from ..services.citas_service import build_citas_query  
from datetime import timedelta,datetime
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

    required_fields = ['id_personal', 'id_paciente', 'fecha_agendamiento', 'id_sala', 'cita_obs']

    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': 'Debe Ingresar Todos los Campos Requeridos'
            }), 400

    id_personal = data.get('id_personal')
    id_paciente = data.get('id_paciente')
    fecha_agendamiento = data.get('fecha_agendamiento')
    id_sala = data.get('id_sala')
    cita_obs = data.get('cita_obs')

    try:
        db.create_connection()
        query = f"CALL {Config.SCHEMA}.p_actualizar_cita(%s, %s, %s, %s, %s, %s)"
        params = (id, id_personal, id_paciente, fecha_agendamiento, id_sala, cita_obs)

        db.execute_query(query, params, commit=True)

        return jsonify({
            'success': True,
            'message': 'Cita actualizada exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'ERROR : {e}'
        }), 500
    finally:
        db.close_connection()

@citas_routes.route('/api/citas/<int:id>', methods=['GET'])
def get_cita(id):
    try:
        db.create_connection()
        query = f"""
            SELECT id_personal, id_paciente, fecha_registro, fecha_agendamiento, estado_cita, id_sala, cita_obs
            FROM {Config.SCHEMA}.{Config.T_CITAS}
            WHERE id_cita = %s
        """
        result = db.execute_query(query, (id,), fetchone=True)

        if not result:
            return jsonify({'success': False, 'message': 'Cita no encontrada'}), 404

        cita = {
            "id_personal": result[0],
            "id_paciente": result[1],
            "fecha_registro": result[2],
            "fecha_agendamiento": result[3],
            "estado_cita": result[4],
            "id_sala": result[5],
            "cita_obs": result[6]
        }

        return jsonify({'success': True, 'data': cita}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al obtener la cita: {e}'}), 500
    finally:
        db.close_connection()

@citas_routes.route('/api/citas/odontologos-por-procedimiento/<int:id_procedimiento>', methods=['GET'])
def get_odontologos_por_procedimiento(id_procedimiento):
    try:
        db.create_connection()
        query = f"SELECT * FROM {Config.SCHEMA}.fn_obtener_odontologos_por_procedimiento(%s)"
        results = db.execute_query(query, (id_procedimiento,), fetchall=True)

        odontologos = [{
            "id_personal": row[0],
            "nombre": row[1]
        } for row in (results or [])]

        return jsonify({'success': True, 'data': odontologos}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {e}'}), 500
    finally:
        db.close_connection()

@citas_routes.route('/api/procedimientos', methods=['GET'])
def get_procedimientos():
    try:
        db.create_connection()
        query = f"SELECT * FROM {Config.SCHEMA}.fn_obtener_todos_los_procedimientos()"
        results = db.execute_query(query, fetchall=True)

        procedimientos = [{
            "id": row[0],
            "descripcion": row[1]
        } for row in (results or [])]

        return jsonify({'success': True, 'data': procedimientos}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al obtener procedimientos: {e}'}), 500
    finally:
        db.close_connection()    


#http://127.0.0.1:5000/api/citas/disponibilidad?id_personal=1&id_sala=1&fecha=2026-04-17
@citas_routes.route('/api/citas/disponibilidad', methods=['GET'])
def get_disponibilidad():
    try:
     
        id_personal = request.args.get('id_personal')
        id_sala = request.args.get('id_sala')
        fecha_str = request.args.get('fecha')
        
        if not all([id_personal, id_sala, fecha_str]):
            return jsonify({'success': False, 'message': 'Faltan parámetros'}), 400

       
        db.create_connection()
        query = "SELECT * FROM clinica.fn_obtener_slots_libres(%s, %s, %s, 30)"
        results = db.execute_query(query, (id_personal, id_sala, fecha_str), fetchall=True)
        
        
        lista_resultados = results if results is not None else []
        

        data = [{'inicio': str(r[0])[:5], 'fin': str(r[1])[:5]} for r in lista_resultados]
        
        return jsonify({'success': True, 'data': data}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()
    #solo para pushear

@citas_routes.route('/api/odontologos', methods=['GET'])
def get_odontologos():
    try:
        # Buscamos en t_persona y t_usuario donde el rol sea 2 (ODONTOLOGO)
        sql = f"""
            SELECT p.id_persona, p.nombre 
            FROM {Config.SCHEMA}.t_persona p
            JOIN {Config.SCHEMA}.t_usuario u ON p.id_persona = u.id_persona
            WHERE u.id_rol = 2
        """
        # Tu clase db ya tiene el execute_query optimizado
        doctores = db.execute_query(sql, fetchall=True)
        
        # Formateamos para que React lo entienda fácil
        lista = [{"id": d[0], "nombre": d[1]} for d in doctores]
        return jsonify(lista), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
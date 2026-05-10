from flask import Blueprint, request, jsonify
from ..services.citas_service import build_citas_query  
from datetime import timedelta, datetime
from ..config import db, Config
import json, traceback

citas_routes = Blueprint('citas_routes', __name__)


def obtener_ip():
    """Obtiene la IP real del cliente."""
    if request.headers.getlist("X-Forwarded-For"):
        return request.headers.getlist("X-Forwarded-For")[0].split(',')[0]
    return request.remote_addr

def log_evento(modulo, accion, descripcion, id_usuario=None, id_sesion=None):
    """Inserta el registro en t_bitacora usando metadata JSON para la IP."""
    try:
        # Guardamos la IP en metadata para no depender de la columna ip_direccion
        meta = json.dumps({"ip": obtener_ip()})
        sql = f"""
            INSERT INTO {Config.SCHEMA}.t_bitacora 
            (modulo, accion, descripcion, id_usuario, id_sesion, metadata)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (modulo, accion, descripcion, id_usuario, id_sesion, meta)
        db.execute_query(sql, params, commit=True)
    except Exception as e:
        print(f"Error en Bitácora (Citas): {e}")



@citas_routes.route('/api/citas', methods=['POST'])
def create_cita():
    data = request.get_json() or {} 
    # 1. Validación de campos obligatorios para el negocio
    required_fields = ['fecha_agendamiento', 'id_paciente', 'id_odontologo', 'id_sala', 'cita_obs']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'success': False,
                'message': f'Falta el campo requerido: {field}'
            }), 400 # Código 400: Bad Request
    
    # 2. Extracción de datos de la cita
    fecha_agendamiento = data.get('fecha_agendamiento')
    id_paciente = data.get('id_paciente')
    id_odontologo = data.get('id_odontologo')
    id_sala = data.get('id_sala')
    cita_obs = data.get('cita_obs')   

    # 3. Datos para bitácora (enviados desde el Front)
    # Si no vienen (None), se guardarán como NULL en la DB hasta que actualices el Front
    id_u = data.get('id_usuario')
    id_s = data.get('id_sesion')

    try:

        
        # Ejecución del Procedure en Supabase
        query = f"CALL {Config.SCHEMA}.p_crear_cita(%s, %s, %s, %s, %s)"
        params = (id_odontologo, id_paciente, fecha_agendamiento, id_sala, cita_obs)
        db.execute_query(query, params, commit=True)
        
        # --- REGISTRO EN BITÁCORA ---
        # Personalizamos la descripción para que sea más informativa en el buscador
        descripcion_log = f"Nueva cita: Paciente {id_paciente} | Doc {id_odontologo} | Sala {id_sala}"
        
        log_evento('CITAS', 'CREAR_CITA', descripcion_log, id_u, id_s)
        
        return jsonify({
            'success': True,
            'message': 'Cita creada exitosamente'
        }), 201 # Código 201: Created
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error al registrar la cita: {str(e)}'
        }), 500
    
       

@citas_routes.route('/api/citas', methods=['GET'])
def get_citas():
    filters = request.args.to_dict()
    page = int(filters.get('page', 1))
    limit = int(filters.get('limit', 10))
    offset = (page - 1) * limit

    try:
                    
        # Llamada a la nueva función f_obtener_citas con 12 parámetros
        query = f"SELECT * FROM {Config.SCHEMA}.f_obtener_citas(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        params = (
            filters.get('id_personal'),
            filters.get('id_paciente'),
            filters.get('fecha_agen_desde'),
            filters.get('fecha_agen_hasta'),
            filters.get('fecha_reg_desde'),
            filters.get('fecha_reg_hasta'),
            filters.get('fecha_fin_desde'),
            filters.get('fecha_fin_hasta'),
            filters.get('id_sala'),
            filters.get('estado'),
            limit,
            offset
        )
        results = db.execute_query(query, params, fetchall=True)

        citas_list = []
        if results:
            for row in results:
                citas_list.append({
                    "id_cita": row[0],
                    "id_personal": row[1],
                    "id_paciente": row[2],
                    "fecha_registro": row[3].isoformat() if row[3] else None,
                    "fecha_agendamiento": row[4].isoformat() if row[4] else None,
                    "fecha_finalizacion": row[5].isoformat() if row[5] else None,
                    "estado_cita": row[6],
                    "id_sala": row[7],
                    "cita_obs": row[8]  
                })
                
        response = {
            "data": citas_list,
            "page": page,
            "limit": limit
        }

        return jsonify(response), 200    
    except Exception as e:
        return jsonify({'message': f'Error al obtener las citas: {e}'}), 500
    
        


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
    
    # Datos para bitácora
    id_u = data.get('id_usuario')
    id_s = data.get('id_sesion')
    estado_cita = data.get('estado_cita') 
    fecha_finalizacion = data.get('fecha_finalizacion') 

    try:
        
        query = f"CALL {Config.SCHEMA}.p_actualizar_cita(%s, %s, %s, %s, %s, %s, %s, %s)"
        params = (id, id_personal, id_paciente, fecha_agendamiento, id_sala, cita_obs, estado_cita, fecha_finalizacion)

        db.execute_query(query, params, commit=True)

        # REGISTRO EN BITÁCORA
        log_evento('CITAS', 'ACTUALIZAR_CITA', f'Cita ID: {id} actualizada. Nueva fecha: {fecha_agendamiento}', id_u, id_s)

        return jsonify({
            'success': True,
            'message': 'Cita actualizada exitosamente'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'ERROR : {e}'
        }), 500
    
        

@citas_routes.route('/api/citas/<int:id>', methods=['GET'])
def get_cita(id):
    try:
        
        query = f"SELECT * FROM {Config.SCHEMA}.f_obtener_detalle_cita(%s)"
        result = db.execute_query(query, (id,), fetchone=True)

        if not result:
            return jsonify({'success': False, 'message': 'Cita no encontrada'}), 404

        cita = {
            "id_cita": result[0],
            "nombre_personal": result[1],
            "nombre_paciente": result[2],
            "fecha_registro": result[3].isoformat() if result[3] else None,
            "fecha_agendamiento": result[4].isoformat() if result[4] else None,
            "fecha_finalizacion": result[5].isoformat() if result[5] else None,
            "estado_cita": result[6],
            "nombre_sala": result[7],
            "cita_obs": result[8]
        }

        return jsonify({'success': True, 'data': cita}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al obtener la cita: {e}'}), 500
    
        

@citas_routes.route('/api/citas/odontologos-por-procedimiento/<int:id_procedimiento>', methods=['GET'])
def get_odontologos_por_procedimiento(id_procedimiento):
    try:
        
        query = f"SELECT * FROM {Config.SCHEMA}.fn_obtener_odontologos_por_procedimiento(%s)"
        results = db.execute_query(query, (id_procedimiento,), fetchall=True)

        odontologos = [{
            "id_personal": row[0],
            "nombre": row[1]
        } for row in (results or [])]

        return jsonify({'success': True, 'data': odontologos}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error: {e}'}), 500
    
        

@citas_routes.route('/api/procedimientos', methods=['GET'])
def get_procedimientos():
    try:
   
        query = f"SELECT * FROM {Config.SCHEMA}.fn_obtener_todos_los_procedimientos()"
        results = db.execute_query(query, fetchall=True)

        procedimientos = [{
            "id": row[0],
            "descripcion": row[1]
        } for row in (results or [])]

        return jsonify({'success': True, 'data': procedimientos}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al obtener procedimientos: {e}'}), 500
    
            

@citas_routes.route('/api/citas/disponibilidad', methods=['GET'])
def get_disponibilidad():
    try:
        id_personal = request.args.get('id_personal')
        id_sala = request.args.get('id_sala')
        fecha_str = request.args.get('fecha')
        
        if not all([id_personal, id_sala, fecha_str]):
            return jsonify({'success': False, 'message': 'Faltan parámetros'}), 400

  
        query = f"SELECT * FROM {Config.SCHEMA}.fn_obtener_slots_libres(%s, %s, %s, 30)"
        results = db.execute_query(query, (id_personal, id_sala, fecha_str), fetchall=True)
        
        lista_resultados = results if results is not None else []
        data = [{'inicio': str(r[0])[:5], 'fin': str(r[1])[:5]} for r in lista_resultados]
        
        return jsonify({'success': True, 'data': data}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
        

@citas_routes.route('/api/odontologos', methods=['GET'])
def get_odontologos():
    try:
       # Aseguramos conexión abierta
        sql = f"""
            SELECT p.id_persona, p.nombre 
            FROM {Config.SCHEMA}.t_persona p
            JOIN {Config.SCHEMA}.t_usuario u ON p.id_persona = u.id_persona
            WHERE u.id_rol = 2
        """
        doctores = db.execute_query(sql, fetchall=True)
        
        lista = [{"id": d[0], "nombre": d[1]} for d in (doctores or [])]
        return jsonify(lista), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
        

@citas_routes.route('/api/salas', methods=['GET'])
def get_salas():
    try:
        
        query = f"SELECT id_sala, nombre, tipo_sala, estado_sala FROM {Config.SCHEMA}.t_sala"
        results = db.execute_query(query, fetchall=True)

        salas = [{
            "id_sala": row[0],
            "nombre": row[1],
            "tipo_sala": row[2],
            "estado_sala": row[3]
        } for row in (results or [])]

        return jsonify({'success': True, 'data': salas}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al obtener salas: {e}'}), 500
    
        




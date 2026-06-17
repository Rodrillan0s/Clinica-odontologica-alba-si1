from flask import Blueprint, request, jsonify
from ..config import db, Config
from ..classes.security import admin_required, permission_required
from ..services.bitacora import Bitacora

consultorios_routes = Blueprint('consultorios_routes', __name__)

# =========================================================
# 1. OBTENER TODOS LOS CONSULTORIOS (GET)
# =========================================================
@consultorios_routes.route('/api/consultorios', methods=['GET'])
def get_consultorios():
    try:
        query = f"SELECT id_sala, nombre, tipo_sala, estado_sala FROM {Config.SCHEMA}.t_sala ORDER BY id_sala ASC"
        results = db.execute_query(query, fetchall=True)

        salas = [{
            "id_sala": row[0],
            "nombre": row[1],
            "tipo_sala": row[2],
            "estado_sala": row[3]
        } for row in (results or [])]

        return jsonify({'success': True, 'data': salas}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =========================================================
# 2. OBTENER UN CONSULTORIO (GET)
# =========================================================
@consultorios_routes.route('/api/consultorios/<int:id_sala>', methods=['GET'])
def get_consultorio(id_sala):
    try:
        query = f"SELECT id_sala, nombre, tipo_sala, estado_sala FROM {Config.SCHEMA}.t_sala WHERE id_sala = %s"
        row = db.execute_query(query, (id_sala,), fetchone=True)
        
        if not row:
            return jsonify({'success': False, 'message': 'Consultorio no encontrado'}), 404
            
        sala = {
            "id_sala": row[0],
            "nombre": row[1],
            "tipo_sala": row[2],
            "estado_sala": row[3]
        }
        return jsonify({'success': True, 'data': sala}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =========================================================
# 3. CREAR UN CONSULTORIO (POST)
# =========================================================
@consultorios_routes.route('/api/consultorios', methods=['POST'])
def create_consultorio():
    try:
        data = request.get_json() or {}
        nombre = data.get('nombre')
        tipo_sala = data.get('tipo_sala', 'GENERAL')
        estado_sala = data.get('estado_sala', 'ACTIVA')

        if not nombre:
            return jsonify({'success': False, 'message': 'El nombre es requerido'}), 400

        query = f"INSERT INTO {Config.SCHEMA}.t_sala (nombre, tipo_sala, estado_sala) VALUES (%s, %s, %s)"
        db.execute_query(query, (str(nombre), str(tipo_sala), str(estado_sala)), commit=True)
        
        Bitacora.registrar("CONSULTORIOS", "CREATE", f"Consultorio creado: {nombre}")
        return jsonify({'success': True, 'message': 'Consultorio creado exitosamente'}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =========================================================
# 4. ACTUALIZAR UN CONSULTORIO (PUT)
# =========================================================
@consultorios_routes.route('/api/consultorios/<int:id_sala>', methods=['PUT'])
def update_consultorio(id_sala):
    try:
        data = request.get_json() or {}
        nombre = data.get('nombre')
        tipo_sala = data.get('tipo_sala')
        estado_sala = data.get('estado_sala')

        if not nombre:
            return jsonify({'success': False, 'message': 'El nombre es requerido'}), 400

        query = f"UPDATE {Config.SCHEMA}.t_sala SET nombre = %s, tipo_sala = %s, estado_sala = %s WHERE id_sala = %s"
        db.execute_query(query, (str(nombre), str(tipo_sala), str(estado_sala), int(id_sala)), commit=True)
        
        Bitacora.registrar("CONSULTORIOS", "UPDATE", f"Consultorio actualizado: {id_sala}")
        return jsonify({'success': True, 'message': 'Consultorio actualizado exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =========================================================
# 5. ELIMINAR UN CONSULTORIO (DELETE)
# =========================================================
@consultorios_routes.route('/api/consultorios/<int:id_sala>', methods=['DELETE'])
def delete_consultorio(id_sala):
    try:
        query_check = f"SELECT nombre FROM {Config.SCHEMA}.t_sala WHERE id_sala = %s"
        row = db.execute_query(query_check, (int(id_sala),), fetchone=True)
        if not row:
            return jsonify({'success': False, 'message': 'Consultorio no encontrado'}), 404

        query = f"DELETE FROM {Config.SCHEMA}.t_sala WHERE id_sala = %s"
        db.execute_query(query, (int(id_sala),), commit=True)
        
        Bitacora.registrar("CONSULTORIOS", "DELETE", f"Consultorio eliminado: {row[0]}")
        return jsonify({'success': True, 'message': 'Consultorio eliminado exitosamente'}), 200
    except Exception as e:
        err_msg = str(e)
        if "foreign key" in err_msg.lower() or "llave foránea" in err_msg.lower():
            return jsonify({'success': False, 'message': 'No se puede eliminar el consultorio porque tiene citas o registros asociados.'}), 409
        return jsonify({'success': False, 'message': err_msg}), 500

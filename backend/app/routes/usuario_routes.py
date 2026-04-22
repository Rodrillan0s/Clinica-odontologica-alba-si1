from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
import traceback
import psycopg2
from ..config import db, Config

usuario_routes = Blueprint('usuario_routes', __name__)

# --- FUNCIONES DE APOYO ---
def obtener_permisos_por_rol(id_rol):
    roles_permisos = {
        1: ["ALL"], 2: ["PACIENTE_READ", "CITA_UPDATE"], 3: ["PACIENTE_CREATE"],
        4: ["PACIENTE_CREATE", "PACIENTE_READ", "PACIENTE_UPDATE", "CITA_CREATE", "CITA_READ"],
        5: ["CITA_READ", "PERFIL_UPDATE"], 6: ["CITA_READ", "PERFIL_UPDATE"]
    }
    return roles_permisos.get(id_rol, [])

# --- RUTAS DE GESTIÓN (CRUD) ---

# 1. LISTAR (GET)
@usuario_routes.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    try:
        db.create_connection()
        query = f"""
            SELECT u.id_usuario, p.nombre, u.correo, r.tipo_rol, u.id_rol
            FROM {Config.SCHEMA}.t_usuario u
            INNER JOIN {Config.SCHEMA}.t_persona p ON u.id_persona = p.id_persona
            INNER JOIN {Config.SCHEMA}.t_rol r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario ASC
        """
        usuarios = db.execute_query(query, fetchall=True)
        data = [{
            'id_usuario': r[0], 'nombre': r[1], 'correo': r[2],
            'rol_nombre': r[3], 'id_rol': r[4],
            'permisos': obtener_permisos_por_rol(r[4])
        } for r in (usuarios or [])]
        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()

# 2. MODIFICAR (PUT) - CORREGIDO EL PATH A /api/usuarios/
@usuario_routes.route('/api/usuarios/<int:id_usuario>', methods=['PUT'])
def modificar_usuario(id_usuario):
    try:
        data = request.get_json() or {}
        nombre_user = data.get('nombre_usuario') 
        correo = data.get('correo')
        id_rol = data.get('id_rol')

        db.create_connection()
        campos_update = []
        valores = []

        if nombre_user is not None:
            campos_update.append("nombre_usuario = %s"); valores.append(nombre_user)
        if correo is not None:
            campos_update.append("correo = %s"); valores.append(correo)
        if id_rol is not None:
            campos_update.append("id_rol = %s"); valores.append(id_rol)

        if not campos_update:
            return jsonify({'success': False, 'message': 'No hay datos para actualizar.'}), 400

        query = f"UPDATE {Config.SCHEMA}.t_usuario SET {', '.join(campos_update)} WHERE id_usuario = %s"
        valores.append(id_usuario)
        db.execute_query(query, tuple(valores), commit=True)

        return jsonify({'success': True, 'message': 'Usuario actualizado.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()

# 3. ELIMINAR (DELETE) - AHORA COMO FUNCIÓN INDEPENDIENTE
@usuario_routes.route('/api/usuarios/<int:id_usuario>', methods=['DELETE'])
def eliminar_usuario(id_usuario):
    try:
        db.create_connection()
        query = f"DELETE FROM {Config.SCHEMA}.t_usuario WHERE id_usuario = %s"
        db.execute_query(query, (id_usuario,), commit=True)
        return jsonify({'success': True, 'message': 'Usuario eliminado.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error: El usuario tiene citas vinculadas.'}), 400
    finally:
        db.close_connection()

# 4. ASIGNAR ROL (POST)
@usuario_routes.route('/api/usuarios/asignar-rol', methods=['POST'])
def asignar_rol_y_permisos():
    try:
        data = request.get_json() or {}
        id_admin = data.get('id_admin') 
        id_target = data.get('id_usuario_destino')
        nuevo_rol = data.get('nuevo_id_rol')

        db.create_connection()
        check_sql = f"SELECT id_rol FROM {Config.SCHEMA}.t_usuario WHERE id_usuario = %s"
        admin_res = db.execute_query(check_sql, (id_admin,), fetchone=True)

        if not admin_res or admin_res[0] != 1:
            return jsonify({'success': False, 'message': 'No autorizado.'}), 403

        update_sql = f"UPDATE {Config.SCHEMA}.t_usuario SET id_rol = %s WHERE id_usuario = %s"
        db.execute_query(update_sql, (nuevo_rol, id_target), commit=True)

        return jsonify({'success': True, 'message': 'Rol actualizado.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()
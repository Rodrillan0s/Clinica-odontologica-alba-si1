from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
import traceback, psycopg2, json
from ..config import db, Config

usuario_routes = Blueprint('usuario_routes', __name__)

# =========================================================
# FUNCIONES DE APOYO (BITÁCORA E IP)
# =========================================================

def obtener_ip():
    if request.headers.getlist("X-Forwarded-For"):
        return request.headers.getlist("X-Forwarded-For")[0].split(',')[0]
    return request.remote_addr

def log_evento(modulo, accion, descripcion, id_usuario=None, id_sesion=None):
    try:
        meta = json.dumps({"ip": obtener_ip()})
        sql = f"""
            INSERT INTO {Config.SCHEMA}.t_bitacora 
            (modulo, accion, descripcion, id_usuario, id_sesion, metadata)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (modulo, accion, descripcion, id_usuario, id_sesion, meta)
        db.execute_query(sql, params, commit=True)
    except Exception as e:
        print(f"Error en Bitácora (Usuarios): {e}")

def obtener_permisos_por_rol(id_rol):
    roles_permisos = {
        1: ["ALL"], 
        2: ["PACIENTE_READ", "CITA_UPDATE"], 
        3: ["PACIENTE_CREATE"],
        4: ["PACIENTE_CREATE", "PACIENTE_READ", "PACIENTE_UPDATE", "CITA_CREATE", "CITA_READ"],
        5: ["CITA_READ", "PERFIL_UPDATE"], 
        6: ["CITA_READ", "PERFIL_UPDATE"]
    }
    return roles_permisos.get(id_rol, [])

# =========================================================
# RUTAS DE GESTIÓN DE USUARIOS
# =========================================================

# 1. LISTAR USUARIOS
@usuario_routes.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    try:
        db.create_connection()
        query = f"""
            SELECT u.id_usuario, p.nombre, u.correo, r.tipo_rol, u.id_rol, u.nombre_usuario
            FROM {Config.SCHEMA}.t_usuario u
            INNER JOIN {Config.SCHEMA}.t_persona p ON u.id_persona = p.id_persona
            INNER JOIN {Config.SCHEMA}.t_rol r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario ASC
        """
        usuarios = db.execute_query(query, fetchall=True)

        data = [{
            'id_usuario': r[0],
            'nombre': r[1],
            'correo': r[2],
            'rol_nombre': r[3],
            'id_rol': r[4],
            'nombre_usuario': r[5],
            'permisos': obtener_permisos_por_rol(r[4])
        } for r in (usuarios or [])]

        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()

# 2. MODIFICAR USUARIO (Perfil/Datos)
@usuario_routes.route('/api/usuarios/<int:id_usuario>', methods=['PUT'])
def modificar_usuario(id_usuario):
    try:
        data = request.get_json() or {}
        
        # Datos del operador (quien hace el cambio)
        id_operador = data.get('id_operador')
        id_sesion = data.get('id_sesion')

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

        # AUDITORÍA
        log_evento('USUARIOS', 'ACTUALIZAR_USUARIO', f'Modificación de datos del usuario ID: {id_usuario}', id_operador, id_sesion)

        return jsonify({'success': True, 'message': 'Usuario actualizado.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()

# 3. ELIMINAR USUARIO
@usuario_routes.route('/api/usuarios/<int:id_usuario>', methods=['DELETE'])
def eliminar_usuario(id_usuario):
    try:
        # Nota: Algunos clientes web no envían body en DELETE, se puede recibir por query params o headers
        data = request.get_json() or {}
        id_operador = data.get('id_operador')
        id_sesion = data.get('id_sesion')

        db.create_connection()
        query = f"DELETE FROM {Config.SCHEMA}.t_usuario WHERE id_usuario = %s"
        db.execute_query(query, (id_usuario,), commit=True)
        
        # AUDITORÍA
        log_evento('USUARIOS', 'ELIMINAR_USUARIO', f'Eliminación del usuario ID: {id_usuario}', id_operador, id_sesion)

        return jsonify({'success': True, 'message': 'Usuario eliminado.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': 'Error: El usuario tiene registros vinculados (citas/pagos).'}), 400
    finally:
        db.close_connection()

# 4. ASIGNAR ROL (Acción Crítica Administrativa)
@usuario_routes.route('/api/usuarios/asignar-rol', methods=['POST'])
def asignar_rol_y_permisos():
    try:
        data = request.get_json() or {}
        id_admin = data.get('id_admin') # ID del administrador que opera
        id_target = data.get('id_usuario_destino')
        nuevo_rol = data.get('nuevo_id_rol')
        id_sesion = data.get('id_sesion')

        db.create_connection()
        
        # Validar que el operador sea Administrador (Rol 1)
        check_sql = f"SELECT id_rol FROM {Config.SCHEMA}.t_usuario WHERE id_usuario = %s"
        admin_res = db.execute_query(check_sql, (id_admin,), fetchone=True)

        if not admin_res or admin_res[0] != 1:
            log_evento('SECURITY', 'UNAUTHORIZED_ROLE_CHANGE', f'Intento fallido de cambio de rol por ID: {id_admin}', id_admin, id_sesion)
            return jsonify({'success': False, 'message': 'No tiene permisos para realizar esta acción.'}), 403

        update_sql = f"UPDATE {Config.SCHEMA}.t_usuario SET id_rol = %s WHERE id_usuario = %s"
        db.execute_query(update_sql, (nuevo_rol, id_target), commit=True)

        # AUDITORÍA DE CAMBIO DE ROL
        log_evento('USUARIOS', 'CAMBIAR_ROL', f'Cambio de rol al usuario {id_target} a nuevo rol ID: {nuevo_rol}', id_admin, id_sesion)

        return jsonify({'success': True, 'message': 'Rol actualizado correctamente.'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()


@usuario_routes.route('/api/bitacora', methods=['GET'])
def listar_bitacora():
    try:
        # Ahora recibimos 'nombre' en lugar de (o además de) id_usuario
        nombre_busqueda = request.args.get('nombre') 
        modulo = request.args.get('modulo')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        db.create_connection()
        
        # Agregamos JOIN a t_persona para buscar por nombre real
        query = f"""
            SELECT b.id_bitacora, p.nombre, b.modulo, b.accion, 
                   b.descripcion, b.fecha_registro, b.metadata, b.id_sesion, u.nombre_usuario
            FROM {Config.SCHEMA}.t_bitacora b
            LEFT JOIN {Config.SCHEMA}.t_usuario u ON b.id_usuario = u.id_usuario
            LEFT JOIN {Config.SCHEMA}.t_persona p ON u.id_persona = p.id_persona
            WHERE 1=1
        """
        params = []

        # FILTRO FLEXIBLE POR NOMBRE (No restrictivo)
        if nombre_busqueda:
            # Buscamos coincidencias parciales en nombre real O nombre de usuario
            query += " AND (p.nombre ILIKE %s OR u.nombre_usuario ILIKE %s)"
            termino = f"%{nombre_busqueda}%"
            params.append(termino)
            params.append(termino)

        if modulo:
            query += " AND b.modulo = %s"
            params.append(modulo)

        if fecha_inicio and fecha_fin:
            query += " AND b.fecha_registro::date BETWEEN %s AND %s"
            params.append(fecha_inicio)
            params.append(fecha_fin)

        query += " ORDER BY b.fecha_registro DESC LIMIT 150"
        
        results = db.execute_query(query, tuple(params), fetchall=True)

        data = [{
            'id': r[0],
            'usuario': r[1] or r[8] or 'SISTEMA', # Prioriza nombre real, luego username
            'modulo': r[2],
            'accion': r[3],
            'descripcion': r[4],
            'fecha': r[5].strftime('%Y-%m-%d %H:%M:%S') if r[5] else None,
            'metadata': r[6],
            'id_sesion': r[7]
        } for r in (results or [])]

        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
import json
from ..config import db, Config
from ..classes.security import admin_required, Security
usuario_routes = Blueprint('usuario_routes', __name__)

# =========================================================
# BITÁCORA + IP
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
        db.execute_query(sql, (modulo, accion, descripcion, id_usuario, id_sesion, meta), commit=True)
    except Exception as e:
        print(f"Error Bitácora: {e}")


# =========================================================
# LISTAR USUARIOS
# =========================================================

@usuario_routes.route('/api/usuarios', methods=['GET'])
@admin_required
def listar_usuarios():
    try:
        query = """
            SELECT 
                u.id_usuario,
                u.nombre_usuario,
                u.correo,
                r.tipo_rol
            FROM clinica.t_usuario u
            INNER JOIN clinica.t_rol r ON u.id_rol = r.id_rol
            WHERE u.estado = 'ACTIVO'
            ORDER BY u.id_usuario ASC
        """

        rows = db.execute_query(query, fetchall=True)

        data = [{
            "id_usuario": r[0],
            "display": f"{r[1]} ({r[2]})", 
            "usuario": r[1],
            "correo": r[2],
            "rol": r[3]
        } for r in (rows or [])]

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
# =========================================================
# CREAR USUARIO (ADMIN)
# =========================================================

@usuario_routes.route('/api/usuarios', methods=['POST'])
@admin_required
def crear_usuario():
    try:
        data = request.get_json() or {}

        user_name = data.get('user')
        ci = data.get('ci')
        name = data.get('name')
        mail = data.get('mail')
        number = data.get('number')
        birth = data.get('birth')
        dir = data.get('dir')
        password = data.get('password')
        id_rol = data.get('id_rol')

        if not all([user_name, ci, name, mail, password, id_rol]):
            return jsonify({"success": False, "message": "Datos incompletos"}), 400

        pass_hash = generate_password_hash(password)

        sql = f"""
            CALL {Config.SCHEMA}.p_crear_usuario_admin(
                %s,%s,%s,%s,%s,%s,%s,%s,%s
            )
        """

        params = (
            user_name, ci, name, mail,
            number, birth, dir,
            pass_hash, id_rol
        )

        db.execute_query(sql, params, commit=True)

        log_evento("USUARIOS", "CREATE", f"Usuario creado: {user_name}")

        return jsonify({"success": True, "message": "Usuario creado"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================================
# ACTUALIZAR USUARIO
# =========================================================

@usuario_routes.route('/api/usuarios/<int:id_usuario>', methods=['PUT'])
@admin_required
def actualizar_usuario(id_usuario):
    try:
        data = request.get_json() or {}

        campos = []
        valores = []

        if data.get('user'):
            campos.append("nombre_usuario = %s")
            valores.append(data['user'])

        if data.get('correo'):
            campos.append("correo = %s")
            valores.append(data['correo'])

        if data.get('id_rol'):
            campos.append("id_rol = %s")
            valores.append(data['id_rol'])

        if not campos:
            return jsonify({"success": False, "message": "Nada para actualizar"}), 400

        query = f"""
            UPDATE clinica.t_usuario
            SET {', '.join(campos)}
            WHERE id_usuario = %s
        """

        valores.append(id_usuario)

        db.execute_query(query, tuple(valores), commit=True)

        log_evento("USUARIOS", "UPDATE", f"Usuario actualizado {id_usuario}")

        return jsonify({"success": True, "message": "Usuario actualizado"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================================
# SOFT DELETE
# =========================================================

@usuario_routes.route('/api/usuarios/<int:id_usuario>', methods=['DELETE'])
@admin_required 
def eliminar_usuario(id_usuario):
    try:
        query = """
            UPDATE clinica.t_usuario
            SET estado = 'INACTIVO'
            WHERE id_usuario = %s
        """

        db.execute_query(query, (id_usuario,), commit=True)

        log_evento("USUARIOS", "SOFT_DELETE", f"Usuario desactivado {id_usuario}")

        return jsonify({
            "success": True,
            "message": "Usuario desactivado correctamente"
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    

@usuario_routes.route('/api/usuarios/asignar-rol', methods=['POST'])
@admin_required
def asignar_rol():
    try:
        data = request.get_json() or {}

        id_usuario = data.get('id_usuario')
        id_rol = data.get('id_rol')

        if not id_usuario or not id_rol:
            return jsonify({
                "success": False,
                "message": "Datos incompletos"
            }), 400

        query = """
            UPDATE clinica.t_usuario
            SET id_rol = %s
            WHERE id_usuario = %s
        """

        db.execute_query(query, (id_rol, id_usuario), commit=True)

        id_admin = Security.get_user_id()

        log_evento(
            "ROLES",
            "ASIGNAR_ROL",
            f"Admin {id_admin} asignó rol {id_rol} a usuario {id_usuario}",
            id_usuario=id_admin
        )

        return jsonify({
            "success": True,
            "message": "Rol asignado correctamente"
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@usuario_routes.route('/api/roles', methods=['GET'])
@admin_required
def listar_roles():
    try:
        query = """
            SELECT id_rol, tipo_rol
            FROM clinica.t_rol
            ORDER BY id_rol
        """

        rows = db.execute_query(query, fetchall=True)

        data = [{
            "id_rol": r[0],
            "rol": r[1]
        } for r in (rows or [])]

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500        
    
@usuario_routes.route('/api/roles/<int:id_rol>/permisos', methods=['GET'])
@admin_required
def permisos_por_rol(id_rol):
    try:
        query = """
            SELECT p.id_permiso, p.nombre
            FROM clinica.t_permiso p
            INNER JOIN clinica.t_rol_permiso rp ON rp.id_permiso = p.id_permiso
            WHERE rp.id_rol = %s
        """

        rows = db.execute_query(query, (id_rol,), fetchall=True)

        data = [{
            "id_permiso": r[0],
            "permiso": r[1]
        } for r in (rows or [])]

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500    
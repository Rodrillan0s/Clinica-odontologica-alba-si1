from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
import traceback
import psycopg2
from ..config import db, Config

usuario_routes = Blueprint('usuario_routes', __name__)
#LISTAR USUARIO
@usuario_routes.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    try:
        db.create_connection()

        query = f"""
            SELECT 
                u.id_usuario,
                u.nombre,
                u.correo,
                r.tipo_rol
            FROM {Config.SCHEMA}.t_usuario u
            INNER JOIN {Config.SCHEMA}.t_rol r
                ON u.id_rol = r.id_rol
        """

        usuarios = db.fetch_all(query)

        return jsonify({
            'success': True,
            'data': usuarios
        }), 200

    except psycopg2.Error as e:
        error_msg = getattr(getattr(e, "diag", None), "message_primary", str(e))
        return jsonify({'success': False, 'message': error_msg}), 500

    finally:
        if 'db' in locals():
            db.close_connection()

#MODIFICAR USUARIO
@usuario_routes.route('/api/usuarios/<int:id_usuario>', methods=['PUT'])
def modificar_usuario(id_usuario):
    try:
        data = request.get_json() or {}

        nombre = data.get('nombre')
        correo = data.get('correo') 
        id_rol = data.get('id_rol')

        if not any([nombre, correo, id_rol]):
            return jsonify({'success': False,
                'message': 'Debe enviar al menos un campo para actualizar.'}), 400

        db.create_connection()

        updates = []
        params = []
#hacer procedimiento 
        if nombre:
            updates.append("nombre = %s")
            params.append(nombre.strip())

        if correo:
            updates.append("correo = %s")
            params.append(correo.strip())

        if id_rol:
            updates.append("id_rol = %s")
            params.append(id_rol)

        query = f"""
            UPDATE {Config.SCHEMA}.t_usuario
            SET {', '.join(updates)}
            WHERE id_usuario = %s
        """

        params.append(id_usuario)

        db.execute_query(query, tuple(params), commit=True)

        return jsonify({
            'success': True,
            'message': 'Usuario modificado correctamente.'
        }), 200

    except psycopg2.Error as e:
        error_msg = getattr(getattr(e, "diag", None), "message_primary", str(e))

        return jsonify({
            'success': False,
            'message': error_msg
        }), 500

    finally:
        if 'db' in locals():
            db.close_connection()

#ELIMINAR USUARIO
@usuario_routes.route('/api/usuarios/<int:id_usuario>', methods=['DELETE'])
def eliminar_usuario(id_usuario):
    try:
        db.create_connection()
        query = f"""
            DELETE FROM {Config.SCHEMA}.t_usuario
            WHERE id_usuario = %s
        """

        db.execute_query(query, (id_usuario,), commit=True)

        return jsonify({
            'success': True,
            'message': 'Usuario eliminado correctamente.'
        }), 200

    except psycopg2.Error as e:
        error_msg = getattr(getattr(e, "diag", None), "message_primary", str(e))

        return jsonify({'success': False, 'message': error_msg
        }), 500
#elminar demsaidos erroes de msj
    except Exception:
        print("\n--- ERROR EN ELIMINAR USUARIO ---")
        traceback.print_exc()
        print("---------------------------------\n")

        return jsonify({
            'success': False,
            'message': 'Error en el servidor.'
        }), 500

    finally:
        if 'db' in locals():
            db.close_connection()

#añadir asignar permisos, crear usuario con rol y permisos

@usuario_routes.route('/api/usuarios', methods=['POST'])
def crear_usuario():
    try:
        data = request.get_json() or {}
        
        correo = str(data.get('correo', '')).strip()
        nombre = str(data.get('nombre', '')).strip()
        contraseña = str(data.get('contraseña', '')).strip()
        id_persona = data.get('id_persona')  
        id_rol = data.get('id_rol') 


        if not correo or not nombre or not contraseña or not id_persona or not id_rol:
            return jsonify({
                'success': False,
                'message': 'Faltan datos obligatorios'
            }), 400
        contraseña = generate_password_hash(contraseña)
        db.create_connection()

        query = f"""INSERT INTO {Config.SCHEMA}.t_usuario
            (correo, nombre, contraseña, id_persona, id_rol)
            VALUES (%s, %s, %s, %s, %s)
        """

        db.execute_query(query, (correo, nombre, contraseña, id_persona, id_rol), commit=True)

        return jsonify({
            'success': True,
            'message': 'Usuario creado correctamente',
            'permisos': obtener_permisos_por_rol(id_rol)
        }), 201

    except psycopg2.Error as e:
        error_msg = getattr(getattr(e, "diag", None), "message_primary", str(e))

        return jsonify({
            'success': False,
            'message': error_msg
        }), 500

    finally:
        if 'db' in locals():
            db.close_connection()

def obtener_permisos_por_rol(id_rol):

    if id_rol == 1:  # ADMIN
        return ["ALL"]

    if id_rol == 2:  # ODONTOLOGO
        return ["PACIENTE_READ", "CITA_UPDATE"]

    if id_rol == 3:  # ASISTENTE
        return ["PACIENTE_CREATE"]

    if id_rol == 4:  # RECEPCIONISTA
        return [
            "PACIENTE_CREATE",
            "PACIENTE_READ",
            "PACIENTE_UPDATE",
            "CITA_CREATE",
            "CITA_READ"
        ]

    return []
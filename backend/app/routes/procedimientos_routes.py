from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
import json
from ..config import db, Config
from ..classes.security import admin_required, Security,permission_required
from ..services.bitacora import Bitacora

procedimientos_routes_routes = Blueprint('procedimientos_routes_routes', __name__)

@procedimientos_routes_routes.route('/api/procedimientos', methods=['GET'])
def get_tratamientos():
    """Obtiene todos los procedimientos"""
    try:
        query = f"SELECT * FROM {Config.SCHEMA}.fn_obtener_todos_los_procedimientos()"
        results = db.execute_query(query, fetchall=True)
        
        if results:
            procedimientos = [{
                "id": row[0],
                "descripcion": row[1]
            } for row in results]
            
            return jsonify({
                'success': True,
                'data': procedimientos
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'No se encontraron procedimientos'
            }), 404
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al obtener los procedimientos: {e}'}), 500

@procedimientos_routes_routes.route('/api/procedimientos/<int:id>', methods=['GET'])
def get_procedimiento(id):
    """Obtiene un procedimiento por ID"""
    try:
        query = f"SELECT id_procedimiento, descripcion FROM {Config.SCHEMA}.t_procedimiento WHERE id_procedimiento = %s"
        result = db.execute_query(query, (id,), fetchone=True)
        
        if result:
            return jsonify({
                'success': True, 
                'data': {'id': result[0], 'descripcion': result[1]}
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Procedimiento no encontrado'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al obtener procedimiento: {e}'}), 500

@procedimientos_routes_routes.route('/api/procedimientos', methods=['POST'])
@permission_required("crear_procedimiento")
def create_procedimiento():
    """Crea un nuevo procedimiento"""
    data = request.get_json() or {}
    descripcion = data.get('descripcion')
    
    if not descripcion:
        return jsonify({'success': False, 'message': 'Falta el campo requerido: descripcion'}), 400
        
    try:
        query = f"INSERT INTO {Config.SCHEMA}.t_procedimiento (descripcion) VALUES (%s) RETURNING id_procedimiento"
        result = db.execute_query(query, (descripcion,), fetchone=True, commit=True)
        
        id_u = data.get('id_usuario')
        id_s = data.get('id_sesion')
        descripcion_log = f"Nuevo procedimiento: {descripcion}"
        Bitacora.registrar('PROCEDIMIENTOS', 'CREAR_PROCEDIMIENTO', descripcion_log, id_u, id_s)
        return jsonify({
            'success': True, 
            'message': 'Procedimiento creado exitosamente', 
            'data': {'id_procedimiento': result[0], 'descripcion': descripcion}
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al crear procedimiento: {e}'}), 500

@procedimientos_routes_routes.route('/api/procedimientos/<int:id>', methods=['PUT'])
@permission_required("modificar_procedimiento")
def update_procedimiento(id):
    """Actualiza un procedimiento existente"""
    data = request.get_json() or {}
    descripcion = data.get('descripcion')
    
    if not descripcion:
        return jsonify({'success': False, 'message': 'Falta el campo requerido: descripcion'}), 400
        
    try:
        query = f"UPDATE {Config.SCHEMA}.t_procedimiento SET descripcion = %s WHERE id_procedimiento = %s RETURNING id_procedimiento"
        result = db.execute_query(query, (descripcion, id), fetchone=True, commit=True)
        
        if result:
            id_u = data.get('id_usuario')
            id_s = data.get('id_sesion')
            descripcion_log = f"Procedimiento ID: {id} actualizado. Nueva descripción: {descripcion}"
            Bitacora.registrar('PROCEDIMIENTOS', 'ACTUALIZAR_PROCEDIMIENTO', descripcion_log, id_u, id_s)

            return jsonify({'success': True, 'message': 'Procedimiento actualizado exitosamente'}), 200
        else:
            return jsonify({'success': False, 'message': 'Procedimiento no encontrado'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al actualizar procedimiento: {e}'}), 500

@procedimientos_routes_routes.route('/api/procedimientos/<int:id>', methods=['DELETE'])
@permission_required("eliminar_procedimientos")
def delete_procedimiento(id):
    """Elimina un procedimiento existente"""
    data = request.get_json() or {}
    try:
        query = f"DELETE FROM {Config.SCHEMA}.t_procedimiento WHERE id_procedimiento = %s RETURNING id_procedimiento, descripcion"
        result = db.execute_query(query, (id,), fetchone=True, commit=True)
        
        if result:
            id_u = data.get('id_usuario')
            id_s = data.get('id_sesion')
            descripcion_log = f"Procedimiento eliminado: {result[1]} (ID: {id})"
            Bitacora.registrar('PROCEDIMIENTOS', 'ELIMINAR_PROCEDIMIENTO', descripcion_log, id_u, id_s)

            return jsonify({'success': True, 'message': 'Procedimiento eliminado exitosamente'}), 200
        else:
            return jsonify({'success': False, 'message': 'Procedimiento no encontrado'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al eliminar procedimiento: {e}'}), 500

@procedimientos_routes_routes.route('/api/procedimientos/asignar-todos', methods=['POST'])
@permission_required("asignar_procedimientos")
def asignar_procedimientos_todos():
    """Asigna un procedimiento a todos los odontólogos"""
    data = request.get_json() or {}
    id_procedimiento = data.get('id_procedimiento')
    
    if not id_procedimiento:
        return jsonify({'success': False, 'message': 'Falta el campo requerido: id_procedimiento'}), 400
        
    try:
        query = f"CALL {Config.SCHEMA}.asignar_procedimiento_todos(%s)"
        db.execute_query(query, (id_procedimiento,), commit=True)
        
        id_u = data.get('id_usuario')
        id_s = data.get('id_sesion')
        descripcion_log = f"Procedimiento {id_procedimiento} asignado a todos los odontólogos"
        Bitacora.registrar('PROCEDIMIENTOS', 'ASIGNAR_TODOS', descripcion_log, id_u, id_s)

        return jsonify({'success': True, 'message': 'Procedimiento asignado a todos los odontólogos exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al asignar procedimiento: {e}'}), 500

@procedimientos_routes_routes.route('/api/procedimientos/quitar-todos', methods=['POST'])
@permission_required("asignar_procedimientos")
def quitar_procedimientos_todos():
    """Quita un procedimiento a todos los odontólogos"""
    data = request.get_json() or {}
    id_procedimiento = data.get('id_procedimiento')
    
    if not id_procedimiento:
        return jsonify({'success': False, 'message': 'Falta el campo requerido: id_procedimiento'}), 400
        
    try:
        query = f"CALL {Config.SCHEMA}.quitar_procedimiento_todos(%s)"
        db.execute_query(query, (id_procedimiento,), commit=True)
        
        id_u = data.get('id_usuario')
        id_s = data.get('id_sesion')
        descripcion_log = f"Procedimiento {id_procedimiento} quitado a todos los odontólogos"
        Bitacora.registrar('PROCEDIMIENTOS', 'QUITAR_TODOS', descripcion_log, id_u, id_s)

        return jsonify({'success': True, 'message': 'Procedimiento quitado a todos los odontólogos exitosamente'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error al quitar procedimiento: {e}'}), 500


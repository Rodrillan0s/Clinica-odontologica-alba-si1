from flask import Blueprint, request, jsonify
import psycopg2
import traceback
from ..config import db, Config

paciente_routes = Blueprint('paciente_routes', __name__)

@paciente_routes.route('/api/pacientes', methods=['POST'])
def registrar_paciente():
    try:
        data = request.get_json() or {}

        nombre = str(data.get('nombre', '')).strip()
        ci = data.get('ci')
        fecha_nacimiento = data.get('fecha_nacimiento')
        direccion = data.get('direccion')
        telefono = data.get('telefono')

        # VALIDACIÓN BÁSICA
        if not nombre or not ci or not fecha_nacimiento:
            return jsonify({
                'success': False,
                'message': 'Faltan campos obligatorios'
            }), 400

        # VALIDACIÓN TIPOS 
        try:
            ci = int(ci)
            telefono = int(telefono) if telefono else None
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'message': 'CI y teléfono deben ser numéricos'
            }), 400

        if len(nombre.split()) < 2:
            return jsonify({
                'success': False,
                'message': 'Debe ingresar nombre y apellido'
            }), 400

        sql_call = f"""
            CALL clinica.p_registrar_paciente(
                %s::varchar,
                %s::bigint,
                %s::date,
                %s::varchar,
                %s::bigint
            )
        """

        params = (
            nombre,
            ci,
            fecha_nacimiento,
            direccion,
            telefono
        )

        db.execute_query(sql_call, params, commit=True)

        return jsonify({
            'success': True,
            'message': 'Paciente registrado correctamente'
        }), 201

    except psycopg2.Error as e:
        error_msg = e.pgerror or str(e)
        return jsonify({
            'success': False,
            'message': error_msg
        }), 500

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@paciente_routes.route('/api/pacientes', methods=['GET'])
def listar_pacientes():
    try:

        nombre_busqueda = request.args.get('nombre', '').strip()

        query = f"""
            SELECT 
                a.id_paciente,
                b.nombre,
                b.ci,
                b.fecha_nacimiento,
                b.direccion,
                b.telefono
            FROM {Config.SCHEMA}.t_paciente a
            INNER JOIN {Config.SCHEMA}.t_persona b 
                ON b.id_persona = a.id_paciente
            
        """

        params = []

        # FILTRO POR NOMBRE
        if nombre_busqueda:
            query += " AND b.nombre ILIKE %s"
            params.append(f"%{nombre_busqueda}%")

        query += " ORDER BY b.nombre ASC"

        result = db.execute_query(
            query,
            tuple(params) if params else None,
            fetchall=True
        )

        pacientes = []

        if result:

            for row in result:

                pacientes.append({
                    "id": row[0],
                    "nombre": row[1],
                    "ci": row[2],
                    "fecha_nacimiento": str(row[3]) if row[3] else None,
                    "direccion": row[4],
                    "telefono": row[5]
                })

        return jsonify({
            "success": True,
            "data": pacientes
        }), 200

    except Exception as e:

        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    
@paciente_routes.route('/api/pacientes/<int:id_paciente>', methods=['PUT'])
def modificar_paciente(id_paciente):

    try:

        data = request.get_json() or {}

        campos = []
        params = []

        # VALIDAR Y AGREGAR SOLO LOS CAMPOS ENVIADOS

        if 'nombre' in data:

            nombre = str(data.get('nombre', '')).strip()

            if len(nombre.split()) < 2:
                return jsonify({
                    'success': False,
                    'message': 'Debe ingresar nombre y apellido'
                }), 400

            campos.append("nombre = %s")
            params.append(nombre)

        if 'ci' in data:

            try:
                ci = int(data.get('ci'))
            except (ValueError, TypeError):

                return jsonify({
                    'success': False,
                    'message': 'CI debe ser numérico'
                }), 400

            campos.append("ci = %s")
            params.append(ci)

        if 'fecha_nacimiento' in data:

            campos.append("fecha_nacimiento = %s")
            params.append(data.get('fecha_nacimiento'))

        if 'direccion' in data:

            campos.append("direccion = %s")
            params.append(data.get('direccion'))

        if 'telefono' in data:

            telefono = data.get('telefono')

            try:
                telefono = int(telefono) if telefono else None
            except (ValueError, TypeError):

                return jsonify({
                    'success': False,
                    'message': 'Teléfono debe ser numérico'
                }), 400

            campos.append("telefono = %s")
            params.append(telefono)

        # SI NO ENVÍA NADA
        if not campos:

            return jsonify({
                'success': False,
                'message': 'No se enviaron campos para modificar'
            }), 400

        query = f"""
            UPDATE {Config.SCHEMA}.t_persona
            SET {', '.join(campos)}
            WHERE id_persona = %s
        """

        params.append(id_paciente)

        db.execute_query(
            query,
            tuple(params),
            commit=True
        )

        return jsonify({
            'success': True,
            'message': 'Paciente modificado correctamente'
        }), 200

    except psycopg2.Error as e:

        error_msg = e.pgerror or str(e)

        return jsonify({
            'success': False,
            'message': error_msg
        }), 500

    except Exception as e:

        traceback.print_exc()

        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
    
@paciente_routes.route('/api/pacientes/<int:id_paciente>', methods=['DELETE'])
def inhabilitar_paciente(id_paciente):
    try:

        query = f"""
            UPDATE {Config.SCHEMA}.t_paciente
            SET estado = 'INACTIVO'
            WHERE id_paciente = %s
        """

        db.execute_query(
            query,
            (id_paciente,),
            commit=True
        )

        return jsonify({
            'success': True,
            'message': 'Paciente inhabilitado correctamente'
        }), 200

    except psycopg2.Error as e:

        error_msg = e.pgerror or str(e)

        return jsonify({
            'success': False,
            'message': error_msg
        }), 500

    except Exception as e:

        traceback.print_exc()

        return jsonify({
            'success': False,
            'message': str(e)
        }), 500    
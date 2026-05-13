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

    finally:
        db.close_connection()


@paciente_routes.route('/api/pacientes', methods=['GET'])
def listar_pacientes():
    try:
        
        query = f"""
            SELECT id_paciente,nombre
            FROM clinica.t_paciente a
            inner join clinica.t_persona b on id_persona = id_paciente
        """

        result = db.execute_query(query, fetchall=True)

        pacientes = []

        if result:
            for row in result:
                pacientes.append({
                    "id": row[0],
                    "nombre": row[1]
                })

        return jsonify({
            "success": True,
            "data": pacientes
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        db.close_connection()
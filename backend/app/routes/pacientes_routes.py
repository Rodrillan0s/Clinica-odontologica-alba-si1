from flask import Blueprint, request, jsonify
import psycopg2
import traceback
from ..config import db, Config

paciente_routes = Blueprint('paciente_routes', __name__)

@paciente_routes.route('/api/pacientes', methods=['POST'])
def registrar_paciente():
    try:
        data = request.get_json() or {}


        #EXTRACCIÓN DE DATOS
        nombre = str(data.get('nombre', '')).strip()
        ci = data.get('ci')
        fecha_nacimiento = data.get('fecha_nacimiento')
        direccion = str(data.get('direccion', '')).strip() if data.get('direccion') else None
        telefono = data.get('telefono')

        if not nombre or not ci or not fecha_nacimiento:
            return jsonify({
                'success': False,
                'message': 'Faltan campos obligatorios'
            })

        try:
            #VALIDACIÓN DE CI Y TELÉFONO COMO NÚMEROS
            ci = int(ci)
            telefono = int(telefono) if telefono else None
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'message': 'CI y teléfono deben ser numéricos'
            })

        if len(nombre.split()) < 2:
            return jsonify({
                'success': False,
                'message': 'Debe ingresar nombre y apellido'
            })

        db.create_connection()
        #EJECUCIÓN DE PROCEDIMIENTO ALMACENADO PARA REGISTRAR PACIENTE
        sql_call = f"CALL {Config.SCHEMA}.p_registrar_paciente(%s, %s, %s, %s, %s)"
        params = (nombre, ci, fecha_nacimiento, direccion, telefono)

        db.execute_query(sql_call, params, commit=True)

        return jsonify({
            'success': True,
            'message': 'Paciente registrado correctamente'
        })

    except psycopg2.Error as e:
        error_msg = e.diag.message_primary if e.diag.message_primary else str(e)
        return jsonify({
            'success': False,
            'message': error_msg
        })

    except Exception as e:
        print("\n--- ERROR EN REGISTRO PACIENTE ---")
        traceback.print_exc()
        print("----------------------------------\n")

        return jsonify({
            'success': False,
            'message': f'Error general: {str(e)}'
        })

    finally:
        try:
            db.close_connection()
        except:
            pass
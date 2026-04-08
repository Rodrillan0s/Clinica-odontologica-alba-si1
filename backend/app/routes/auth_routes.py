from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import traceback
import psycopg2
from ..config import db, Config
from ..services import create_access_token 

auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}      
        # EXTRACCIÓN DE DATOS
        user_name = str(data.get('user', '')).strip()
        name = str(data.get('name', '')).strip()
        mail = str(data.get('mail', '')).strip()
        birth = data.get('birth')
        password = data.get('password')
        
        raw_dir = data.get('dir')
        direction = str(raw_dir).strip() if raw_dir else None
        
        try:
            ci = int(data.get('ci'))
            raw_number = data.get('number')
            number = int(raw_number) if raw_number else None
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'El CI y Teléfono deben ser números válidos.'}), 400

        if not all([user_name, ci, name, mail, birth, password]):
            return jsonify({'success': False, 'message': 'Faltan campos obligatorios.'}), 400

        pass_hash = generate_password_hash(password)
        db.create_connection() 
        sql_call = f"CALL {Config.SCHEMA}.p_registrar_usuario(%s, %s, %s, %s, %s, %s, %s, %s)"
        params = (user_name, ci, name, mail, number, birth, direction, pass_hash)
        db.execute_query(sql_call, params, commit=True)

        return jsonify({'success': True, 'message': '¡Cuenta creada exitosamente!'}), 201
    except psycopg2.Error as e:
        error_msg = e.diag.message_primary if e.diag.message_primary else str(e)
        return jsonify({'success': False, 'message': error_msg}), 409

    except Exception as e:
        print("\n--- ERROR EN REGISTRO ---")
        traceback.print_exc()
        print("-------------------------\n")
        return jsonify({'success': False, 'message': f'Error en el servidor: {str(e)}'}), 500
        
    finally:
        if 'db' in locals():
            db.close_connection()


@auth_routes.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        user_input = data.get('user_input')
        password = data.get('password')

        if not user_input or not password:
            return jsonify({'success': False, 'message': 'Debe ingresar sus credenciales.'}), 400

        db.create_connection()
        call_sql = f"CALL {Config.SCHEMA}.p_login_usuario(%s, NULL, NULL, NULL, NULL, NULL, NULL)"
        result = db.execute_query(call_sql, (user_input.strip(),), fetchone=True)
        u_id, u_name, u_hash, p_name, p_mail, r_id = result

        if not check_password_hash(u_hash, password):
            return jsonify({'success': False, 'message': 'Contraseña incorrecta.'}), 401

        # GENERAR JWT
        token = create_access_token(user_id=u_id, user_name=u_name, role=r_id, name=p_name)
        
        return jsonify({
            'success': True,
            'message': 'Inicio de sesión exitoso',
            'access_token': token,
            'user': {
                'id': u_id,
                'nombre': p_name,
                'correo': p_mail,
                'rol': r_id
            }
        }), 200

    except psycopg2.Error as e:
        error_msg = e.diag.message_primary if e.diag.message_primary else str(e)
        return jsonify({'success': False, 'message': error_msg}), 404

    except Exception as e:
        print("\n--- ERROR EN LOGIN ---")
        traceback.print_exc()
        print("----------------------\n")
        return jsonify({'success': False, 'message': f'Error:{str(e)}'}), 500     
    finally:
        if 'db' in locals():
            db.close_connection()
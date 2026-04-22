from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import traceback, psycopg2, re, secrets, os
from ..config import db, Config
from ..services import create_access_token
from flask_mail import Message
from app import mail 

auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        token_plano = secrets.token_urlsafe(32)
        token_hash = generate_password_hash(token_plano)
        
        sql = f"CALL {Config.SCHEMA}.p_solicitar_recuperacion(%s, %s, %s, NULL, NULL)"
        result = db.execute_query(sql, (email, token_hash, request.remote_addr), fetchone=True, commit=True)
        
        if result and result[0]:
            u_id, u_name = result
            link = f"http://localhost:5173/reset-password?token={token_plano}&id={u_id}"
            remitente = Config.MAIL_USERNAME or os.getenv('MAIL_USERNAME') or "toledoquirogaeddy@gmail.com"

            msg = Message(subject="Recuperación - Clínica Alba", sender=remitente, recipients=[email])
            msg.body = f"Hola {u_name}, usa este link: {link}"
            mail.send(msg)

        return jsonify({'success': True, 'message': 'Instrucciones enviadas.'}), 200
    except Exception as e:
        traceback.print_exc()


@auth_routes.route('/api/validate-token', methods=['POST'])
def validate_token():
    try:
        data = request.get_json()
        u_id, token_plano = data.get('id'), data.get('token')
        
        sql = f"SELECT id_token, token_hash FROM {Config.SCHEMA}.t_token_recuperacion WHERE id_usuario = %s AND usado = FALSE AND fecha_expiracion > timezone('America/La_Paz', now())"
        tokens = db.execute_query(sql, (u_id,), fetchall=True)

        if tokens:
            for t_id, t_hash in tokens:
                if check_password_hash(t_hash, token_plano):
                    return jsonify({'success': True}), 200
        return jsonify({'success': False, 'message': 'Enlace no válido o expirado.'}), 401
    except:
        return jsonify({'success': False, 'message': 'Error de validación.'}), 500

@auth_routes.route('/api/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        u_id, token_plano, new_password = data.get('id'), data.get('token'), data.get('password')

        es_valida, msg_error = validar_password(new_password)
        if not es_valida: return jsonify({'success': False, 'message': msg_error}), 400

        sql_check = f"SELECT id_token, token_hash FROM {Config.SCHEMA}.t_token_recuperacion WHERE id_usuario = %s AND usado = FALSE"
        tokens = db.execute_query(sql_check, (u_id,), fetchall=True)
        
        token_id = next((t_id for t_id, t_hash in tokens if check_password_hash(t_hash, token_plano)), None)
        if not token_id: return jsonify({'success': False, 'message': 'Token inválido.'}), 401

        new_hash = generate_password_hash(new_password)
        db.execute_query(f"CALL {Config.SCHEMA}.p_finalizar_recuperacion(%s, %s, %s)", (u_id, token_id, new_hash), commit=True)
        return jsonify({'success': True, 'message': 'Contraseña cambiada.'}), 200
    except Exception as e: return jsonify({'success': False, 'message': str(e)}), 500

# VALIDACIÓN DE CONTRASEÑA
def validar_password(password):
    if len(password) < 8:
        return False, "La contraseña debe tener al menos 8 caracteres."
    if not any(char.isupper() for char in password):
        return False, "La contraseña debe incluir al menos una mayúscula."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "La contraseña debe incluir al menos un símbolo especial (!@#$%...)."
    return True, ""

# VALIDACIÓN DE CI EN REGISTRO
@auth_routes.route('/api/verify-ci/<int:ci>', methods=['GET'])
def verify_ci(ci):
    try:
        db.create_connection()
        sql = f"""
            SELECT p.nombre, u.id_usuario, p.tipo_persona
            FROM {Config.SCHEMA}.t_persona p
            LEFT JOIN {Config.SCHEMA}.t_usuario u ON p.id_persona = u.id_persona
            WHERE p.ci = %s
        """
        result = db.execute_query(sql, (ci,), fetchone=True)
        if not result:
            return jsonify({'success': True, 'exists': False}), 200
        nombre, id_usuario, tipo_persona = result
        if tipo_persona != 'CLIENTE':
            return jsonify({'success': False, 'message': 'El CI pertenece al personal.'}), 403
        if id_usuario is not None:
            return jsonify({'success': False, 'message': 'Este CI ya tiene cuenta web. Inicie sesión.'}), 409       
        partes_nombre = nombre.split()
        nombre_enmascarado = " ".join([palabra[0] + "*" * (len(palabra) - 1) for palabra in partes_nombre])

        return jsonify({
            'success': True,
            'exists': True,
            'data': { 'masked_name': nombre_enmascarado },
            'message': '¡Paciente encontrado! Por seguridad, ingresa tu Fecha de Nacimiento exacta para validar tu identidad.'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Error en el servidor: {str(e)}'}), 500
    finally:
        if 'db' in locals():
            db.close_connection()

# REGISTRO DE USUARIOS
@auth_routes.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}      
        user_name = str(data.get('user', '')).strip()
        name = str(data.get('name', '')).strip()
        mail_user = str(data.get('mail', '')).strip() 
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

        if not all([user_name, ci, name, mail_user, birth, password]):
            return jsonify({'success': False, 'message': 'Faltan campos obligatorios.'}), 400

        es_valida, msg_error = validar_password(password)
        if not es_valida:
            return jsonify({'success': False, 'message': msg_error}), 400

        pass_hash = generate_password_hash(password)
        
        db.create_connection()
        sql_call = f"CALL {Config.SCHEMA}.p_registrar_usuario(%s, %s, %s, %s, %s, %s, %s, %s)"
        params = (user_name, ci, name, mail_user, number, birth, direction, pass_hash)
        db.execute_query(sql_call, params, commit=True)

        return jsonify({'success': True, 'message': '¡Cuenta creada exitosamente!'}), 201

    except psycopg2.Error as e:
        error_msg = e.diag.message_primary if e.diag.message_primary else str(e)
        return jsonify({'success': False, 'message': error_msg}), 409
    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Error en el servidor: {str(e)}'}), 500
    finally:
        db.close_connection()

# LOGIN DE USUARIOS
@auth_routes.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json() or {}
        user_input = data.get('user_input')
        password = data.get('password')

        if not user_input or not password:
            return jsonify({'success': False, 'message': 'Debe ingresar sus credenciales.'}), 400

        db.create_connection()
        call_sql = f"CALL {Config.SCHEMA}.p_login_usuario(%s, NULL, NULL, NULL, NULL, NULL, NULL, NULL)"
        result = db.execute_query(call_sql, (user_input.strip(),), fetchone=True)
        
        u_id, p_id, u_name, u_hash, p_name, p_mail, r_id = result
        es_valida = check_password_hash(u_hash, password)

        sql_intentos = f"CALL {Config.SCHEMA}.p_registrar_intentos_login(%s, %s)"
        db.execute_query(sql_intentos, (u_id, es_valida), commit=True)

        if not es_valida:
            return jsonify({'success': False, 'message': 'Contraseña incorrecta.'}), 401

        token = create_access_token(user_id=u_id, user_name=u_name, role=r_id, name=p_name)
        
        return jsonify({
            'success': True,
            'message': 'Inicio de sesión exitoso',
            'access_token': token,
            'user': { 'id_usuario': u_id, 'id_persona': p_id, 'nombre': p_name, 'correo': p_mail, 'rol': r_id }
        }), 200

    except psycopg2.Error as e:
        error_msg = e.diag.message_primary if e.diag.message_primary else str(e)
        return jsonify({'success': False, 'message': error_msg}), 403 

    except Exception as e:
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Error:{str(e)}'}), 500    
    finally:
        db.close_connection()

@auth_routes.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        db.create_connection()
        query_pacientes = f"SELECT COUNT(*) FROM {Config.SCHEMA}.t_persona WHERE tipo_persona = 'CLIENTE'"
        query_especialidades = f"SELECT COUNT(*) FROM {Config.SCHEMA}.t_rol"
        res_p = db.execute_query(query_pacientes, fetchone=True)
        res_e = db.execute_query(query_especialidades, fetchone=True)
        return jsonify({
            'success': True,
            'stats': {
                'pacientes': res_p[0] if res_p else 0,
                'especialidades': res_e[0] if res_e else 0,
                'años': 100, 'calidad': '100%'
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.close_connection()


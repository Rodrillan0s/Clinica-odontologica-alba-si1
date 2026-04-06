from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import traceback # Importante para ver los errores reales en consola
from ..config import db, Config

auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json() or {}
        
        # 1. VALIDACIÓN DE CAMPOS REQUERIDOS (los que son NOT NULL en BD)
        required = ['user', 'ci', 'name', 'mail', 'birth', 'password']
        for field in required:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'Falta el campo obligatorio: {field}'}), 400

        # 2. LIMPIEZA Y CASTEO DE DATOS (para evitar errores de formato en BD)
        user_name = str(data.get('user')).strip().upper()
        name = str(data.get('name')).strip().upper()
        mail = str(data.get('mail')).strip().lower()
        birth = data.get('birth') # Ya viene como YYYY-MM-DD
        password = data.get('password')
        
        # Casteo de BigInt: Si están vacíos causan error en BD
        try:
            ci = int(data.get('ci'))
            # Si el teléfono viene vacío, lo volvemos None (NULL en BD) 
            raw_number = data.get('number')
            number = int(raw_number) if raw_number else None
        except ValueError:
            return jsonify({'success': False, 'message': 'El CI y Teléfono deben ser números válidos.'}), 400

        # Dirección opcional
        raw_dir = data.get('dir')
        direction = str(raw_dir).strip().upper() if raw_dir else ''
        
        id_role = 5 # ROL CLIENTE

        # 3. CONEXIÓN A BASE DE DATOS
        db.create_connection()

        # 4. VERIFICAR DUPLICADOS (CI, Correo o Usuario)
        check_sql = f"""
            SELECT 1 FROM {Config.SCHEMA}.t_persona p
            LEFT JOIN {Config.SCHEMA}.t_usuario u ON p.id_persona = u.id_persona
            WHERE p.ci = %s OR u.correo = %s OR u.nombre_usuario = %s
            LIMIT 1
        """
        if db.execute_query(check_sql, (ci, mail, user_name), fetchone=True):
            return jsonify({'success': False, 'message': 'El CI, Correo o Usuario ya existen en el sistema.'}), 409

        # 5. INSERTAR EN t_persona (Crea la identidad física)
        sql_p = f"""
            INSERT INTO {Config.SCHEMA}.t_persona (nombre, telefono, fecha_nacimiento, direccion, tipo_persona, ci)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id_persona
        """
        res_p = db.execute_query(sql_p, (name, number, birth, direction, 'CLIENTE', ci), fetchone=True, commit=True)
        
        if not res_p:
            raise Exception("La base de datos no devolvió el ID de la persona.")
            
        new_persona_id = res_p[0]

        # 6. INSERTAR EN t_usuario (Crea el acceso al sistema)
        pass_hash = generate_password_hash(password)
        sql_u = f"""
            INSERT INTO {Config.SCHEMA}.t_usuario (correo, nombre_usuario, "contraseña", id_persona, id_rol)
            VALUES (%s, %s, %s, %s, %s)
        """
        db.execute_query(sql_u, (mail, user_name, pass_hash, new_persona_id, id_role), commit=True)

        return jsonify({'success': True, 'message': '¡Cuenta creada exitosamente!'}), 201

    except Exception as e:
        # Si algo explota, lo imprimimos en consola y mandamos un JSON seguro a React
        print("\n--- ERROR EN REGISTRO ---")
        traceback.print_exc()
        print("-------------------------\n")
        return jsonify({'success': False, 'message': f'Error en el servidor: {str(e)}'}), 500
    finally:
        # Asegurarse de que cierre la conexión exista error o no
        if 'db' in locals():
            db.close_connection()


@auth_routes.route('/api/login', methods=['POST'])
def login():
    from ..services import create_access_token 
    
    try:
        data = request.get_json() or {}
        user_input = data.get('user_input') # Correo o nombre_usuario
        password = data.get('password')

        if not user_input or not password:
            return jsonify({'success': False, 'message': 'Debe ingresar sus credenciales.'}), 400

        db.create_connection()

        # JOIN para validar y obtener los datos necesarios del usuario y la persona
        query = f"""
            SELECT u.id_usuario, u.nombre_usuario, u."contraseña", p.nombre, u.correo, u.id_rol
            FROM {Config.SCHEMA}.t_usuario u
            INNER JOIN {Config.SCHEMA}.t_persona p ON u.id_persona = p.id_persona
            WHERE u.correo = %s OR u.nombre_usuario = %s
            LIMIT 1
        """
        # Comparar con lower() para correos y upper() para usuarios
        result = db.execute_query(query, (user_input.strip().lower(), user_input.strip().upper()), fetchone=True)

        if not result:
            return jsonify({'success': False, 'message': 'Usuario o correo no encontrados.'}), 404
        
        u_id, u_name, u_hash, p_name, p_mail, r_id = result

        # VALIDAR EL HASH DE LA CONTRASEÑA
        if not check_password_hash(u_hash, password):
            return jsonify({'success': False, 'message': 'Contraseña incorrecta.'}), 401

        # GENERAR TOKEN JWT
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

    except Exception as e:
        print("\n--- ERROR EN LOGIN ---")
        traceback.print_exc()
        print("----------------------\n")
        return jsonify({'success': False, 'message': f'Error en el login: {str(e)}'}), 500
    finally:
        if 'db' in locals():
            db.close_connection()
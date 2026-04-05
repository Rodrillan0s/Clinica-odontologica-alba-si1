from flask import Blueprint,redirect,request,jsonify
from werkzeug.security import generate_password_hash,check_password_hash

from ..config import db,Config
from ..services import create_access_token

auth_routes=Blueprint('auth_routes',__name__)

@auth_routes.route('/api/register',methods=['POST'])
def register():
    #OBTENER DATOS (JSON) DESDE EL FRONTEND
    data=request.get_json()

    #VALIDACION: SELECCIONAR CAMPOS REQUERIDOS PARA EL REGISTRO
    required_fields=['user','doc','name','mail','number','password']

    for field in required_fields:
        if field not in data:
            return jsonify({
                'success':False,
                'message':'Debe Ingresar Todos los Campos Requeridos'
            })

    #ORGANIZAR TODOS LO PARAMETROS
    user_name=data.get('user').upper()
    doc=data.get('doc')
    name=data.get('name').upper()
    mail=data.get('mail').lower()
    number=data.get('number')
    direction=data.get('dir')
    password=data.get('password')
    id_role=4 #ROL NRO.4 =CLIENTE

    if direction:
        direction=direction.upper()

    try:
        db.create_connection()

        check_query=f"""
            SELECT 1
            FROM {Config.SCHEMA}.{Config.T_USER}
            WHERE DOCUMENTO_IDENTIDAD=%s OR CORREO=%s 
            OR USER_NAME=%s
            LIMIT 1
        """

        check_params=(doc,mail,user_name)

        result=db.execute_query(check_query,check_params,fetchone=True)

        if result:
            return jsonify({'success':False,'message':'El usuario ya se encuentra registrado.'})

        #ENCRIPTAR CONTRASEÑA EN CASO DE QUE EL USUARIO SE PUEDA REGISTRAR
        password_hash=generate_password_hash(password=password,method='pbkdf2:sha256')  

        if direction:
            insert_query=f"""
                INSERT INTO {Config.SCHEMA}.{Config.T_USER} 
                (USER_NAME,PASSWORD_HASH,DOCUMENTO_IDENTIDAD,NOMBRE_RAZON_SOCIAL,DIRECCION,CORREO,TELEFONO,ID_ROL)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """

            insert_params=(user_name,password_hash,doc,name,direction,mail,number,id_role)
        else:
            insert_query=f"""
                INSERT INTO {Config.SCHEMA}.{Config.T_USER} 
                (USER_NAME,PASSWORD_HASH,DOCUMENTO_IDENTIDAD,NOMBRE_RAZON_SOCIAL,CORREO,TELEFONO,ID_ROL)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """

            insert_params=(user_name,password_hash,doc,name,mail,number,id_role)
        
        ra=db.execute_query(insert_query,insert_params,commit=True)
        if ra<1:
            print(f'Usuario Registrado Exitosamente, {ra} filas afectadas')
            return jsonify({
                'success':False,
                'message':f'Hubo un problema al registrar el usuario'
            })
        
        print(f'Usuario Registrado Exitosamente, {ra} filas afectadas')
        return jsonify({
            'success':True,
            'message':f'Usuario Registrado Exitosamente'
        })

    
    except Exception as e:
        return jsonify({
            'success':False,
            'message':f'ERROR: {e}'
        })
    finally:
        db.close_connection()

    
@auth_routes.route('/api/login',methods=['POST'])
def login():
    data=request.get_json()

    user_input=data.get('user_input')
    password=data.get('password')

    if not user_input or not password:
        return jsonify({
            'success':False,
            'message':'Debe Ingresar su Correo y Contraseña.'
        })
    
    try:
        #ESTABLECER CONEXION A LA BASE DE DATOS
        db.create_connection()

        query = f"""
            SELECT ID_USUARIO, USER_NAME, PASSWORD_HASH, NOMBRE_RAZON_SOCIAL, CORREO, ID_ROL, ESTADO_CUENTA
            FROM {Config.SCHEMA}.{Config.T_USER}
            WHERE CORREO = %s OR USER_NAME = %s
            LIMIT 1
        """

        params=(user_input.lower(),user_input.upper())

        result=db.execute_query(query,params,fetchone=True)

        if not result:
            return jsonify({
                'success':False,
                'message':'El usuario Ingresado no Existe.'
            })
        
        #EXTRAER DATOS DE LA DB
        user_id=result[0]
        user_name=result[1]
        password_hash=result[2]
        name=result[3]
        mail=result[4]
        role_id=result[5]
        account_stat=result[6]

        #INICIO DE SESION FALLIDO: CUENTA SUSPENDIDA
        if account_stat!='ACTIVO':
            return jsonify({
                'success':False,
                'message':'La cuenta se encuentra Inactiva o Suspendida.'
            })
        
        #INICIO DE SESION FALLIDO: CONTRASEÑA INCORRECTA
        if not check_password_hash(password_hash,password):
            return jsonify({
                'success':False,
                'message':'Contraseña Incorrecta.'
            })

        #INICIO DE SESION EXITOSO: GENERAR TOKEN JWT
        token=create_access_token(
            user_id=user_id,
            user_name=user_name,
            role=role_id,
            name=name)
        
        print(f"Login exitoso para el usuario: {user_name}")
        return jsonify({
            'success':True,
            'message':'Inicio de Sesion Exitoso',
            'access_token':token,
            'user':{
                'id_usuario':user_id,
                'nombre_razon_social':name,
                'correo':mail,
                'id_rol':role_id
            }
        })

    except Exception as e:
        return jsonify({
            'success':False,
            'message':f'ERROR : {e}'
        })
    finally:
        db.close_connection()
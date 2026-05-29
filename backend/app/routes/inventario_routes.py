from flask import Blueprint, request, jsonify
import traceback
from ..config import db, Config
from ..classes.security import admin_required, Security, permission_required
from ..services.bitacora import Bitacora

inventario_routes = Blueprint('inventario_routes', __name__)

# =========================================================
# 1. CONSULTAR CATÁLOGO DE MATERIALES (GET)
# =========================================================
@inventario_routes.route('/api/materiales', methods=['GET'])
@admin_required
@permission_required("visualizar_materiales")
def consultar_materiales():
    try:
        query = """
            SELECT 
                id_material, 
                nombre_material, 
                precio, 
                expirable 
            FROM clinica.t_materiales 
            ORDER BY id_material DESC
        """

        rows = db.execute_query(query, fetchall=True)

        data = [{
            "id_material": r[0],
            "nombre_material": r[1],
            "precio": float(r[2]),
            "expirable": r[3]
        } for r in (rows or [])]

        return jsonify({"success": True, "data": data}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================================
# 2. REGISTRAR UN NUEVO MATERIAL (POST)
# =========================================================
@inventario_routes.route('/api/materiales', methods=['POST'])
@admin_required
@permission_required("crear_material")
def registrar_material():
    try:
        data = request.get_json() or {}
        nombre_material = data.get('nombre_material')
        precio = data.get('precio')
        expirable = data.get('expirable', False)

        if not nombre_material or precio is None:
            return jsonify({"success": False, "message": "Datos incompletos"}), 400

        query = """
            INSERT INTO clinica.t_materiales (nombre_material, precio, expirable) 
            VALUES (%s, %s, %s)
        """
        params = (nombre_material, precio, expirable)

        db.execute_query(query, params, commit=True)

        Bitacora.registrar("INVENTARIO", "CREATE", f"Material creado: {nombre_material}")

        return jsonify({"success": True, "message": "Material registrado con éxito"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================================
# 3. MODIFICAR UN MATERIAL EXISTENTE (PUT)
# =========================================================
@inventario_routes.route('/api/materiales/<int:id_material>', methods=['PUT'])
@admin_required
@permission_required("modificar_material")
def modificar_material(id_material):
    try:
        data = request.get_json() or {}
        nombre_material = data.get('nombre_material')
        precio = data.get('precio')
        expirable = data.get('expirable')

        if not nombre_material or precio is None or expirable is None:
            return jsonify({"success": False, "message": "Datos incompletos"}), 400

        query = """
            UPDATE clinica.t_usuario  -- Nota: Asegúrate de apuntar a t_materiales
            clinica.t_materiales
            SET nombre_material = %s, precio = %s, expirable = %s 
            WHERE id_material = %s
        """
        
        # Corrección del bloque query limpio:
        query = """
            UPDATE clinica.t_materiales 
            SET nombre_material = %s, precio = %s, expirable = %s 
            WHERE id_material = %s
        """
        params = (nombre_material, precio, expirable, id_material)

        db.execute_query(query, params, commit=True)

        Bitacora.registrar("INVENTARIO", "UPDATE", f"Material actualizado: {id_material}, {nombre_material}")

        return jsonify({"success": True, "message": "Material actualizado con éxito"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================================
# 4. ELIMINAR UN MATERIAL (DELETE)
# =========================================================
@inventario_routes.route('/api/materiales/<int:id_material>', methods=['DELETE'])
@admin_required
@permission_required("eliminar_material")
def eliminar_material(id_material):
    try:
        result = db.execute_query(
            "SELECT nombre_material FROM clinica.t_materiales WHERE id_material = %s",
            (id_material,), fetchone=True
        )
        
        if not result:
            return jsonify({"success": False, "message": "Material no encontrado"}), 404        
        nombre_material = result[0]        
        db.execute_query("DELETE FROM clinica.t_materiales WHERE id_material = %s", (id_material,), commit=True)        
        Bitacora.registrar("INVENTARIO", "DELETE", f"Material eliminado: {id_material}, {nombre_material}")

        return jsonify({"success": True, "message": "Material eliminado correctamente"}), 200

    except Exception as e:
        err_msg = str(e)
        if "foreign key" in err_msg.lower() or "llave foránea" in err_msg.lower():
            return jsonify({
                "success": False, 
                "message": "No se puede eliminar el material porque tiene lotes o movimientos asociados en el almacén."
            }), 409
            
        return jsonify({"success": False, "message": err_msg}), 500
    
# =========================================================
# 5. LISTAR PROVEEDORES (Para el Select del Formulario)
# =========================================================
@inventario_routes.route('/api/proveedores', methods=['GET'])
@admin_required
def listar_proveedores():
    try:
        query = "SELECT id_proveedor, nombre_proveedor FROM clinica.t_proveedor ORDER BY nombre_proveedor ASC"
        rows = db.execute_query(query, fetchall=True)

        data = [{
            "id_proveedor": r[0],
            "nombre_proveedor": r[1]
        } for r in (rows or [])]

        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


#REGISTRAR ENTRADA DE MATERIAL 
@inventario_routes.route('/api/inventario/entrada', methods=['POST'])
@admin_required
@permission_required("registrar_entrada")
def registrar_entrada_inventario():
    try:
        data = request.get_json() or {}
        nombre_material = data.get('nombre_material')
        id_material = data.get('id_material')
        cantidad = data.get('cantidad')
        fecha_caducidad = data.get('fecha_caducidad')   # Puede venir None/null si no es expirable
        fecha_fabricacion = data.get('fecha_fabricacion') # Puede venir None/null si no es expirable
        id_proveedor = data.get('id_proveedor')         # Puede venir None/null si es opcional

        # Validaciones del core lógico
        if not id_material or not cantidad:
            return jsonify({"success": False, "message": "Material y cantidad son obligatorios"}), 400
            
        if int(cantidad) <= 0:
            return jsonify({"success": False, "message": "La cantidad debe ser mayor a cero"}), 400

        # Mapeo del Stored Procedure con CALL igual a tu p_crear_usuario_admin
        sql = f"""
            CALL {Config.SCHEMA}.p_registrar_entrada_almacen(
                %s, %s, %s, %s, %s
            )
        """
        params = (id_material, cantidad, fecha_caducidad, fecha_fabricacion, id_proveedor)

        # Se ejecuta y se auto-confirma mediante tu wrapper transaccional
        db.execute_query(sql, params, commit=True)

        # Auditoría automática en Bitácora
        Bitacora.registrar("INVENTARIO", "ENTRADA", f"Abastecimiento de material ID {id_material}. Cantidad: {cantidad}. Proveedor ID: {id_proveedor}. Nombre Material: {nombre_material}")

        return jsonify({"success": True, "message": "Entrada registrada correctamente"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    

#Registrar proveedor
@inventario_routes.route('/api/proveedores', methods=['POST'])
@admin_required
def registrar_proveedor_express():
    try:
        data = request.get_json() or {}
        nombre_proveedor = data.get('nombre_proveedor')
        telefono = data.get('telefono') 

        if not nombre_proveedor:
            return jsonify({"success": False, "message": "El nombre del proveedor es obligatorio"}), 400
        if len(nombre_proveedor) > 50:
            return jsonify({"success": False, "message": "El nombre no puede exceder los 50 caracteres."}), 400
        query = "INSERT INTO clinica.t_proveedor (nombre_proveedor, telefono) VALUES (%s, %s)"
        
        params = (nombre_proveedor.upper(), telefono if telefono else None)
        
        db.execute_query(query, params, commit=True)

        # Auditoría express en bitácora
        Bitacora.registrar("INVENTARIO", "CREATE", f"Proveedor registrado en caliente: {nombre_proveedor}")

        return jsonify({"success": True, "message": "Proveedor registrado correctamente"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
@inventario_routes.route('/api/inventario/lotes/<int:id_material>', methods=['GET'])
@admin_required
def obtener_lotes_material(id_material):
    try:
        # Capturamos si la vista requiere ver lotes vacíos/en cero (Gestión y Ajustes)
        ver_todo = request.args.get('todo', 'false').lower() == 'true'
        
        # Si ver_todo es True, dejamos el filtro vacío; si es False, aislamos solo los activos > 0
        filtro_stock = "" if ver_todo else "AND almacen.cantidad_disponible > 0"

        query = f"""
            SELECT 
                almacen.id_lote,
                almacen.cantidad_disponible,
                almacen.fecha_caducidad,
                almacen.fecha_fabricacion,
                prov.nombre_proveedor
            FROM {Config.SCHEMA}.t_materiales_almacen almacen
            LEFT JOIN {Config.SCHEMA}.t_proveedor prov ON almacen.id_proveedor = prov.id_proveedor
            WHERE almacen.id_material = %s {filtro_stock}
            ORDER BY almacen.fecha_caducidad ASC NULLS LAST, almacen.id_lote ASC
        """
        rows = db.execute_query(query, (id_material,), fetchall=True)

        data = []
        for r in (rows or []):
            data.append({
                "id_lote": r[0],
                "cantidad_disponible": r[1],
                "fecha_caducidad": r[2].strftime('%Y-%m-%d') if r[2] else None,
                "fecha_fabricacion": r[3].strftime('%Y-%m-%d') if r[3] else None,
                "nombre_proveedor": r[4] if r[4] else "INGRESO DIRECTO"
            })

        return jsonify({"success": True, "data": data}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# REGISTRAR SALIDA / BAJA DE STOCK 
@inventario_routes.route('/api/inventario/salida', methods=['POST'])
@admin_required
@permission_required("registrar_salida") # Tu decorador nativo de seguridad
def registrar_salida_inventario():
    try:
        data = request.get_json() or {}
        
        id_lote = data.get('id_lote')
        cantidad = data.get('cantidad')
        motivo = data.get('motivo', 'RETIRO') # Capturamos el motivo para la Bitácora de auditoría

        # Validaciones de consistencia primaria en Python
        if not id_lote or not cantidad:
            return jsonify({"success": False, "message": "El número de lote y la cantidad son obligatorios"}), 400
            
        if int(cantidad) <= 0:
            return jsonify({"success": False, "message": "La cantidad a retirar debe ser mayor a cero"}), 400

        # Invocación del Stored Procedure que creamos en pgAdmin
        sql = f"""
            CALL {Config.SCHEMA}.p_registrar_salida_almacen(
                %s, %s
            )
        """
        params = (id_lote, cantidad)

        # Se ejecuta dentro de la transacción atómica de tu base de datos
        # Si el procedimiento dispara un RAISE EXCEPTION por falta de stock, la API lo atrapa en el except
        db.execute_query(sql, params, commit=True)

        # Registro detallado en la Bitácora del Sistema para el control del administrador
        Bitacora.registrar(
            "INVENTARIO", 
            "SALIDA", 
            f"Baja de stock. Lote #{id_lote}. Cantidad retirada: {cantidad}. Motivo: {motivo.upper()}"
        )

        return jsonify({
            "success": True, 
            "message": "Salida procesada con éxito. Stock descontado y Kardex actualizado mediante SP."
        }), 201

    except Exception as e:
        # Extraemos el mensaje limpio del RAISE EXCEPTION de Postgres para que React lo lea amigablemente
        error_msg = str(e)
        if "Transacción denegada" in error_msg:
            # Si es nuestra regla de negocio del SP, limpiamos el string para la UI
            error_msg = error_msg.split("CONTEXT:")[0] if "CONTEXT:" in error_msg else error_msg
            
        return jsonify({"success": False, "message": error_msg}), 400
    

# CU28: AJUSTAR INVENTARIO
@inventario_routes.route('/api/inventario/ajuste', methods=['POST'])
@admin_required
@permission_required("ajustar_inventario") 
def ajustar_inventario_almacen():
    try:
        data = request.get_json() or {}
        
        id_lote = data.get('id_lote')
        nuevo_stock = data.get('nuevo_stock')
        motivo = data.get('motivo')

        if id_lote is None or nuevo_stock is None or not motivo:
            return jsonify({
                "success": False, 
                "message": "El número de lote, el nuevo stock real y la justificación son obligatorios."
            }), 400
            
        if int(nuevo_stock) < 0:
            return jsonify({
                "success": False, 
                "message": "El nuevo stock real verificado en los estantes no puede ser menor a cero."
            }), 400

        sql = f"""
            CALL {Config.SCHEMA}.p_ajustar_inventario(
                %s, %s, %s
            )
        """
        params = (id_lote, nuevo_stock, motivo)
        db.execute_query(sql, params, commit=True)

        Bitacora.registrar(
            "INVENTARIO", 
            "AJUSTE", 
            f"Auditoría física Lote #{id_lote}. Stock ajustado a: {nuevo_stock} u. Motivo: {motivo.upper()}"
        )

        return jsonify({
            "success": True, 
            "message": "Inventario ajustado con éxito."
        }), 200

    except Exception as e:
        error_msg = str(e)
        if "Error" in error_msg or "Transacción inválida" in error_msg:
            error_msg = error_msg.split("CONTEXT:")[0] if "CONTEXT:" in error_msg else error_msg
            
        return jsonify({"success": False, "message": error_msg}), 400
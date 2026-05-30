from flask import Blueprint, request, jsonify
import traceback
import csv
from io import StringIO
from flask import Response
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
        params = (str(nombre_material), float(precio), bool(expirable))

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
            UPDATE clinica.t_materiales 
            SET nombre_material = %s, precio = %s, expirable = %s 
            WHERE id_material = %s
        """
        params = (str(nombre_material), float(precio), bool(expirable), int(id_material))

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
            (int(id_material),), fetchone=True
        )
        
        if not result:
            return jsonify({"success": False, "message": "Material no encontrado"}), 404        
        nombre_material = result[0]        
        db.execute_query("DELETE FROM clinica.t_materiales WHERE id_material = %s", (int(id_material),), commit=True)        
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


# =========================================================
# 6. REGISTRAR ENTRADA DE MATERIAL (POST)
# =========================================================
@inventario_routes.route('/api/inventario/entrada', methods=['POST'])
@admin_required
@permission_required("registrar_entrada")
def registrar_entrada_inventario():
    try:
        data = request.get_json() or {}
        nombre_material = data.get('nombre_material')
        id_material = data.get('id_material')
        cantidad = data.get('cantidad')
        fecha_caducidad = data.get('fecha_caducidad')   
        fecha_fabricacion = data.get('fecha_fabricacion') 
        id_proveedor = data.get('id_proveedor')         

        if not id_material or not cantidad:
            return jsonify({"success": False, "message": "Material y cantidad son obligatorios"}), 400
            
        if int(cantidad) <= 0:
            return jsonify({"success": False, "message": "La cantidad debe ser mayor a cero"}), 400

        sql = f"""
            CALL {Config.SCHEMA}.p_registrar_entrada_almacen(
                %s, %s, %s, %s, %s
            )
        """
        # Casteo explícito preventivo para evitar fallos de driver
        params = (
            int(id_material), 
            int(cantidad), 
            fecha_caducidad if fecha_caducidad else None, 
            fecha_fabricacion if fecha_fabricacion else None, 
            int(id_proveedor) if id_proveedor else None
        )

        db.execute_query(sql, params, commit=True)

        Bitacora.registrar("INVENTARIO", "ENTRADA", f"Abastecimiento de material ID {id_material}. Cantidad: {cantidad}. Proveedor ID: {id_proveedor}. Nombre Material: {nombre_material}")

        return jsonify({"success": True, "message": "Entrada registrada correctamente"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    

# =========================================================
# 7. REGISTRAR PROVEEDOR EXPRESS (POST)
# =========================================================
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
        
        params = (str(nombre_proveedor).upper(), str(telefono) if telefono else None)
        
        db.execute_query(query, params, commit=True)

        Bitacora.registrar("INVENTARIO", "CREATE", f"Proveedor registrado en caliente: {nombre_proveedor}")

        return jsonify({"success": True, "message": "Proveedor registrado correctamente"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    

# =========================================================
# 8. OBTENER LOTES DE UN MATERIAL (GET)
# =========================================================
@inventario_routes.route('/api/inventario/lotes/<int:id_material>', methods=['GET'])
@admin_required
def obtener_lotes_material(id_material):
    try:
        ver_todo = request.args.get('todo', 'false').lower() == 'true'
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
        rows = db.execute_query(query, (int(id_material),), fetchall=True)

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


# =========================================================
# 9. REGISTRAR SALIDA / BAJA DE STOCK (POST)
# =========================================================
@inventario_routes.route('/api/inventario/salida', methods=['POST'])
@admin_required
@permission_required("registrar_salida") 
def registrar_salida_inventario():
    try:
        data = request.get_json() or {}
        
        id_lote = data.get('id_lote')
        cantidad = data.get('cantidad')
        motivo = data.get('motivo', 'RETIRO') 

        if not id_lote or not cantidad:
            return jsonify({"success": False, "message": "El número de lote y la cantidad son obligatorios"}), 400
            
        if int(cantidad) <= 0:
            return jsonify({"success": False, "message": "La cantidad a retirar debe ser mayor a cero"}), 400

        sql = f"""
            CALL {Config.SCHEMA}.p_registrar_salida_almacen(
                %s, %s
            )
        """
        params = (int(id_lote), int(cantidad))

        db.execute_query(sql, params, commit=True)

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
        error_msg = str(e)
        if "Transacción denegada" in error_msg:
            error_msg = error_msg.split("CONTEXT:")[0] if "CONTEXT:" in error_msg else error_msg
            
        return jsonify({"success": False, "message": error_msg}), 400
    

# =========================================================
# 10. CU28: AJUSTAR INVENTARIO (POST - CON CASTEOS EXPLICITOS)
# =========================================================
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
        # FIJADO AQUÍ: Forzamos la conversión a tipos primitivos nativos duros (int, int, str)
        params = (int(id_lote), int(nuevo_stock), str(motivo))
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
    

# =========================================================
# 11. OBTENER DATOS ANALÍTICOS PARA REPORTES (GET JSON)
# =========================================================
@inventario_routes.route('/api/inventario/reportes', methods=['GET'])
@admin_required
@permission_required("visualizar_reportes")
def obtener_datos_reporte():
    try:
        tipo = request.args.get('tipo', 'general')
        rows = []
        columns = []

        if tipo == 'general':
            query = f"""
                SELECT 
                    m.id_material AS id,
                    m.nombre_material AS descripcion,
                    m.precio,
                    m.expirable,
                    COALESCE(SUM(almacen.cantidad_disponible), 0) AS stock_total,
                    COUNT(almacen.id_lote) AS total_lotes
                FROM {Config.SCHEMA}.t_materiales m
                LEFT JOIN {Config.SCHEMA}.t_materiales_almacen almacen ON m.id_material = almacen.id_material
                GROUP BY m.id_material, m.nombre_material, m.precio, m.expirable
                ORDER BY stock_total DESC, m.nombre_material ASC
            """
            rows = db.execute_query(query, fetchall=True)
            columns = ["ID", "Descripción", "Precio (Bs.)", "Expirable", "Stock Actual", "Lotes Activos"]
            data = [{
                "id": r[0], "descripcion": r[1], "precio": float(r[2]),
                "info_extra": "SÍ" if r[3] else "NO", "metrica_core": int(r[4]), "conteo_lotes": r[5]
            } for r in (rows or [])]

        elif tipo == 'mermas':
            query = f"""
                SELECT 
                    m.id_material AS id,
                    m.nombre_material AS descripcion,
                    ABS(SUM(mov.monto)) AS total_mermado,
                    COUNT(mov.id_movimiento) AS transacciones_baja,
                    m.precio
                FROM {Config.SCHEMA}.t_movimiento_inventario mov
                JOIN {Config.SCHEMA}.t_materiales m ON mov.id_material = m.id_material
                WHERE mov.monto < 0
                GROUP BY m.id_material, m.nombre_material, m.precio
                ORDER BY total_mermado DESC
            """
            rows = db.execute_query(query, fetchall=True)
            columns = ["ID", "Material", "Unidades Mermadas", "Nro. Incidentes", "Precio Catálogo", "Costo Perdido Estante"]
            data = [{
                "id": r[0], "descripcion": r[1], "metrica_core": int(r[2]),
                "info_extra": f"{r[3]} Bajas", "precio": float(r[4]), "costo_total": float(r[2] * r[4])
            } for r in (rows or [])]

        elif tipo == 'ingresos':
            query = f"""
                SELECT 
                    m.id_material AS id,
                    m.nombre_material AS descripcion,
                    SUM(mov.monto) AS total_ingresado,
                    COUNT(mov.id_movimiento) AS cargamentos,
                    MAX(mov.fecha_movimiento) AS ultimo_ingreso
                FROM {Config.SCHEMA}.t_movimiento_inventario mov
                JOIN {Config.SCHEMA}.t_materiales m ON mov.id_material = m.id_material
                WHERE mov.monto > 0
                GROUP BY m.id_material, m.nombre_material
                ORDER BY total_ingresado DESC
            """
            rows = db.execute_query(query, fetchall=True)
            columns = ["ID", "Material", "Total Ingresado", "Nro. Entradas", "Último Abastecimiento"]
            data = [{
                "id": r[0], "descripcion": r[1], "metrica_core": int(r[2]),
                "info_extra": f"{r[3]} Remesas", "fecha_ref": r[4].strftime('%Y-%m-%d %H:%M') if r[4] else 'N/A'
            } for r in (rows or [])]

        elif tipo == 'vencimientos':
            query = f"""
                SELECT 
                    almacen.id_lote AS id,
                    m.nombre_material AS descripcion,
                    almacen.cantidad_disponible,
                    almacen.fecha_caducidad,
                    prov.nombre_proveedor
                FROM {Config.SCHEMA}.t_materiales_almacen almacen
                JOIN {Config.SCHEMA}.t_materiales m ON almacen.id_material = m.id_material
                LEFT JOIN {Config.SCHEMA}.t_proveedor prov ON almacen.id_proveedor = prov.id_proveedor
                WHERE almacen.fecha_caducidad IS NOT NULL AND almacen.cantidad_disponible > 0
                ORDER BY almacen.fecha_caducidad ASC
            """
            rows = db.execute_query(query, fetchall=True)
            columns = ["Código Lote", "Descripción Material", "Stock en Riesgo", "Fecha Vencimiento", "Proveedor Distribuidor"]
            data = [{
                "id": f"LOTE #{r[0]}", "descripcion": r[1], "metrica_core": int(r[2]),
                "fecha_ref": r[3].strftime('%Y-%m-%d') if r[3] else 'N/A', "info_extra": r[4] if r[4] else 'INGRESO DIRECTO'
            } for r in (rows or [])]

        else:
            return jsonify({"success": False, "message": "Tipo de reporte inválido"}), 400

        return jsonify({
            "success": True,
            "columns": columns,
            "data": data
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# =========================================================
# 12. EXPORTAR REPORTE A EXCEL/CSV (DESCARGA DIRECTA)
# =========================================================
@inventario_routes.route('/api/inventario/reportes/exportar', methods=['GET'])
@admin_required
def exportar_reporte_csv():
    try:
        tipo = request.args.get('tipo', 'general')
        si = StringIO()
        cw = csv.writer(si, delimiter=';') 

        if tipo == 'general':
            filename = "Reporte_General_Inventario.csv"
            cw.writerow(["ID MATERIAL", "DESCRIPCION", "PRECIO (Bs.)", "EXPIRABLE", "STOCK ACTUAL", "LOTES REGISTRADOS"])
            query = f"SELECT m.id_material, m.nombre_material, m.precio, m.expirable, COALESCE(SUM(a.cantidad_disponible),0), COUNT(a.id_lote) FROM {Config.SCHEMA}.t_materiales m LEFT JOIN {Config.SCHEMA}.t_materiales_almacen a ON m.id_material = a.id_material GROUP BY m.id_material, m.nombre_material, m.precio, m.expirable"
            rows = db.execute_query(query, fetchall=True) or []
            for r in rows:
                cw.writerow([r[0], r[1], f"{float(r[2]):.2f}", "SÍ" if r[3] else "NO", r[4], r[5]])

        elif tipo == 'mermas':
            filename = "Reporte_Mermas_y_Roturas.csv"
            cw.writerow(["ID MATERIAL", "DESCRIPCION MATERIAL", "UNIDADES PERDIDAS", "INCIDENTES REGISTRADOS", "PRECIO UNITARIO (Bs.)", "TOTAL COSTO PERDIDO (Bs.)"])
            query = f"SELECT m.id_material, m.nombre_material, ABS(SUM(mov.monto)), COUNT(mov.id_movimiento), m.precio FROM {Config.SCHEMA}.t_movimiento_inventario mov JOIN {Config.SCHEMA}.t_materiales m ON mov.id_material = m.id_material WHERE mov.monto < 0 GROUP BY m.id_material, m.nombre_material, m.precio"
            rows = db.execute_query(query, fetchall=True) or []
            for r in rows:
                cw.writerow([r[0], r[1], r[2], r[3], f"{float(r[4]):.2f}", f"{float(r[2]*r[4]):.2f}"])

        elif tipo == 'ingresos':
            filename = "Reporte_Rotacion_Ingresos.csv"
            cw.writerow(["ID MATERIAL", "DESCRIPCION MATERIAL", "TOTAL UNIDADES INGRESADAS", "NUMERO DE REMESAS", "ULTIMO INGRESO"])
            query = f"SELECT m.id_material, m.nombre_material, SUM(mov.monto), COUNT(mov.id_movimiento), MAX(mov.fecha_movimiento) FROM {Config.SCHEMA}.t_movimiento_inventario mov JOIN {Config.SCHEMA}.t_materiales m ON mov.id_material = m.id_material WHERE mov.monto > 0 GROUP BY m.id_material, m.nombre_material"
            rows = db.execute_query(query, fetchall=True) or []
            for r in rows:
                cw.writerow([r[0], r[1], r[2], r[3], r[4].strftime('%Y-%m-%d %H:%M') if r[4] else 'N/A'])
        
        else:
            filename = "Reporte_Alertas_Vencimiento.csv"
            cw.writerow(["CODIGO LOTE", "DESCRIPCION MATERIAL", "STOCK EN RIESGO", "FECHA CADUCIDAD", "PROVEEDOR PROCEDENCIA"])
            query = f"SELECT a.id_lote, m.nombre_material, a.cantidad_disponible, a.fecha_caducidad, p.nombre_proveedor FROM {Config.SCHEMA}.t_materiales_almacen a JOIN {Config.SCHEMA}.t_materiales m ON a.id_material = m.id_material LEFT JOIN {Config.SCHEMA}.t_proveedor p ON a.id_proveedor = p.id_proveedor WHERE a.fecha_caducidad IS NOT NULL AND a.cantidad_disponible > 0"
            rows = db.execute_query(query, fetchall=True) or []
            for r in rows:
                cw.writerow([f"LOTE #{r[0]}", r[1], r[2], r[3].strftime('%Y-%m-%d') if r[3] else 'N/A', r[4] if r[4] else 'INGRESO DIRECTO'])

        output = "\xef\xbb\xbf" + si.getvalue()
        
        return Response(
            output,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth_store";

const API_URL = import.meta.env.VITE_API_URL;

export default function AjustarInventario() {
  const user = useAuthStore((state) => state.user);

  // Estados de carga de datos maestros
  const [materiales, setMateriales] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loadingMateriales, setLoadingMateriales] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados de alertas reactivas en la UI
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Estado del Formulario unificado de Auditoría (CU28)
  const [form, setForm] = useState({
    id_material: "",
    id_lote: "",
    nuevo_stock: "",
    motivo: "ERROR DE REGISTRO", // Razón por defecto
  });

  // Estado de control para calcular la variación en tiempo real
  const [stockTeoricoActual, setStockTeoricoActual] = useState(null);

  // Configuración de cabeceras seguras nativas de tu app
  const getFetchConfig = (method = "GET", body = null) => {
    const config = {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    };
    if (body) config.body = JSON.stringify(body);
    return config;
  };

  // ==========================================
  // 1. CARGAR CATÁLOGO DE MATERIALES BASE
  // ==========================================
  const cargarMaterialesMaster = async () => {
    try {
      setLoadingMateriales(true);
      setErrorMsg("");
      const res = await fetch(`${API_URL}/materiales`, getFetchConfig("GET"));
      const result = await res.json();

      if (result.success) {
        setMateriales(result.data);
      } else {
        setErrorMsg("Error de sincronización con el catálogo maestro.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de red al conectar con el servidor logístico.");
    } finally {
      setLoadingMateriales(false);
    }
    // CORREGIDO: Se removió la línea suelta de fetch que generaba conflicto de scope aquí
  };

  useEffect(() => {
    cargarMaterialesMaster();
  }, []);

  // ==========================================
  // 2. MANEJADOR REACTIVO: CAMBIO DE MATERIAL -> TRAER LOTES
  // ==========================================
  const handleMaterialChange = async (e) => {
    const selectedId = e.target.value;

    // Reseteamos cascada de estados por consistencia de UI
    setLotes([]);
    setStockTeoricoActual(null);
    setForm((prev) => ({
      ...prev,
      id_material: selectedId,
      id_lote: "",
      nuevo_stock: "",
    }));
    setErrorMsg("");

    if (!selectedId) return;

    try {
      setLoadingLotes(true);
      
      // CORREGIDO: Ahora inyectamos ?todo=true para que la API retorne también lotes en cero (0) indispensables para auditoría
      const res = await fetch(`${API_URL}/inventario/lotes/${selectedId}?todo=true`, getFetchConfig("GET"));
      const result = await res.json();

      if (result.success) {
        setLotes(result.data);
      } else {
        setErrorMsg(result.message || "No se detectaron lotes cargados para este insumo.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al consultar la trazabilidad del material.");
    } finally {
      setLoadingLotes(false);
    }
  };

  // ==========================================
  // 3. MANEJADOR REACTIVO: SELECCIÓN DE LOTE -> CAPTURAR STOCK TEÓRICO
  // ==========================================
  const handleLoteChange = (e) => {
    const selectedLoteId = e.target.value;
    setErrorMsg("");
    setForm((prev) => ({ ...prev, id_lote: selectedLoteId, nuevo_stock: "" }));

    if (!selectedLoteId) {
      setStockTeoricoActual(null);
      return;
    }

    // Buscamos el lote en memoria para saber qué cantidad dice el sistema que hay
    const loteEncontrado = lotes.find((l) => Number(l.id_lote) === Number(selectedLoteId));
    if (loteEncontrado) {
      setStockTeoricoActual(Number(loteEncontrado.cantidad_disponible));
    }
  };

  // ==========================================
  // 4. CALCULAR VARIACIÓN EN CALIENTE (UX PREMIUM)
  // ==========================================
  const calcularVariacionKardex = () => {
    if (stockTeoricoActual === null || form.nuevo_stock === "") return null;
    return Number(form.nuevo_stock) - stockTeoricoActual;
  };

  const deltaVariacion = calcularVariacionKardex();

  // ==========================================
  // 5. ENVIAR TRANSACCIÓN DE CONCILIACIÓN (POST)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validaciones rígidas de Precondición
    if (!form.id_lote || form.nuevo_stock === "" || !form.motivo) {
      setErrorMsg("Por favor, rellena todos los campos obligatorios del formulario.");
      return;
    }

    const nuevoStockValor = Number(form.nuevo_stock);

    // Mapeo directo de la Excepción 5a de tu documento técnico
    if (nuevoStockValor < 0) {
      setErrorMsg("Excepción 5a: El nuevo saldo real verificado no puede ser un número negativo.");
      return;
    }

    try {
      setSubmitting(true);

      // Payload purgado emparejado con tu backend en Flask
      const payload = {
        id_lote: Number(form.id_lote),
        nuevo_stock: nuevoStockValor,
        motivo: form.motivo.trim(),
      };

      const res = await fetch(`${API_URL}/inventario/ajuste`, getFetchConfig("POST", payload));
      const result = await res.json();

      if (result.success) {
        // Imprime cartel verde esmeralda corporativo
        setSuccessMsg(result.message || "Conciliación física procesada correctamente.");

        // Limpieza completa y re-sincronización del módulo
        setForm({
          id_material: "",
          id_lote: "",
          nuevo_stock: "",
          motivo: "ERROR DE REGISTRO",
        });
        setLotes([]);
        setStockTeoricoActual(null);

        // Oculta el banner a los 4 segundos
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(result.message || "No se pudo impactar el ajuste en el almacén.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error crítico de comunicación con el servidor relacional.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMateriales) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center text-[#148F77] font-black text-xs uppercase tracking-widest animate-pulse">
        Abriendo consola de auditoría física y balances...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* SECCIÓN TITULAR */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-[#2A5C4D] font-black text-lg uppercase tracking-wide">
          Ajustar Inventario / Auditoría
        </h2>
        <p className="text-gray-400 text-xs mt-1">
          Módulo de Reconciliación: Ajustes Mecánicos de Saldos contra Conteo Físico Real (CU28)
        </p>
      </div>

      {/* NOTIFICACIONES BANNERS */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-[#148F77] text-xs font-bold px-5 py-4 rounded-xl shadow-sm animate-fadeIn">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-5 py-4 rounded-xl shadow-sm animate-fadeIn">
          ⚠ {errorMsg}
        </div>
      )}

      {/* TARJETA DE FORMULARIO */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-6 bg-gray-50/50 border-b border-gray-100">
          <h3 className="text-[#2A5C4D] font-black text-xs uppercase tracking-widest">
            Ficha de Cuadre Ciego de Stock
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* SELECT 1: MATERIALES */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Seleccionar Insumo Maestro *
            </label>
            <select
              required
              value={form.id_material}
              onChange={handleMaterialChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all uppercase font-semibold"
            >
              <option value="">-- Elija el producto para auditar sus estantes --</option>
              {materiales.map((m) => (
                <option key={m.id_material} value={m.id_material}>
                  {m.nombre_material}
                </option>
              ))}
            </select>
          </div>

          {/* SELECT 2: LOTES FISICOS (CON TRAZABILIDAD COMPLETA) */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Seleccionar Código de Lote Auditado *
            </label>
            <select
              required
              disabled={!form.id_material || loadingLotes || lotes.length === 0}
              value={form.id_lote}
              onChange={handleLoteChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all uppercase font-semibold disabled:bg-gray-100 disabled:text-gray-400"
            >
              {loadingLotes ? (
                <option value="">Abriendo hilos de trazabilidad activa...</option>
              ) : !form.id_material ? (
                <option value="">-- Requiere seleccionar un material primero --</option>
              ) : lotes.length === 0 ? (
                <option value="">-- No existen lotes registrados o activos para este ítem --</option>
              ) : (
                <>
                  <option value="">-- Seleccione el lote físico a conciliar --</option>
                  {lotes.map((l) => (
                    <option key={l.id_lote} value={l.id_lote}>
                      LOTE #{l.id_lote} ➔ SISTEMA: {l.cantidad_disponible} u. | PROV: {l.nombre_proveedor}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* PANEL INFORMATIVO DE SALDOS ANTES/DESPUÉS */}
          {stockTeoricoActual !== null && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 animate-fadeIn">
              <div className="flex flex-col justify-center">
                <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest">Stock Teórico (Sistema)</span>
                <span className="text-gray-700 font-extrabold text-sm mt-1">{stockTeoricoActual} Unidades</span>
              </div>
              
              {/* CÁLCULO DEL DELTA MATEMÁTICO EN TIEMPO REAL */}
              <div className="flex flex-col justify-center md:items-end">
                <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest">Variación en Kardex (Delta)</span>
                {deltaVariacion === null ? (
                  <span className="text-gray-300 font-bold text-xs mt-1">Esperando conteo...</span>
                ) : deltaVariacion === 0 ? (
                  <span className="text-gray-500 font-black text-xs bg-gray-200 px-3 py-1 rounded-full mt-1">0 (Sin Cambios)</span>
                ) : deltaVariacion > 0 ? (
                  <span className="text-emerald-600 font-black text-xs bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mt-1">
                    +{deltaVariacion} u. (Sobrante Interno)
                  </span>
                ) : (
                  <span className="text-red-600 font-black text-xs bg-red-50 border border-red-100 px-3 py-1 rounded-full mt-1">
                    {deltaVariacion} u. (Faltante / Merma)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* INPUT 3: MOTIVO TÉCNICO */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Razón o Motivo del Ajuste Mecánico *
            </label>
            <select
              required
              disabled={stockTeoricoActual === null}
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all font-semibold disabled:bg-gray-100"
            >
              <option value="ERROR DE REGISTRO">DIFERENCIA POR ERROR DE TRANSACCIÓN / DIGITACIÓN</option>
              <option value="PÉRDIDA / ROBO">FALTANTE POR PÉRDIDA NO DETECTADA</option>
              <option value="DAÑO / ROTURA">MERMA POR DESCARTE MATERIAL EN AUDITORÍA</option>
              <option value="INVENTARIO ANUAL">CONCILIACIÓN POR BALANCE GENERAL CLÍNICO</option>
            </select>
          </div>

          {/* INPUT 4: NUEVO STOCK REAL */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Nuevo Saldo Físico Real Constatado *
            </label>
            <input
              type="number"
              required
              min="0"
              disabled={stockTeoricoActual === null}
              placeholder={stockTeoricoActual !== null ? `Stock actual en sistema: ${stockTeoricoActual}` : "Ej. 45"}
              value={form.nuevo_stock}
              onChange={(e) => setForm({ ...form, nuevo_stock: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all font-semibold disabled:bg-gray-100"
            />
          </div>

          {/* BOTÓN TRANSACCIONAL DEFINITIVO */}
          <div className="pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={submitting || stockTeoricoActual === null}
              className={`w-full py-4 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md ${
                submitting || stockTeoricoActual === null
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-[#148F77] hover:bg-[#117A65] shadow-emerald-900/10"
              }`}
            >
              {submitting ? "Sincronizando Base de Datos..." : "⚙ Reconciliar Stock de Lote"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth_store";

const API_URL = import.meta.env.VITE_API_URL;

export default function RegistrarSalidas() {
  const user = useAuthStore((state) => state.user);

  // Estados de carga de datos maestros
  const [materiales, setMateriales] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [loadingMateriales, setLoadingMateriales] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados de notificaciones en pantalla
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Estado unificado del Formulario Transaccional (CU27)
  const [form, setForm] = useState({
    id_material: "",
    id_lote: "",
    cantidad: "",
    motivo: "VENCIMIENTO", // Valor por defecto lógico
  });

  // Estado de control para validación dinámica en caliente
  const [maxStockDisponible, setMaxStockDisponible] = useState(0);

  // Configuración de cabeceras seguras estándar de tu proyecto
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
  // 1. CARGA INICIAL DE MATERIALES MASTER
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
        setErrorMsg("Error al sincronizar el catálogo base de materiales.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de red al conectar con el inventario maestro.");
    } finally {
      setLoadingMateriales(false);
    }
  };

  useEffect(() => {
    cargarMaterialesMaster();
  }, []);

  // ==========================================
  // 2. DETECTOR REACTIVO: SELECCIÓN DE MATERIAL -> CARGAR LOTES
  // ==========================================
  const handleMaterialChange = async (e) => {
    const selectedMaterialId = e.target.value;

    // Reseteamos estados dependientes inmediatos por consistencia visual
    setLotes([]);
    setMaxStockDisponible(0);
    setForm((prev) => ({
      ...prev,
      id_material: selectedMaterialId,
      id_lote: "",
      cantidad: "",
    }));

    if (!selectedMaterialId) return;

    try {
      setLoadingLotes(true);
      setErrorMsg("");
      
      // Llamamos al endpoint dinámico con JOIN que armamos en Flask
      const res = await fetch(
        `${API_URL}/inventario/lotes/${selectedMaterialId}`,
        getFetchConfig("GET")
      );
      const result = await res.json();

      if (result.success) {
        setLotes(result.data);
      } else {
        setErrorMsg(result.message || "No se pudieron recuperar los lotes del material.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al consultar la trazabilidad de lotes en el servidor.");
    } finally {
      setLoadingLotes(false);
    }
  };

  // ==========================================
  // 3. DETECTOR: CAMBIO DE LOTE -> CAPTURAR TECHO MÁXIMO DE REtiRO
  // ==========================================
  const handleLoteChange = (e) => {
    const selectedLoteId = e.target.value;
    
    setForm((prev) => ({ ...prev, id_lote: selectedLoteId, cantidad: "" }));
    setErrorMsg("");

    if (!selectedLoteId) {
      setMaxStockDisponible(0);
      return;
    }

    // Buscamos el lote seleccionado dentro de nuestro array en memoria
    const loteEncontrado = lotes.find((l) => Number(l.id_lote) === Number(selectedLoteId));
    if (loteEncontrado) {
      setMaxStockDisponible(Number(loteEncontrado.cantidad_disponible));
    }
  };

  // ==========================================
  // 4. ENVÍO DE LA BAJA TRANSACCIONAL (POST)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validaciones de seguridad en Frontend
    if (!form.id_lote || !form.cantidad || !form.motivo) {
      setErrorMsg("Todos los campos marcados con asterisco son obligatorios.");
      return;
    }

    const cantidadRetiro = Number(form.cantidad);

    if (cantidadRetiro <= 0) {
      setErrorMsg("La cantidad a retirar debe ser obligatoriamente mayor a cero.");
      return;
    }

    // Blindaje de Regla de Negocio en Caliente
    if (cantidadRetiro > maxStockDisponible) {
      setErrorMsg(
        `Operación abortada: No puede retirar ${cantidadRetiro} unidades. El lote seleccionado solo dispone de ${maxStockDisponible} unidades físicas.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        id_lote: Number(form.id_lote),
        cantidad: cantidadRetiro,
        motivo: form.motivo,
      };

      const res = await fetch(`${API_URL}/inventario/salida`, getFetchConfig("POST", payload));
      const result = await res.json();

      if (result.success) {
        // Mostramos confirmación verde esmeralda
        setSuccessMsg(result.message || "Baja registrada e historial actualizado correctamente.");

        // Limpieza de formulario fluido
        setForm({
          id_material: "",
          id_lote: "",
          cantidad: "",
          motivo: "VENCIMIENTO",
        });
        setLotes([]);
        setMaxStockDisponible(0);

        // Ocultar mensaje de éxito en 4 segundos
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(result.message || "Ocurrió un error al procesar el retiro.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de comunicación crítica con el Backend.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMateriales) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center text-[#148F77] font-black text-xs uppercase tracking-widest animate-pulse">
        Sincronizando almacén de bajas y mermas clínicas...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HEADER DE LA COMPONENTE */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-[#2A5C4D] font-black text-lg uppercase tracking-wide">
          Registrar Salida / Mermas
        </h2>
        <p className="text-gray-400 text-xs mt-1">
          Módulo de Control de Calidad: Retiro de Insumos Vencidos, Dañados o Destinados a Consulta (CU27)
        </p>
      </div>

      {/* ALERTAS REACTIVAS */}
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

      {/* FORMULARIO CARD PRINCIPAL */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-6 bg-gray-50/50 border-b border-gray-100">
          <h3 className="text-[#2A5C4D] font-black text-xs uppercase tracking-widest">
            Orden de Retiro e Historial de Kardex
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* 1. SELECCIONAR MATERIAL */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Seleccionar Insumo Clínico *
            </label>
            <select
              required
              value={form.id_material}
              onChange={handleMaterialChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all uppercase font-semibold"
            >
              <option value="">-- Busque el material en el catálogo maestro --</option>
              {materiales.map((m) => (
                <option key={m.id_material} value={m.id_material}>
                  {m.nombre_material} {m.expirable ? " (Monitoreado Vencimiento)" : " (Insumo Fijo)"}
                </option>
              ))}
            </select>
          </div>

          {/* 2. SELECCIONAR LOTE ESPECÍFICO (DINÁMICO CON TRAZABILIDAD) */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Seleccionar Lote Físico de Procedencia *
            </label>
            
            <select
              required
              disabled={!form.id_material || loadingLotes || lotes.length === 0}
              value={form.id_lote}
              onChange={handleLoteChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all uppercase font-semibold disabled:bg-gray-100 disabled:text-gray-400"
            >
              {loadingLotes ? (
                <option value="">Cargando trazabilidad de lotes activos...</option>
              ) : !form.id_material ? (
                <option value="">-- Primero debe elegir un material de la lista superior --</option>
              ) : lotes.length === 0 ? (
                <option value="">-- No existen lotes con stock para este material --</option>
              ) : (
                <>
                  <option value="">-- Seleccione el lote damnificado/a retirar --</option>
                  {lotes.map((l) => (
                    <option key={l.id_lote} value={l.id_lote}>
                      LOTE #{l.id_lote} ➔ DISPONIBLE: {l.cantidad_disponible} u. | VENCE: {l.fecha_caducidad || "PERMANENTE"} | PROV: {l.nombre_provider || l.nombre_proveedor}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* Aviso inteligente si el producto se quedó sin existencias */}
            {form.id_material && !loadingLotes && lotes.length === 0 && (
              <p className="text-amber-600 bg-amber-50 border border-amber-100 text-[10px] p-3 rounded-lg mt-1 font-medium animate-fadeIn">
                ⚠️ Alerta logística: Este material figura con existencias totales en cero (0) en todos los estantes de la clínica. No es posible generar retiros.
              </p>
            )}
          </div>

          {/* INDICADOR EN VIVO DEL STOCK DISPONIBLE */}
          {maxStockDisponible > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-[#148F77] text-[10px] rounded-xl font-bold flex justify-between items-center animate-fadeIn">
              <span>STOCK DISPONIBLE DEL LOTE SELECCIONADO:</span>
              <span className="bg-[#148F77] text-white px-3 py-1 rounded-full font-black">
                {maxStockDisponible} Unidades Max.
              </span>
            </div>
          )}

          {/* 3. MOTIVO DEL RETIRO */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Motivo o Justificación del Retiro *
            </label>
            <select
              required
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all font-semibold"
            >
              <option value="VENCIMIENTO">PRODUCTO EXPIRED / CADUCADO</option>
              <option value="DAÑO / ROTURA">MATERIAL DAÑADO / ROTURA EN ESTANTE</option>
              <option value="CONSUMO CLÍNICO">DESPACHO DIARIO PARA TRATAMIENTOS</option>
              <option value="MERMA DE CONTROL">AJUSTE POR CONTROL INTERNO DE CALIDAD</option>
            </select>
          </div>

          {/* 4. CANTIDAD A RETIRAR */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Cantidad de Unidades a Dar de Baja *
            </label>
            <input
              type="number"
              required
              min="1"
              max={maxStockDisponible || undefined}
              disabled={maxStockDisponible === 0}
              placeholder={maxStockDisponible > 0 ? `Máximo a retirar: ${maxStockDisponible}` : "Ej. 5"}
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all font-semibold disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* BOTÓN CRÍTICO DE EJECUCIÓN */}
          <div className="pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={submitting || maxStockDisponible === 0}
              className={`w-full py-4 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md ${
                submitting || maxStockDisponible === 0
                  ? "bg-gray-300 cursor-not-allowed shadow-none"
                  : "bg-red-500 hover:bg-red-600 shadow-red-900/10"
              }`}
            >
              {submitting ? "Descontando del Almacén..." : "✕ Confirmar Baja del Lote"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
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
      
      // CORREGIDO: Añadimos ?todo=true para mapear la trazabilidad completa, incluso si los lotes quedaron en cero (0)
      const res = await fetch(
        `${API_URL}/inventario/lotes/${selectedMaterialId}?todo=true`,
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
  // 3. DETECTOR: CAMBIO DE LOTE -> CAPTURAR TECHO MÁXIMO DE RETIRO
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

    if (!form.id_lote || !form.cantidad || !form.motivo) {
      setErrorMsg("Todos los campos marcados son obligatorios.");
      return;
    }

    const cantidadRetiro = Number(form.cantidad);

    if (cantidadRetiro <= 0) {
      setErrorMsg("La cantidad a retirar debe ser mayor a cero.");
      return;
    }

    if (cantidadRetiro > maxStockDisponible) {
      setErrorMsg(
        `Operación abortada: No puede retirar ${cantidadRetiro} unidades. El lote seleccionado solo dispone de ${maxStockDisponible} unidades.`
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
        setSuccessMsg(result.message || "Baja registrada. Historial actualizado");

        setForm({
          id_material: "",
          id_lote: "",
          cantidad: "",
          motivo: "VENCIMIENTO",
        });
        setLotes([]);
        setMaxStockDisponible(0);

        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(result.message || "Ocurrió un error al procesar el retiro.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de comunicación con el Servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMateriales) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center text-[#148F77] font-black text-xs uppercase tracking-widest animate-pulse">
        Cargando datos...
      </div>
    );
  }

  // REGLA LOGÍTICA EN CALIENTE: Evaluamos si el material tiene lotes creados pero absolutamente TODOS están en cero
  const tieneLotesPeroTodosAgotados = lotes.length > 0 && lotes.every((l) => Number(l.cantidad_disponible) === 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HEADER DE LA COMPONENTE */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-[#2A5C4D] font-black text-lg uppercase tracking-wide">
          Registrar Salidas
        </h2>
        <p className="text-gray-400 text-xs mt-1">
          En esta sección puedes registrar las salidas o retiros de materiales del inventario. Selecciona el material, el lote específico, la cantidad a retirar y el motivo de la baja.
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
            Detalles de la salida de material
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
              <option value="">-- SELECCIONE MATERIAL --</option>
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
                <option value="">-- No existen registros de lotes históricos para este ítem --</option>
              ) : (
                <>
                  <option value="">-- Seleccione el lote damnificado/a retirar --</option>
                  {lotes.map((l) => (
                    <option key={l.id_lote} value={l.id_lote}>
                      LOTE #{l.id_lote} ➔ STOCK ACTUAL: {l.cantidad_disponible} u. {Number(l.cantidad_disponible) === 0 ? "(AGOTADO)" : ""} | VENCE: {l.fecha_caducidad || "PERMANENTE"} | PROV: {l.nombre_proveedor}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* ERROR A: El material es nuevo y nunca ha tenido un lote registrado en la historia clínica */}
            {form.id_material && !loadingLotes && lotes.length === 0 && (
              <p className="text-amber-600 bg-amber-50 border border-amber-100 text-[10px] p-3 rounded-lg mt-1 font-medium animate-fadeIn">
                ⚠️ Alerta relacional: Este material no cuenta con ningún lote asociado. Primero debe registrar una Entrada (CU26) para asignarle stock y un proveedor base.
              </p>
            )}

            {/* ERROR B: CORREGIDO E INTELIGENTE: Los lotes existen pero están todos vacíos (Saldos en 0) */}
            {form.id_material && !loadingLotes && tieneLotesPeroTodosAgotados && (
              <p className="text-red-600 bg-red-50 border border-red-100 text-[10px] p-3 rounded-lg mt-1 font-medium animate-fadeIn">
                ❌ Alerta de Almacén: Todos los lotes registrados para este insumo se encuentran totalmente AGOTADOS (Stock: 0 u.). Si desea corregir una discrepancia física, utilice el módulo de Ajustar Inventario.
              </p>
            )}
          </div>

          {/* INDICADOR EN VIVO DEL STOCK DISPONIBLE */}
          {form.id_lote && (
            <div className={`p-3 text-[10px] rounded-xl font-bold flex justify-between items-center animate-fadeIn ${
              maxStockDisponible > 0 ? "bg-emerald-50 border border-emerald-200 text-[#148F77]" : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              <span>STOCK EN ESTANTE DEL LOTE SELECCIONADO:</span>
              <span className={`px-3 py-1 rounded-full font-black text-white ${maxStockDisponible > 0 ? "bg-[#148F77]" : "bg-red-500"}`}>
                {maxStockDisponible} Unidades Disponibles
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
              disabled={maxStockDisponible === 0}
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all font-semibold disabled:bg-gray-100"
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
              placeholder={maxStockDisponible > 0 ? `Máximo a retirar: ${maxStockDisponible}` : "Lote sin existencias disponibles"}
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
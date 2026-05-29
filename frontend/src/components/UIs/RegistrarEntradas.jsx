import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/auth_store";

const API_URL = import.meta.env.VITE_API_URL;

export default function RegistrarEntradas() {
  const user = useAuthStore((state) => state.user);

  // Estados de carga de datos maestros
  const [materiales, setMateriales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados de notificaciones
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ==========================================
  // ESTADOS MAEStROS DEL PROVEEDOR EN CALIENTE
  // ==========================================
  const [showProvModal, setShowProvModal] = useState(false);
  const [nuevoProvNombre, setNuevoProvNombre] = useState("");
  const [nuevoProvTelefono, setNuevoProvTelefono] = useState(""); // <-- Nuevo estado para el teléfono
  const [provSubmitting, setProvSubmitting] = useState(false);

  // Estado unificado del Formulario Transaccional (CU26)
  const [form, setForm] = useState({
    id_material: "",
    cantidad: "",
    fecha_fabricacion: "",
    fecha_caducidad: "",
    id_proveedor: "",
  });

  const [isMaterialExpirable, setIsMaterialExpirable] = useState(false);

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

  // Carga de catálogos
  const cargarCatalogosMaster = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [resMat, resProv] = await Promise.all([
        fetch(`${API_URL}/materiales`, getFetchConfig("GET")),
        fetch(`${API_URL}/proveedores`, getFetchConfig("GET")),
      ]);

      const dataMat = await resMat.json();
      const dataProv = await resProv.json();

      if (dataMat.success) setMateriales(dataMat.data);
      if (dataProv.success) setProveedores(dataProv.data);

      if (!dataMat.success || !dataProv.success) {
        setErrorMsg("Ocurrió un error al sincronizar los catálogos de almacén.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error crítico de red al conectar con el servidor logístico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogosMaster();
  }, []);

  const handleMaterialChange = (e) => {
    const selectedId = e.target.value;
    setForm((prev) => ({
      ...prev,
      id_material: selectedId,
      fecha_fabricacion: "",
      fecha_caducidad: "",
    }));

    if (!selectedId) {
      setIsMaterialExpirable(false);
      return;
    }

    const materialSeleccionado = materiales.find(
      (m) => Number(m.id_material) === Number(selectedId)
    );

    if (materialSeleccionado) {
      setIsMaterialExpirable(!!materialSeleccionado.expirable);
    }
  };

  // ==========================================
  // ACCIÓN: GUARDAR PROVEEDOR COMPLETO EN CALIENTE
  // ==========================================
  const handleGuardarProveedorExpress = async (e) => {
    e.preventDefault();
    if (!nuevoProvNombre.trim()) return;

    try {
      setProvSubmitting(true);
      
      const payloadProv = {
        nombre_proveedor: nuevoProvNombre.trim(),
        telefono: nuevoProvTelefono.trim() || null // Si está vacío se manda null
      };

      const res = await fetch(`${API_URL}/proveedores`, getFetchConfig("POST", payloadProv));
      const result = await res.json();

      if (result.success) {
        // Refrescar combo
        const resProv = await fetch(`${API_URL}/proveedores`, getFetchConfig("GET"));
        const dataProv = await resProv.json();
        if (dataProv.success) setProveedores(dataProv.data);

        // Limpieza y cierre
        setNuevoProvNombre("");
        setNuevoProvTelefono("");
        setShowProvModal(false);
        setSuccessMsg("Proveedor añadido al catálogo correctamente");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(result.message || "No se pudo registrar al proveedor");
      }
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor maestro de proveedores");
    } finally {
      setProvSubmitting(false);
    }
  };

  // Enviar Transacción Entrada
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.id_material || !form.cantidad) {
      setErrorMsg("El material y la cantidad son requeridos de forma obligatoria.");
      return;
    }

    if (Number(form.cantidad) <= 0) {
      setErrorMsg("La cantidad de ingresos físicos debe ser mayor a cero.");
      return;
    }

    if (isMaterialExpirable && (!form.fecha_fabricacion || !form.fecha_caducidad)) {
      setErrorMsg("Este insumo está catalogado como EXPIRABLE. Debe ingresar fechas de lote.");
      return;
    }

    setSubmitting(true);

    const payload = {
      id_material: Number(form.id_material),
      cantidad: Number(form.cantidad),
      fecha_fabricacion: isMaterialExpirable && form.fecha_fabricacion ? form.fecha_fabricacion : null,
      fecha_caducidad: isMaterialExpirable && form.fecha_caducidad ? form.fecha_caducidad : null,
      id_proveedor: form.id_proveedor ? Number(form.id_proveedor) : null,
    };

    try {
      const res = await fetch(`${API_URL}/inventario/entrada`, getFetchConfig("POST", payload));
      const result = await res.json();

      if (result.success) {
        setSuccessMsg(result.message || "Lote ingresado y Kardex actualizado con éxito.");
        setForm({
          id_material: "",
          cantidad: "",
          fecha_fabricacion: "",
          fecha_caducidad: "",
          id_proveedor: "",
        });
        setIsMaterialExpirable(false);
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(result.message || "No se pudo procesar la entrada de almacén.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de comunicación con la API del Servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center text-[#148F77] font-black text-xs uppercase tracking-widest animate-pulse">
        Sincronizando registros y almacenes maestros de la clínica...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-[#2A5C4D] font-black text-lg uppercase tracking-wide">
          Registrar Entrada a Almacén
        </h2>
        <p className="text-gray-400 text-xs mt-1">
          Módulo Transaccional para Abastecimiento de Lotes y Auditoría de Kardex (CU26)
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

      {/* FORMULARIO CARD */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-6 bg-gray-50/50 border-b border-gray-100">
          <h3 className="text-[#2A5C4D] font-black text-xs uppercase tracking-widest">
            Ficha de Recepción de Mercadería
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* SELECT MATERIALES */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Seleccionar Material o Insumo *
            </label>
            <select
              required
              value={form.id_material}
              onChange={handleMaterialChange}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all uppercase font-semibold"
            >
              <option value="">-- Seleccione un elemento del catálogo --</option>
              {materiales.map((m) => (
                <option key={m.id_material} value={m.id_material}>
                  {m.nombre_material} {m.expirable ? "(Expirable)" : "(Permanente)"}
                </option>
              ))}
            </select>
          </div>

          {/* CANTIDAD */}
          <div className="space-y-1">
            <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
              Cantidad de Unidades a Registrar (Monto Físico) *
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="Ej. 100"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all font-semibold"
            />
          </div>

          {/* FECHAS CONDICIONALES */}
          {isMaterialExpirable && (
            <div className="p-5 bg-amber-50/40 rounded-2xl border border-amber-100/70 space-y-4 animate-fadeIn">
              <div className="border-b border-amber-100/50 pb-2">
                <h4 className="text-amber-700 font-black text-[10px] uppercase tracking-wider">
                  ⚠️ Control Obligatorio de Trazabilidad Sanitaria
                </h4>
                <p className="text-amber-600/80 text-[10px] mt-0.5">
                  Este insumo requiere control de caducidad por disposición regulatoria clínica.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-amber-800 font-black text-[9px] uppercase tracking-widest">
                    Fecha de Fabricación *
                  </label>
                  <input
                    type="date"
                    required={isMaterialExpirable}
                    value={form.fecha_fabricacion}
                    onChange={(e) => setForm({ ...form, fecha_fabricacion: e.target.value })}
                    className="w-full bg-white border border-amber-200 text-gray-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#148F77] transition-all font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-amber-800 font-black text-[9px] uppercase tracking-widest">
                    Fecha de Vencimiento / Caducidad *
                  </label>
                  <input
                    type="date"
                    required={isMaterialExpirable}
                    value={form.fecha_caducidad}
                    onChange={(e) => setForm({ ...form, fecha_caducidad: e.target.value })}
                    className="w-full bg-white border border-amber-200 text-gray-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#148F77] transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SELECT PROVEEDORES + BOTÓN EN CALIENTE */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
                Proveedor Distribuidor (Opcional)
              </label>
              <button
                type="button"
                onClick={() => setShowProvModal(true)}
                className="text-[#148F77] bg-emerald-50 hover:bg-emerald-100 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-md border border-emerald-100 transition-all"
              >
                + Añadir Nuevo
              </button>
            </div>
            <select
              value={form.id_proveedor}
              onChange={(e) => setForm({ ...form, id_proveedor: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all uppercase font-semibold"
            >
              <option value="">-- Sin proveedor asignado (Ingreso Directo) --</option>
              {proveedores.map((p) => (
                <option key={p.id_proveedor} value={p.id_proveedor}>
                  {p.nombre_proveedor} {p.telefono ? `(${p.telefono})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* BOTÓN REGISTRAR ENTRADA */}
          <div className="pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md ${
                submitting ? "bg-gray-300 cursor-not-allowed" : "bg-[#148F77] hover:bg-[#117A65]"
              }`}
            >
              {submitting ? "Procesando Asiento en Kardex..." : "✓ Confirmar Entrada Física"}
            </button>
          </div>
        </form>
      </div>

      {/* ==========================================
      MODAL INTERNO EXPRESS PARA PROVEEDOR (ACTUALIZADO)
      ========================================== */}
      {showProvModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-[#2A5C4D] font-black text-[10px] uppercase tracking-widest">
                Registrar Proveedor Express
              </h4>
              <button
                type="button"
                onClick={() => setShowProvModal(false)}
                className="text-gray-400 hover:text-red-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleGuardarProveedorExpress} className="p-6 space-y-4">
              
              {/* CAMPO NOMBRE */}
              <div className="space-y-1">
                <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
                  Nombre de la Empresa / Distribuidor *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50} // Evita romper el VARCHAR(50) de tu BD
                  placeholder="Ej. DENTAL BOLIVIA SRL"
                  value={nuevoProvNombre}
                  onChange={(e) => setNuevoProvNombre(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all uppercase font-semibold"
                />
                <span className="text-gray-300 text-[8px] block text-right font-medium">
                  {nuevoProvNombre.length}/50 caracteres
                </span>
              </div>

              {/* CAMPO TELÉFONO */}
              <div className="space-y-1">
                <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
                  Teléfono de Contacto (Opcional)
                </label>
                <input
                  type="text"
                  maxLength={20} // Respeta el VARCHAR(20) de tu BD
                  placeholder="Ej. 77012345 o 3345566"
                  value={nuevoProvTelefono}
                  onChange={(e) => setNuevoProvTelefono(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all font-semibold"
                />
              </div>

              {/* ACCIONES */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProvModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={provSubmitting || !nuevoProvNombre.trim()}
                  className="flex-1 py-3 bg-[#148F77] text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#117A65] disabled:bg-gray-200 transition-all"
                >
                  {provSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
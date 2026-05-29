import { useState, useEffect, Fragment } from "react"; // <-- Adición: Importamos Fragment para manejar filas compuestas
import { useAuthStore } from "../../store/auth_store";

const API_URL = import.meta.env.VITE_API_URL;

export default function ModuloInventario() {
  const user = useAuthStore((state) => state.user);

  // Estados del catálogo maestro
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ==========================================
  // NUEVOS ESTADOS PARA VISTA MAESTRO-DETALLE
  // ==========================================
  const [expandedMaterialId, setExpandedMaterialId] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  // Estados del Modal (Crear / Editar)
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  
  // Estado del Formulario
  const [form, setForm] = useState({
    nombre_material: "",
    precio: "",
    expirable: false,
  });

  // Configuración de cabeceras seguras (IDEM a Panel.jsx)
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
  // 1. OBTENER MATERIALES (READ MAESTRO)
  // ==========================================
  const fetchMateriales = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch(`${API_URL}/materiales`, getFetchConfig("GET"));
      const result = await res.json();
      
      if (result.success) {
        setMateriales(result.data);
      } else {
        setErrorMsg(result.message || "Error al cargar materiales");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("No se pudo conectar con el servidor de inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriales();
  }, []);

  // ==========================================
  // NUEVA ACCIÓN: CONSULTAR LOTES EN TIEMPO REAL
  // ==========================================
  const handleToggleLotes = async (id_material) => {
    // Si el usuario vuelve a hacer clic en el que ya está abierto, lo cerramos
    if (expandedMaterialId === id_material) {
      setExpandedMaterialId(null);
      setLotes([]);
      return;
    }

    try {
      setExpandedMaterialId(id_material);
      setLoadingLotes(true);
      setLotes([]); // Limpiamos el caché anterior para evitar flasheos de datos
      setErrorMsg("");

      // Reutilizamos de forma inteligente el endpoint de trazabilidad por ID material
      const res = await fetch(`${API_URL}/inventario/lotes/${id_material}`, getFetchConfig("GET"));
      const result = await res.json();

      if (result.success) {
        setLotes(result.data);
      } else {
        setErrorMsg(result.message || "No se pudo recuperar el desglose de existencias.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de comunicación al consultar lotes del servidor.");
    } finally {
      setLoadingLotes(false);
    }
  };

  // ==========================================
  // 2. MANEJADORES DE MODAL & FORM
  // ==========================================
  const handleOpenAdd = () => {
    setEditingMaterial(null);
    setForm({ nombre_material: "", precio: "", expirable: false });
    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  const handleOpenEdit = (material) => {
    setEditingMaterial(material);
    setForm({
      nombre_material: material.nombre_material,
      precio: material.precio,
      expirable: material.expirable,
    });
    setErrorMsg("");
    setSuccessMsg("");
    setShowModal(true);
  };

  // ==========================================
  // 3. GUARDAR CAMBIOS (CREATE / UPDATE)
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.nombre_material || !form.precio) {
      setErrorMsg("Por favor, rellena todos los campos obligatorios.");
      return;
    }

    const payload = {
      ...form,
      precio: Number(form.precio)
    };

    try {
      let res;
      if (editingMaterial) {
        res = await fetch(
          `${API_URL}/materiales/${editingMaterial.id_material}`,
          getFetchConfig("PUT", payload)
        );
      } else {
        res = await fetch(`${API_URL}/materiales`, getFetchConfig("POST", payload));
      }

      const result = await res.json();

      if (result.success) {
        setSuccessMsg(result.message || "Operación procesada correctamente");
        fetchMateriales(); 
        
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg("");
        }, 1500);
      } else {
        setErrorMsg(result.message || "Ocurrió un error en la transacción");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de comunicación con la API del Backend");
    }
  };

  // ==========================================
  // 4. ELIMINAR MATERIAL (DELETE)
  // ==========================================
  const handleDelete = async (id_material) => {
    if (!window.confirm("¿Estás seguro de eliminar este material del catálogo maestro?")) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(
        `${API_URL}/materiales/${id_material}`,
        getFetchConfig("DELETE")
      );
      const result = await res.json();

      if (result.success) {
        setSuccessMsg(result.message || "Insumo dado de baja del catálogo");
        if (expandedMaterialId === id_material) setExpandedMaterialId(null);
        fetchMateriales();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(result.message || "No se pudo eliminar el insumo.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al intentar procesar la baja en el servidor.");
    }
  };

  // Filtro reactivo en la UI
  const filteredMateriales = materiales.filter((m) =>
    m.nombre_material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculo dinámico en caliente del stock total del acordeón abierto
  const totalStockAcordeon = lotes.reduce((acc, curr) => acc + Number(curr.cantidad_disponible), 0);

  return (
    <div className="space-y-6">
      {/* SECCIÓN CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-[#2A5C4D] font-black text-lg uppercase tracking-wide">
            Catálogo Maestro de Insumos
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Módulo de Configuración Base del Inventario de la Clínica (CU14)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#148F77] text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-2xl hover:bg-[#117A65] transition-all shadow-md shadow-emerald-900/10"
        >
          + Registrar Insumo
        </button>
      </div>

      {/* BANNER DE NOTIFICACIONES */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-[#148F77] text-xs font-bold px-4 py-3 rounded-xl shadow-sm">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-3 rounded-xl shadow-sm">
          ⚠ {errorMsg}
        </div>
      )}

      {/* FILTRADO */}
      <div className="w-full md:w-96">
        <input
          type="text"
          placeholder="Buscar material por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-200 text-gray-700 text-xs px-5 py-3.5 rounded-2xl focus:outline-none focus:border-[#148F77] focus:ring-1 focus:ring-[#148F77] transition-all shadow-sm"
        />
      </div>

      {/* GRILLA PRINCIPAL MAESTRO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#148F77] font-bold text-xs uppercase tracking-widest animate-pulse">
            Sincronizando grilla de materiales...
          </div>
        ) : filteredMateriales.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs font-medium">
            No se encontraron materiales registrados en el inventario.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Descripción del Material</th>
                  <th className="py-4 px-6">Precio Catálogo</th>
                  <th className="py-4 px-6 text-center">Tratamiento Expirable</th>
                  <th className="py-4 px-6 text-right">Operaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredMateriales.map((m) => (
                  <Fragment key={m.id_material}>
                    {/* FILA MAESTRO (DATOS DEL INSUMO) */}
                    <tr className={`hover:bg-gray-50/40 transition-colors text-gray-700 font-medium ${expandedMaterialId === m.id_material ? "bg-emerald-50/10" : ""}`}>
                      <td className="py-4 px-6 text-gray-400 font-bold">#{m.id_material}</td>
                      <td className="py-4 px-6 font-bold text-[#2A5C4D] uppercase">{m.nombre_material}</td>
                      <td className="py-4 px-6 font-semibold text-gray-600">Bs. {m.precio.toFixed(2)}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${m.expirable ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                          {m.expirable ? "Sí (Monitoreado)" : "No (Permanente)"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {/* NUEVO BOTÓN INTERACTIVO "VER STOCK" */}
                        <button
                          onClick={() => handleToggleLotes(m.id_material)}
                          className={`font-bold px-3 py-1.5 rounded-xl border transition-all text-[11px] ${
                            expandedMaterialId === m.id_material
                              ? "bg-[#148F77] text-white border-[#148F77]"
                              : "text-[#148F77] hover:bg-emerald-50 border-emerald-100"
                          }`}
                        >
                          {expandedMaterialId === m.id_material ? "✕ Ocultar" : "📦 Ver Stock"}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="text-gray-500 hover:bg-gray-100 font-bold px-3 py-1.5 rounded-xl border border-gray-100 transition-all text-[11px]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(m.id_material)}
                          className="text-red-400 hover:bg-red-50 font-bold px-3 py-1.5 rounded-xl border border-red-50 transition-all text-[11px]"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>

                    {/* FILA DETALLE (DESGLOSE COMPLETO DE LOTES RECIBIDOS) */}
                    {expandedMaterialId === m.id_material && (
                      <tr>
                        <td colSpan="5" className="bg-gray-50/60 px-8 py-5 border-y border-gray-100">
                          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-inner space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                              <h4 className="text-[#2A5C4D] font-black text-[10px] uppercase tracking-widest">
                                Desglosado de Existencias Reales en Estantes
                              </h4>
                              <span className="text-[9px] font-black uppercase bg-gray-100 text-gray-500 px-3 py-1 rounded-md">
                                Trazabilidad Interna (Kardex)
                              </span>
                            </div>

                            {loadingLotes ? (
                              <div className="text-center py-6 text-[#148F77] font-bold text-[11px] uppercase tracking-widest animate-pulse">
                                Consultando balances físicos en t_materiales_almacen...
                              </div>
                            ) : lotes.length === 0 ? (
                              <div className="text-center py-6 text-gray-400 font-medium text-[11px]">
                                ⚠️ No se detectan lotes activos ni stock físico registrado para este insumo. (Existencias: 0 unidades).
                              </div>
                            ) : (
                              <div className="overflow-hidden rounded-xl border border-gray-50">
                                <table className="w-full text-left text-[11px]">
                                  <thead>
                                    <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                      <th className="py-2.5 px-4">Código Lote</th>
                                      <th className="py-2.5 px-4">Cantidad Disponible</th>
                                      <th className="py-2.5 px-4">F. Fabricación</th>
                                      <th className="py-2.5 px-4">F. Vencimiento</th>
                                      <th className="py-2.5 px-4">Proveedor Procedencia</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 font-medium text-gray-600">
                                    {lotes.map((l) => (
                                      <tr key={l.id_lote} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-4 font-bold text-gray-400">LOTE #{l.id_lote}</td>
                                        <td className="py-3 px-4">
                                          <span className="bg-emerald-50 text-[#148F77] font-black px-2.5 py-1 rounded-md border border-emerald-100">
                                            {l.cantidad_disponible} unidades
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">{l.fecha_fabricacion || "N/A"}</td>
                                        <td className="py-3 px-4">
                                          {l.fecha_caducidad ? (
                                            <span className="text-amber-700 font-semibold">{l.fecha_caducidad}</span>
                                          ) : (
                                            <span className="text-blue-600 font-bold text-[9px] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">PERMANENTE</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-[#2A5C4D] font-bold uppercase">{l.nombre_proveedor}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                
                                {/* RESUMEN DE CONCILIACIÓN FÍSICA AL PIE */}
                                <div className="bg-gray-50/80 p-3 flex justify-between items-center px-4 border-t border-gray-100 font-bold text-xs">
                                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Existencias Totales Consolidadas:</span>
                                  <span className="text-[#148F77] font-black text-sm bg-white px-4 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                                    {totalStockAcordeon} u. en Almacén
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL TRANSACCIONAL (AGREGAR / MODIFICAR) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden transform scale-100 transition-transform">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-[#2A5C4D] font-black text-xs uppercase tracking-widest">
                {editingMaterial ? "Modificar Ficha de Material" : "Alta de Insumo Clínico"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-red-500 font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
                  Nombre o Descripción del Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. RESINA FLUIDA 3M REFILL"
                  value={form.nombre_material}
                  onChange={(e) => setForm({ ...form, nombre_material: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 text-gray-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all uppercase font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
                  Precio Base de Catálogo (Bs.) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="0.00"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 text-gray-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#148F77] focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="text-[#2A5C4D] font-bold text-xs">¿Insumo Expirable o Perecedero?</h4>
                  <p className="text-gray-400 text-[10px] mt-0.5">Controlará lotes y fechas de vencimiento</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.expirable}
                    onChange={(e) => setForm({ ...form, expirable: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#148F77]"></div>
                </label>
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#148F77] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#117A65] transition-all shadow-md shadow-emerald-900/10"
                >
                  {editingMaterial ? "Guardar Cambios" : "Confirmar Alta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
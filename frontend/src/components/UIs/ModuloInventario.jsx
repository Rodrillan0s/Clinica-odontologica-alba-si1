import { useState, useEffect, Fragment } from "react"; 
import { useAuthStore } from "../../store/auth_store";

const API_URL = import.meta.env.VITE_API_URL;

export default function ModuloInventario() {
  const user = useAuthStore((state) => state.user);

  // Estados del catálogo maestro e hilos de carga ordinarios
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ==========================================
  // ESTADOS NUEVOS: CONTROL ANALÍTICO Y TABS
  // ==========================================
  const [activeTab, setActiveTab] = useState("catalogo"); // "catalogo" o "reportes"
  const [reportType, setReportType] = useState("general");
  const [reportColumns, setReportColumns] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);

  // Estados para vista Maestro-Detalle (Acordeón de Lotes)
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
      setErrorMsg("No se pudo conectar con el servidor!");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMateriales();
  }, []);

  // ==========================================
  // 2. CARGA REACTIVA DEL REPORTE SELECCIONADO
  // ==========================================
  const cargarDatosDelReporte = async (tipo) => {
    try {
      setLoadingReport(true);
      setErrorMsg("");
      const res = await fetch(`${API_URL}/inventario/reportes?tipo=${tipo}`, getFetchConfig("GET"));
      const result = await res.json();

      if (result.success) {
        setReportColumns(result.columns);
        setReportData(result.data);
      } else {
        setErrorMsg(result.message || "Error al cargar los datos del reporte.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al cargar los datos del reporte.");
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reportes") {
      cargarDatosDelReporte(reportType);
    }
  }, [activeTab, reportType]);

  // Handler estratégico para exportar hojas de cálculo
  const handleExportarExcel = () => {
    window.open(`${API_URL}/inventario/reportes/exportar?tipo=${reportType}&token=${localStorage.getItem("token")}`, "_blank");
  };

  // 3. ACCIÓN: CONSULTAR LOTES EN TIEMPO REAL
  const handleToggleLotes = async (id_material) => {
    if (expandedMaterialId === id_material) {
      setExpandedMaterialId(null);
      setLotes([]);
      return;
    }

    try {
      setExpandedMaterialId(id_material);
      setLoadingLotes(true);
      setLotes([]); 
      setErrorMsg("");

      const res = await fetch(`${API_URL}/inventario/lotes/${id_material}?todo=true`, getFetchConfig("GET"));
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


  // 4. MANEJADORES DE MODAL & FORM
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


  // 5. GUARDAR CAMBIOS (CREATE / UPDATE)
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


  // 6. ELIMINAR MATERIAL (DELETE)
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

  const filteredMateriales = materiales.filter((m) =>
    m.nombre_material.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalStockAcordeon = lotes.reduce((acc, curr) => acc + Number(curr.cantidad_disponible), 0);

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN CABECERA - Se oculta en impresión automatizada (print:hidden) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:hidden">
        <div>
          <h2 className="text-[#2A5C4D] font-black text-lg uppercase tracking-wide">
            INVENTARIO CLÍNICO 
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Gestiona el inventario de materiales y suministros de la clínica, controla existencias, monitorea lotes y genera reportes
          </p>
        </div>
        
        {/* INTERRUPTOR PREMIUM DE VISTAS (TABS LOGÍSTICOS) */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl gap-2">
          <button
            onClick={() => setActiveTab("catalogo")}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "catalogo" ? "bg-white text-[#148F77] shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            GESTIÓN DE INVENTARIO
          </button>
          <button
            onClick={() => setActiveTab("reportes")}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === "reportes" ? "bg-white text-[#148F77] shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            REPORTE DE INVENTARIO
          </button>
        </div>
      </div>

      {/* BANNER DE NOTIFICACIONES REACTIVAS - Ocultas en PDF */}
      {(successMsg || errorMsg) && (
        <div className="print:hidden">
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
        </div>
      )}

      {/* =========================================================
          DESPLIEGUE PESTAÑA A: CRUD ORIGINAL + MAESTRO DETALLE
          ========================================================= */}
      {activeTab === "catalogo" && (
        <div className="space-y-6 animate-fadeIn print:hidden">
          
          {/* FILTRADO Y ALTA */}
          <div className="flex justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Buscar material por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 bg-white border border-gray-200 text-gray-700 text-xs px-5 py-3.5 rounded-2xl focus:outline-none focus:border-[#148F77] transition-all shadow-sm"
            />
            <button
              onClick={handleOpenAdd}
              className="bg-[#148F77] text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-2xl hover:bg-[#117A65] transition-all shadow-md"
            >
              + Registrar Insumo
            </button>
          </div>

          {/* GRILLA PRINCIPAL */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-[#148F77] font-bold text-xs uppercase tracking-widest animate-pulse">
                  Cargando materiales registrados en el inventario...
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
                      <th className="py-4 px-6 text-center">Insumo Expirable</th>
                      <th className="py-4 px-6 text-right">Operaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {filteredMateriales.map((m) => (
                      <Fragment key={m.id_material}>
                        {/* FILA MAESTRO */}
                        <tr className={`hover:bg-gray-50/40 transition-colors text-gray-700 font-medium ${expandedMaterialId === m.id_material ? "bg-emerald-50/10" : ""}`}>
                          <td className="py-4 px-6 text-gray-400 font-bold">#{m.id_material}</td>
                          <td className="py-4 px-6 font-bold text-[#2A5C4D] uppercase">{m.nombre_material}</td>
                          <td className="py-4 px-6 font-semibold text-gray-600">Bs. {m.precio.toFixed(2)}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${m.expirable ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                              {m.expirable ? "SI" : "NO"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() => handleToggleLotes(m.id_material)}
                              className={`font-bold px-3 py-1.5 rounded-xl border transition-all text-[11px] ${
                                expandedMaterialId === m.id_material
                                  ? "bg-[#148F77] text-white border-[#148F77]"
                                  : "text-[#148F77] hover:bg-emerald-50 border-emerald-100"
                              }`}
                            >
                              {expandedMaterialId === m.id_material ? "✕ OCULTAR" : "VER STOCK"}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="text-gray-500 hover:bg-gray-100 font-bold px-3 py-1.5 rounded-xl border border-gray-100 text-[11px]"
                            >
                              Editar
                        </button>
                            <button
                              onClick={() => handleDelete(m.id_material)}
                              className="text-red-400 hover:bg-red-50 font-bold px-3 py-1.5 rounded-xl border border-red-50 text-[11px]"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>

                        {/* FILA DETALLE DE LOTES */}
                        {expandedMaterialId === m.id_material && (
                          <tr>
                            <td colSpan="5" className="bg-gray-50/60 px-8 py-5 border-y border-gray-100">
                              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-inner space-y-4 animate-fadeIn">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                                  <h4 className="text-[#2A5C4D] font-black text-[10px] uppercase tracking-widest">
                                    Detalle de Lotes y Existencias
                                  </h4>
                                </div>

                                {loadingLotes ? (
                                  <div className="text-center py-6 text-[#148F77] font-bold text-[11px] uppercase tracking-widest animate-pulse">
                                     Consultado existencias...
                                  </div>
                                ) : lotes.length === 0 ? (
                                  <div className="text-center py-6 text-gray-400 font-medium text-[11px]">
                                     No se detectan lotes activos ni stock físico registrado para este insumo. (Existencias: 0 unidades).
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
                                          <th className="py-2.5 px-4">Proveedor</th>
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
                                    
                                    <div className="bg-gray-50/80 p-3 flex justify-between items-center px-4 border-t border-gray-100 font-bold text-xs">
                                      <span className="text-gray-400 uppercase tracking-wider text-[10px]">Existencias Totales:</span>
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
        </div>
      )}

      {/* =========================================================
          DESPLIEGUE PESTAÑA B: CONSOLA DE REPORTES Y DESCARGAS
          ========================================================= */}
      {activeTab === "reportes" && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* BARRA DE CONTROLES - Oculta en PDF de impresión */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm print:hidden">
            <div className="space-y-1 flex-1">
              <label className="text-gray-400 font-black text-[9px] uppercase tracking-widest block">Seleccionar Reporte Especializado</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full max-w-md bg-gray-50 border border-gray-200 text-gray-800 text-xs px-4 py-3 rounded-xl focus:outline-none focus:border-[#148F77] font-bold"
              >
                <option value="general">REPORTE GENERAL DE INVENTARIO (EXISTENCIAS TOTALES)</option>
                <option value="mermas">PRODUCTOS MÁS DAÑADOS Y PÉRDIDAS (PERDIDAS)</option>
                <option value="ingresos"> PRODUCTOS CON MAYOR ROTACIÓN DE INGRESO (COMPRAS)</option>
                <option value="vencimientos"> ALERTA DE LOTES PRÓXIMOS A VENCER</option>
              </select>
            </div>

            {/* ACCIONES DE DESCARGA */}
            <div className="flex gap-3">
              <button
                onClick={handleExportarExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all shadow-md"
              >
                Exportar a Excel
              </button>
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all shadow-md"
              >
                Guardar PDF / Imprimir
              </button>
            </div>
          </div>

          {/* CUADRO EJECUTIVO PRINT-READY */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden p-8 space-y-6 print:border-none print:shadow-none print:p-0">
            
            {/* ENCABEZADO EXCLUSIVO PARA LA HOJA FÍSICA/PDF */}
            <div className="hidden print:flex justify-between items-center border-b-2 border-[#148F77] pb-4">
              <div>
                <h1 className="text-[#2A5C4D] font-black text-xl uppercase tracking-wide">CLÍNICA ODONTOLÓGICA ALBA</h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Módulo de Inventario</p>
              </div>
              <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <div>Emisión: {new Date().toLocaleDateString('es-BO')}</div>
                <div>Auditor: @{user?.nombre_usuario || "ADMINISTRADOR"}</div>
              </div>
            </div>

            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-[#2A5C4D] font-black text-xs uppercase tracking-widest">
                {reportType === "general" && "Consolidado General Histórico de Existencias"}
                {reportType === "mermas" && "Análisis Crítico de Mermas, Pérdidas y Daños en Estante"}
                {reportType === "ingresos" && "Estadística de Abastecimiento y Rotación de Entrada"}
                {reportType === "vencimientos" && "Matriz Epidemiológica de Trazabilidad: Riesgo de Caducidad"}
              </h3>
              <p className="text-gray-400 text-[10px] mt-0.5">Datos de registros en Almacen</p>
            </div>

            {/* TABLA EJECUTIVA DINÁMICA */}
            {loadingReport ? (
              <div className="p-14 text-center text-[#148F77] font-bold text-xs uppercase tracking-widest animate-pulse">
                Procesando...
              </div>
            ) : reportData.length === 0 ? (
              <div className="p-14 text-center text-gray-400 font-medium text-xs">
                 No se encontraron datos para el reporte seleccionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200">
                      {reportColumns.map((col, index) => (
                        <th key={index} className="py-3 px-4">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                    {reportData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-400">{item.id}</td>
                        <td className="py-3.5 px-4 font-bold text-[#2A5C4D] uppercase">{item.descripcion}</td>
                        
                        {/* CÉLULAS SEGÚN TIPO DE INFORME METRICADO */}
                        {reportType === "general" && (
                          <>
                            <td className="py-3.5 px-4 font-semibold">Bs. {item.precio?.toFixed(2)}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black ${item.info_extra === "SÍ" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                                {item.info_extra}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-black text-[#148F77]">{item.metrica_core} unidades</td>
                            <td className="py-3.5 px-4 text-gray-400">{item.conteo_lotes} lotes activos</td>
                          </>
                        )}

                        {reportType === "mermas" && (
                          <>
                            <td className="py-3.5 px-4 font-black text-red-500">-{item.metrica_core} u.</td>
                            <td className="py-3.5 px-4 text-gray-400 font-bold uppercase">{item.info_extra}</td>
                            <td className="py-3.5 px-4">Bs. {item.precio?.toFixed(2)}</td>
                            <td className="py-3.5 px-4 font-black text-red-600 bg-red-50/60 px-3 rounded-lg">Bs. {item.costo_total?.toFixed(2)}</td>
                          </>
                        )}

                        {reportType === "ingresos" && (
                          <>
                            <td className="py-3.5 px-4 font-black text-emerald-600">+{item.metrica_core} u.</td>
                            <td className="py-3.5 px-4 text-gray-400 font-bold uppercase">{item.info_extra}</td>
                            <td className="py-3.5 px-4 text-[#148F77] font-semibold">{item.fecha_ref}</td>
                          </>
                        )}

                        {reportType === "vencimientos" && (
                          <>
                            <td className="py-3.5 px-4 font-black text-amber-600 bg-amber-50 px-2 rounded-lg">{item.metrica_core} u. en riesgo</td>
                            <td className="py-3.5 px-4 text-amber-700 font-black tracking-wide">{item.fecha_ref}</td>
                            <td className="py-3.5 px-4 text-gray-400 font-bold uppercase">{item.info_extra}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SELLO DE CONTROL SANITARIO REQUERIDO PARA FIRMA EN PDF */}
            <div className="hidden print:flex justify-between items-center pt-24">
              <div className="w-48 border-t border-gray-400 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">Encargado de Logística</div>
              <div className="w-48 border-t border-gray-400 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">Dirección Médica</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRANSACCIONAL (AGREGAR / MODIFICAR) - Bloqueado en PDF */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn print:hidden">
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
                  <h4 className="text-[#2A5C4D] font-bold text-xs">¿Insumo Expirable?</h4>
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
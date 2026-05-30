import React, { useState } from "react";
import { useAuthStore } from "../../store/auth_store";
import {
  ESTADO_CITA,
  ESTADO_CITA_LABELS,
  ESTADO_CITA_COLORS,
} from "../../constants/enums";

export default function ReporteCitas({ dataMaster, user }) {
  // Estados para filtros
  const [selectedOdontologo, setSelectedOdontologo] = useState("");

  const [pacienteSearch, setPacienteSearch] = useState(
    user?.rol >= 5 ? user?.nombre || user?.nombre_usuario || "Mi Perfil" : "",
  );
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState(
    user?.rol >= 5 ? user?.id_persona || "" : "",
  );

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Estados del reporte
  const [reportType, setReportType] = useState("pacientes");
  const [reportData, setReportData] = useState([]);
  const [reportStats, setReportStats] = useState({});
  const [totalCitas, setTotalCitas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const pacientesFiltrados = (dataMaster?.pacientes || []).filter((p) =>
    p.nombre?.toLowerCase().includes(pacienteSearch.toLowerCase()),
  );

  const generarReporte = async () => {
    if (reportType === "odontologos" && !selectedOdontologo) {
      setErrorMessage(
        "Por favor, selecciona un odontólogo para generar su historial.",
      );
      setReportData([]);
      return;
    }

    if (reportType === "pacientes" && !selectedPacienteId) {
      setErrorMessage(
        "Por favor, selecciona un paciente para generar su historial.",
      );
      setReportData([]);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      let url =
        reportType === "pacientes"
          ? `${API_URL}/citas/reporte_paciente`
          : `${API_URL}/citas/reporte_odontologo`;

      const params = new URLSearchParams();

      if (reportType === "pacientes") {
        params.append("id_paciente", selectedPacienteId);
      } else {
        params.append("id_odontologo", selectedOdontologo);
      }

      if (fechaInicio) params.append("fecha_agen_desde", fechaInicio);
      if (fechaFin) params.append("fecha_agen_hasta", fechaFin);
      params.append("limit", 1000); // Para traer un historial amplio en el reporte

      const res = await fetch(`${url}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();

      if (data.success) {
        const mappedData = data.data.map((row) => {
          const odon = dataMaster?.odontologos?.find(
            (o) =>
              String(o.id) === String(row.id_personal) ||
              String(o.id_personal) === String(row.id_personal),
          );
          return {
            id_cita: row.id_cita,
            fecha_agendamiento: row.fecha_agendamiento,
            odontologo_nombre: odon ? odon.nombre : "Desconocido",
            nombre_estado: row.nombre_estado,
            procedimientos: row.cita_obs || "Sin observaciones registradas",
          };
        });

        setReportData(mappedData);
        setReportStats(data.stats || {});
        setTotalCitas(data.total || 0);

        if (mappedData.length === 0) {
          setErrorMessage(
            reportType === "pacientes"
              ? "El paciente no tiene citas registradas en su historial."
              : "El odontólogo no tiene citas registradas en el periodo especificado.",
          );
        }
      } else {
        setErrorMessage(data.message || "Error al obtener el reporte.");
        setReportData([]);
        setReportStats({});
        setTotalCitas(0);
      }
    } catch (err) {
      setErrorMessage("Error de conexión al obtener el reporte.");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarExcel = () => {
    if (reportData.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    // 1. Resumen Estadístico
    const summaryRows = [
      ["RESUMEN DE CITAS"],
      ["Total General", totalCitas],
      ...Object.entries(reportStats).map(([estado, cantidad]) => [
        estado,
        cantidad,
      ]),
      [], // Línea en blanco
      ["DETALLE DE CITAS"],
    ];

    // 2. Cabeceras
    const headers = [
      "NRO CITA",
      "FECHA AGENDAMIENTO",
      "ESTADO",
      "ODONTOLOGO",
      "OBSERVACIONES",
    ];

    // 3. Filas de datos
    const rows = reportData.map((row) => [
      row.id_cita,
      row.fecha_agendamiento || "N/A",
      row.nombre_estado,
      row.odontologo_nombre,
      row.procedimientos || "Sin observaciones",
    ]);

    // 4. Combinar todo separando por punto y coma (formato estándar para Excel en español)
    const csvContent = [
      ...summaryRows.map((r) => r.join(";")),
      headers.join(";"),
      ...rows.map((r) => r.join(";")),
    ].join("\n");

    // 4. Crear un Blob con codificación UTF-8 y BOM (\uFEFF) para que Excel reconozca tildes y caracteres especiales
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    // 5. Descargar automáticamente
    const link = document.createElement("a");
    link.href = url;
    const identifier =
      reportType === "pacientes" ? selectedPacienteId : selectedOdontologo;
    link.setAttribute(
      "download",
      `Reporte_Citas_${reportType}_${identifier || "General"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-emerald-50 relative overflow-hidden print:border-none print:shadow-none print-section">
      <div className="flex bg-emerald-50/50 border-b border-gray-100 px-6 lg:px-8 print:hidden">
        <button
          onClick={() => {
            setReportType("pacientes");
            setReportData([]);
            setErrorMessage("");
          }}
          className={`px-4 py-4 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${
            reportType === "pacientes"
              ? "border-[#148F77] text-[#148F77]"
              : "border-transparent text-gray-400 hover:text-[#148F77]"
          }`}
        >
          Historial cita de pacientes
        </button>
        <button
          onClick={() => {
            setReportType("odontologos");
            setReportData([]);
            setErrorMessage("");
          }}
          className={`px-4 py-4 text-xs font-black uppercase tracking-widest transition-colors border-b-2 ${
            reportType === "odontologos"
              ? "border-[#148F77] text-[#148F77]"
              : "border-transparent text-gray-400 hover:text-[#148F77]"
          }`}
        >
          Historial cita de odontólogos
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 lg:p-8 border-b border-gray-50 bg-gray-50/30 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-[#2A5C4D]">Reportes</h2>
          <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">
            {reportType === "pacientes"
              ? "Filtra y visualiza el historial de un paciente"
              : "Filtra y visualiza el historial de un odontólogo"}
          </p>
        </div>
        <button
          onClick={generarReporte}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-3 bg-[#148F77] text-white text-sm font-bold rounded-xl transition-all shadow-sm ${
            loading
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-[#0f6b59] hover:-translate-y-0.5"
          }`}
        >
          {loading ? "Generando..." : "Generar Reporte"}
        </button>
      </div>

      <div className="p-6 lg:p-8 print:p-0">
        <div className="max-w-7xl mx-auto">
          {/* ENCABEZADO EXCLUSIVO PARA LA HOJA FÍSICA/PDF */}
          <div className="hidden print:flex flex-col mb-8">
            <div className="flex justify-between items-end border-b-2 border-[#148F77] pb-4 mb-4">
              <div>
                <h1 className="text-[#2A5C4D] font-black text-xl uppercase tracking-wide">
                  CLÍNICA ODONTOLÓGICA ALBA
                </h1>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  {reportType === "pacientes"
                    ? "Reporte de Historial de Paciente"
                    : "Reporte de Historial de Odontólogo"}
                </p>
              </div>
              <div className="text-right text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <div>Emisión: {new Date().toLocaleDateString("es-BO")}</div>
              </div>
            </div>

            {reportType === "pacientes" && (
              <div className="text-xs text-gray-600 font-medium mb-4">
                <p>
                  <strong>Paciente Seleccionado:</strong>{" "}
                  {dataMaster?.pacientes?.find(
                    (p) => p.id === parseInt(selectedPacienteId),
                  )?.nombre ||
                    selectedPacienteId ||
                    "N/A"}
                </p>
                {(fechaInicio || fechaFin) && (
                  <p>
                    <strong>Periodo:</strong>{" "}
                    {fechaInicio ? fechaInicio : "Histórico"} al{" "}
                    {fechaFin ? fechaFin : "Presente"}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mb-8 print:hidden">
            {reportType === "pacientes" && (
              <div className="w-full sm:w-1/3 relative">
                <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                  Paciente
                </label>
                <input
                  type="text"
                  disabled={user?.rol >= 5}
                  placeholder="Buscar paciente por nombre..."
                  className={`w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors ${user?.rol >= 5 ? "bg-gray-100 cursor-not-allowed opacity-70" : "bg-gray-50"}`}
                  value={pacienteSearch}
                  onChange={(e) => {
                    setPacienteSearch(e.target.value);
                    setShowPacienteDropdown(true);
                    if (e.target.value === "") {
                      setSelectedPacienteId("");
                    }
                  }}
                  onFocus={() => setShowPacienteDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowPacienteDropdown(false), 200)
                  }
                />
                {showPacienteDropdown && (
                  <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                    {pacientesFiltrados.length > 0 ? (
                      pacientesFiltrados.map((p) => (
                        <li
                          key={p.id_persona || p.id_usuario || p.id}
                          className="p-4 text-xs font-bold text-gray-600 hover:bg-emerald-50 hover:text-[#148F77] cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                          onMouseDown={() => {
                            setSelectedPacienteId(
                              p.id_persona || p.id_usuario || p.id,
                            );
                            setPacienteSearch(p.nombre);
                            setShowPacienteDropdown(false);
                          }}
                        >
                          {p.nombre}
                        </li>
                      ))
                    ) : (
                      <li className="p-4 text-xs text-gray-400 text-center italic">
                        No se encontraron pacientes
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}

            {reportType === "odontologos" && (
              <>
                <div className="w-full sm:w-1/3">
                  <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                    Odontólogo
                  </label>
                  <div className="relative">
                    <select
                      value={selectedOdontologo}
                      onChange={(e) => setSelectedOdontologo(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Todos los odontólogos</option>
                      {dataMaster?.odontologos?.map((odon) => (
                        <option
                          key={odon.id_personal || odon.id}
                          value={odon.id_personal || odon.id}
                        >
                          {odon.nombre}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      ▼
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="w-full sm:w-1/3 relative">
              <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                Desde (Fecha Agend.)
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  placeholder="DD/MM/AA"
                  value={
                    fechaInicio
                      ? (() => {
                          const [y, m, d] = fechaInicio.split("-");
                          return `${d}/${m}/${y.slice(-2)}`;
                        })()
                      : ""
                  }
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] cursor-pointer"
                  onClick={(e) => e.target.nextSibling.showPicker()}
                />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="absolute opacity-0 inset-0 pointer-events-none"
                />
              </div>
            </div>

            <div className="w-full sm:w-1/3 relative">
              <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                Hasta (Fecha Agend.)
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  placeholder="DD/MM/AA"
                  value={
                    fechaFin
                      ? (() => {
                          const [y, m, d] = fechaFin.split("-");
                          return `${d}/${m}/${y.slice(-2)}`;
                        })()
                      : ""
                  }
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] cursor-pointer"
                  onClick={(e) => e.target.nextSibling.showPicker()}
                />
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="absolute opacity-0 inset-0 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCION */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6 pt-6 border-t border-gray-100 print:hidden">
            {/* ACCIONES DE DESCARGA */}
            {reportData.length > 0 && (
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
            )}
          </div>
        </div>

        {/* Aquí va la tabla de reportes */}
        <div className="mt-8 border-t border-gray-100 pt-8 print:mt-0 print:border-none print:pt-0">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-black uppercase rounded-r-xl print:hidden">
              ⚠️ {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-[#148F77] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : reportData.length > 0 ? (
            <div className="space-y-6">
              {/* Tarjetas de Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center shadow-sm">
                  <p className="text-[10px] font-black text-[#148F77] uppercase tracking-widest mb-1">
                    Total
                  </p>
                  <p className="text-3xl font-black text-[#2A5C4D]">
                    {totalCitas}
                  </p>
                </div>

                {Object.entries(reportStats).map(([estado, cantidad]) => (
                  <div
                    key={estado}
                    className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex flex-col justify-center items-center shadow-sm"
                  >
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center truncate w-full">
                      {estado}
                    </p>
                    <p className="text-2xl font-black text-gray-700">
                      {cantidad}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-emerald-50/50">
                    <tr className="border-b-2 border-gray-100">
                      <th className="py-4 px-6 text-[10px] font-black text-[#148F77] uppercase tracking-widest">
                        ID
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-[#148F77] uppercase tracking-widest">
                        Fecha Agendada
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-[#148F77] uppercase tracking-widest">
                        Especialista
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-[#148F77] uppercase tracking-widest">
                        Estado
                      </th>
                      <th className="py-4 px-6 text-[10px] font-black text-[#148F77] uppercase tracking-widest">
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.map((row, index) => (
                      <tr
                        key={row.id_cita}
                        className={`hover:bg-emerald-50/30 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                      >
                        <td className="py-4 px-6 text-xs font-bold text-gray-500">
                          #{row.id_cita}
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-[#2A5C4D]">
                          {row.fecha_agendamiento || "N/A"}
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-700">
                          {row.odontologo_nombre}
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600">
                            {row.nombre_estado}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs font-medium text-gray-600 max-w-xs">
                          {row.procedimientos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-50 print:hidden">
              <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-500 text-center">
                Selecciona una persona y presiona "Generar Reporte" para
                visualizar el historial.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

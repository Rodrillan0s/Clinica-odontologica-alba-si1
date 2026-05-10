import { useState, useEffect, useCallback } from "react";
import DetallesCitas from "./DetallesCitas";
import { ESTADO_CITA, ESTADO_CITA_LABELS, ESTADO_CITA_COLORS } from "../../constants/enums";

const API_URL = import.meta.env.VITE_API_URL;

export default function AgendaCitas({ onClose, dataMaster, user }) {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedOdontologo, setSelectedOdontologo] = useState("");
  const [pacienteSearch, setPacienteSearch] = useState("");
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState("");
  const [selectedSala, setSelectedSala] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [selectedCitaDetalle, setSelectedCitaDetalle] = useState(null);
  const limit = 10;

  const pacientesFiltrados =
    dataMaster?.pacientes?.filter((p) =>
      p.nombre?.toLowerCase().includes(pacienteSearch.toLowerCase()),
    ) || [];

  const fetchCitas = useCallback(
    async (page = currentPage) => {
      setLoading(true);
      try {
        let url = `${API_URL}/citas?page=${page}&limit=${limit}`;
        if (selectedOdontologo) {
          url += `&id_personal=${selectedOdontologo}`;
        }
        if (selectedPacienteId) {
          url += `&id_paciente=${selectedPacienteId}`;
        }
        if (selectedSala) {
          url += `&id_sala=${selectedSala}`;
        }
        if (selectedEstado) {
          url += `&estado=${selectedEstado}`;
        }
        if (fechaInicio) {
          url += `&fecha_agen_desde=${fechaInicio}`;
        }
        if (fechaFin) {
          url += `&fecha_agen_hasta=${fechaFin}`;
        }

        const citasRes = await fetch(url).then((res) => res.json());

        if (citasRes.data) {
          setCitas(citasRes.data);
          setHasMore(citasRes.data.length === limit);
        } else {
          setErrorMessage(citasRes.message || "Error al cargar las citas.");
        }
      } catch (err) {
        setErrorMessage("Error de conexión al cargar las citas.");
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      selectedOdontologo,
      selectedPacienteId,
      selectedSala,
      selectedEstado,
      fechaInicio,
      fechaFin,
    ],
  );

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  const getPacienteName = (id) => {
    if (!dataMaster?.pacientes) return id;
    const paciente = dataMaster.pacientes.find(
      (p) => (p.id_persona || p.id_usuario || p.id) == id,
    );
    return paciente ? paciente.nombre : `Paciente #${id}`;
  };

  const getOdontologoName = (id) => {
    if (!dataMaster?.odontologos) return id;
    const odon = dataMaster.odontologos.find(
      (o) => (o.id_personal || o.id) == id,
    );
    return odon ? odon.nombre : `Doc. #${id}`;
  };

  const getSalaName = (id) => {
    if (!dataMaster?.salas) return `Sala #${id}`;
    const sala = dataMaster.salas.find((s) => s.id_sala == id);
    return sala ? sala.nombre : `Sala #${id}`;
  };

  return (
    <div className="fixed inset-0 bg-[#2A5C4D]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-6xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[95vh] flex flex-col">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <div>
            <p className="text-[#148F77] text-xs font-bold uppercase tracking-widest mt-1">
              Listado de citas registradas
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all focus:outline-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-8 pt-6 pb-2 space-y-4">
            {/* Fila 1: Filtros principales */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                  Odontólogo
                </label>
                <div className="relative">
                  <select
                    value={selectedOdontologo}
                    onChange={(e) => {
                      setSelectedOdontologo(e.target.value);
                      setCurrentPage(1);
                    }}
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

              <div className="w-full sm:w-1/4 relative">
                <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                  Paciente
                </label>
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre..."
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors"
                  value={pacienteSearch}
                  onChange={(e) => {
                    setPacienteSearch(e.target.value);
                    setShowPacienteDropdown(true);
                    if (e.target.value === "") {
                      setSelectedPacienteId("");
                      setCurrentPage(1);
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
                            setCurrentPage(1);
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

              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                  Sala
                </label>
                <div className="relative">
                  <select
                    value={selectedSala}
                    onChange={(e) => {
                      setSelectedSala(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Todas las salas</option>
                    {dataMaster?.salas?.map((sala) => (
                      <option key={sala.id_sala} value={sala.id_sala}>
                        {sala.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    ▼
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-1/4">
                <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                  Estado
                </label>
                <div className="relative">
                  <select
                    value={selectedEstado}
                    onChange={(e) => {
                      setSelectedEstado(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Todos los estados</option>
                    <option value={ESTADO_CITA.PROGRAMADA}>Programada</option>
                    <option value={ESTADO_CITA.CANCELADA}>Cancelada</option>
                    <option value={ESTADO_CITA.REPROGRAMADA}>Reprogramada</option>
                    <option value={ESTADO_CITA.COMPLETADA}>Completada</option>
                    <option value={ESTADO_CITA.NO_ASISTIO}>No Asistió</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 2: Filtros de fecha */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                  Desde (Fecha Agend.)
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors"
                />
              </div>

              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
                  Hasta (Fecha Agend.)
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="p-8 pt-4">
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-black uppercase rounded-r-xl">
                ⚠️ {errorMessage}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-12 h-12 border-4 border-[#148F77] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : citas.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <p className="text-lg font-black text-[#2A5C4D] tracking-tight">
                  No hay citas registradas
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Fecha Agendada
                      </th>
                      <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Paciente
                      </th>
                      <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Especialista
                      </th>
                      <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Sala
                      </th>
                      <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Observaciones
                      </th>
                      <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Estado
                      </th>
                      <th className="py-2 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {citas.map((cita) => (
                      <tr
                        key={cita.id_cita}
                        className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors"
                      >
                        <td className="py-2 px-4">
                          <div className="text-sm font-bold text-gray-800">
                            {new Date(
                              cita.fecha_agendamiento,
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] font-bold text-[#148F77]">
                            {new Date(
                              cita.fecha_agendamiento,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td
                          className="py-2 px-4 text-sm font-bold text-gray-700 truncate max-w-[150px]"
                          title={getPacienteName(cita.id_paciente)}
                        >
                          {getPacienteName(cita.id_paciente)}
                        </td>
                        <td
                          className="py-2 px-4 text-sm font-medium text-gray-600 truncate max-w-[150px]"
                          title={getOdontologoName(cita.id_personal)}
                        >
                          {getOdontologoName(cita.id_personal)}
                        </td>
                        <td className="py-2 px-4 text-xs font-medium text-gray-500">
                          {getSalaName(cita.id_sala)}
                        </td>
                        <td
                          className="py-2 px-4 text-xs font-medium text-gray-500 truncate max-w-[200px]"
                          title={cita.cita_obs || "Sin observaciones"}
                        >
                          {cita.cita_obs || (
                            <span className="text-gray-300 italic">
                              Sin observaciones
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              (ESTADO_CITA_COLORS[cita.id_estado_cita] || ESTADO_CITA_COLORS[ESTADO_CITA.PROGRAMADA]).badge
                            }`}
                          >
                            {cita.nombre_estado || ESTADO_CITA_LABELS[cita.id_estado_cita] || `Estado ${cita.id_estado_cita}`}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-center">
                          <button
                            onClick={() => setSelectedCitaDetalle(cita)}
                            className="px-4 py-2 bg-gray-100 hover:bg-emerald-50 text-[#148F77] rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm"
                          >
                            Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && citas.length > 0 && (
              <div className="mt-8 flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-[#2A5C4D] shadow-sm hover:bg-emerald-50 active:scale-95"
                  }`}
                >
                  ← Anterior
                </button>

                <span className="text-xs font-bold text-gray-500">
                  Página {currentPage}
                </span>

                <button
                  disabled={!hasMore}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    !hasMore
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-[#2A5C4D] shadow-sm hover:bg-emerald-50 active:scale-95"
                  }`}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCitaDetalle && (
        <DetallesCitas
          idCita={selectedCitaDetalle.id_cita}
          originalCita={selectedCitaDetalle}
          user={user}
          dataMaster={dataMaster}
          onClose={() => {
            setSelectedCitaDetalle(null);
            fetchCitas(currentPage); // refresh list in case it was modified
          }}
        />
      )}
    </div>
  );
}

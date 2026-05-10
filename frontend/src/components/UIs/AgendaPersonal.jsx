import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function AgendaPersonal({ onClose, dataMaster }) {
  const [loading, setLoading] = useState(false);
  const [selectedOdontologo, setSelectedOdontologo] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCitas = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = `${API_URL}/citas?page=1&limit=100&estado=Programada`;
        if (selectedOdontologo) {
          url += `&id_personal=${selectedOdontologo}`;
        }
        if (selectedDate) {
          url += `&fecha_agen_desde=${selectedDate}&fecha_agen_hasta=${selectedDate}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.success !== false) {
          setCitas(data.data || []);
        } else {
          setError(data.message || "Error al cargar las citas.");
        }
      } catch (err) {
        setError("Error de conexión al cargar las citas.");
      } finally {
        setLoading(false);
      }
    };

    fetchCitas();
  }, [selectedOdontologo, selectedDate]);

  const getPacienteName = (id) => {
    if (!dataMaster?.pacientes) return id;
    const paciente = dataMaster.pacientes.find(
      (p) => (p.id_persona || p.id_usuario || p.id) == id,
    );
    return paciente ? paciente.nombre : `Paciente #${id}`;
  };

  const getSalaName = (id) => {
    if (!dataMaster?.salas) return `Sala #${id}`;
    const sala = dataMaster.salas.find((s) => s.id_sala == id);
    return sala ? sala.nombre : `Sala #${id}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="animate-fade-in-up w-full h-full flex flex-col">
      <div className="mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-3xl font-black text-[#2A5C4D] tracking-tight italic">
          Agenda Personal
        </h2>
        <p className="text-[#148F77] text-xs font-bold uppercase tracking-widest mt-1">
          Visualice su horario y citas asignadas
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {/* Filtros o Controles */}
        <div className="bg-gray-50 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                Vista Actual
              </p>
              <p className="font-bold text-[#2A5C4D] capitalize">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <select
                value={selectedOdontologo}
                onChange={(e) => setSelectedOdontologo(e.target.value)}
                className="w-full bg-white border-2 border-gray-100 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Todos los odontólogos</option>
                {dataMaster?.odontologos?.map((od) => (
                  <option key={od.id_persona} value={od.id_persona}>
                    {od.nombre}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                ▼
              </div>
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto bg-white border-2 border-gray-100 px-4 py-2 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-[#148F77] transition-colors"
            />
          </div>
        </div>

        {/* Contenedor Principal */}
        <div className="flex-1 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col min-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
              <div className="w-8 h-8 border-4 border-[#148F77] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#148F77]">
                Cargando agenda...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full opacity-70 text-red-500">
              <p className="text-sm font-bold uppercase">{error}</p>
            </div>
          ) : citas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <p className="text-sm font-black text-[#2A5C4D] uppercase tracking-widest">
                Día Libre
              </p>
              <p className="text-xs font-bold text-gray-400 mt-2">
                No hay citas programadas para esta fecha.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {citas.map((cita) => (
                <div
                  key={cita.id_cita}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${
                      cita.estado_cita?.toUpperCase() === "PROGRAMADA"
                        ? "bg-[#148F77]"
                        : cita.estado_cita?.toUpperCase() === "FINALIZADA"
                          ? "bg-blue-500"
                          : "bg-red-500"
                    }`}
                  ></div>

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-[#2A5C4D]">
                        {formatTime(cita.fecha_agendamiento)}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        {getSalaName(cita.id_sala)}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        cita.estado_cita?.toUpperCase() === "PROGRAMADA"
                          ? "bg-emerald-50 text-[#148F77]"
                          : cita.estado_cita?.toUpperCase() === "FINALIZADA"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {cita.estado_cita}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                        Paciente
                      </p>
                      <p className="text-sm font-bold text-gray-700 truncate">
                        {getPacienteName(cita.id_paciente)}
                      </p>
                    </div>

                    {cita.cita_obs && (
                      <div className="pt-2 border-t border-gray-50">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                          Motivo
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {cita.cita_obs}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

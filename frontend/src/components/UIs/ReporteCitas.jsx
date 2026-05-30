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
  
  const [selectedSala, setSelectedSala] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const pacientesFiltrados = (dataMaster?.pacientes || []).filter((p) =>
    p.nombre?.toLowerCase().includes(pacienteSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-emerald-50 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 lg:p-8 border-b border-gray-50 bg-gray-50/30">
        <div>
          <h2 className="text-2xl font-black text-[#2A5C4D]">
            Reporte de Citas
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">
            Filtra y visualiza las citas del sistema
          </p>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-4">
        {/* Fila 1: Filtros principales */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-1/4">
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

          <div className="w-full sm:w-1/4 relative">
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
              onBlur={() => setTimeout(() => setShowPacienteDropdown(false), 200)}
            />
            {showPacienteDropdown && (
              <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto">
                {pacientesFiltrados.length > 0 ? (
                  pacientesFiltrados.map((p) => (
                    <li
                      key={p.id_persona || p.id_usuario || p.id}
                      className="p-4 text-xs font-bold text-gray-600 hover:bg-emerald-50 hover:text-[#148F77] cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                      onMouseDown={() => {
                        setSelectedPacienteId(p.id_persona || p.id_usuario || p.id);
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

          <div className="w-full sm:w-1/4">
            <label className="block text-xs font-black text-[#148F77] uppercase tracking-widest mb-2">
              Sala
            </label>
            <div className="relative">
              <select
                value={selectedSala}
                onChange={(e) => setSelectedSala(e.target.value)}
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
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#148F77] focus:ring-0 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Todos los estados</option>
                <option value={ESTADO_CITA?.PROGRAMADA || 1}>Programada</option>
                <option value={ESTADO_CITA?.CANCELADA || 2}>Cancelada</option>
                <option value={ESTADO_CITA?.REPROGRAMADA || 3}>Reprogramada</option>
                <option value={ESTADO_CITA?.COMPLETADA || 4}>Completada</option>
                <option value={ESTADO_CITA?.NO_ASISTIO || 5}>No Asistió</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Fila 2: Filtros de fecha */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-1/2 relative">
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

          <div className="w-full sm:w-1/2 relative">
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
        
        {/* Aquí iría la tabla de reportes en el futuro */}
        <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <p className="text-4xl mb-4">📊</p>
              <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-500">
                Selecciona filtros para generar el reporte
              </p>
            </div>
        </div>
      </div>
    </div>
  );
}

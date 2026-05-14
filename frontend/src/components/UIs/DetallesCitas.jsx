import { useState, useEffect } from "react";
import AgendarCitas from "./AgendarCitas";
import {
  ESTADO_CITA,
  ESTADO_CITA_LABELS,
  ESTADO_CITA_COLORS,
} from "../../constants/enums";

const API_URL = import.meta.env.VITE_API_URL;

export default function DetallesCitas({
  idCita,
  originalCita,
  user,
  dataMaster,
  onClose,
}) {
  const [loading, setLoading] = useState(true);
  const [cita, setCita] = useState(null);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showReprogramarModal, setShowReprogramarModal] = useState(false);
  const [reprogramarData, setReprogramarData] = useState(null); // datos pre-llenados para AgendarCitas

  const [formData, setFormData] = useState({
    id_personal: "",
    id_paciente: "",
    id_sala: "",
    fecha_base: "",
    hora_seleccionada: "",
    estado_cita: "",
    cita_obs: "",
  });

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);

  const fetchCita = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/citas/${idCita}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setCita(data.data);
      } else {
        setError(data.message || "Error al cargar la cita");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idCita) {
      fetchCita();
    }
  }, [idCita]);

  // Setup form data when entering edit mode
  useEffect(() => {
    if (isEditing && originalCita) {
      const initialDate = new Date(originalCita.fecha_agendamiento);
      const tzOffset = initialDate.getTimezoneOffset() * 60000;
      const localISOTime = new Date(initialDate - tzOffset)
        .toISOString()
        .slice(0, -1);
      const initialFechaBase = localISOTime.split("T")[0];
      const initialHora = localISOTime.split("T")[1].slice(0, 5);

      setFormData({
        id_personal: originalCita.id_personal || "",
        id_paciente: originalCita.id_paciente || "",
        id_sala: originalCita.id_sala || "",
        fecha_base: initialFechaBase,
        hora_seleccionada: initialHora,
        estado_cita: originalCita.estado_cita || "",
        cita_obs: originalCita.cita_obs || "",
      });
      setSaveError("");
    }
  }, [isEditing, originalCita]);

  // Fetch slots
  useEffect(() => {
    if (
      !isEditing ||
      !formData.id_personal ||
      !formData.id_sala ||
      !formData.fecha_base
    ) {
      setSlotsDisponibles([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const queryParams = new URLSearchParams({
          id_personal: formData.id_personal,
          id_sala: formData.id_sala,
          fecha: formData.fecha_base,
        });

        const res = await fetch(
          `${API_URL}/citas/disponibilidad?${queryParams}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        const data = await res.json();
        if (data.success) {
          let horarios = data.data;

          // Si estamos viendo el odontologo/sala/fecha original,
          // asegurarnos de que el slot actual esté en la lista, ya que
          // la BD podría filtrarlo como "ocupado" (por esta misma cita).
          if (originalCita) {
            const initialDate = new Date(originalCita.fecha_agendamiento);
            const tzOffset = initialDate.getTimezoneOffset() * 60000;
            const localISOTime = new Date(initialDate - tzOffset)
              .toISOString()
              .slice(0, -1);
            const initialFechaBase = localISOTime.split("T")[0];
            const initialHora = localISOTime.split("T")[1].slice(0, 5);

            if (
              formData.id_personal == originalCita.id_personal &&
              formData.id_sala == originalCita.id_sala &&
              formData.fecha_base == initialFechaBase
            ) {
              const alreadyExists = horarios.some(
                (s) => s.inicio.slice(0, 5) === initialHora,
              );
              if (!alreadyExists) {
                // Inyectarlo en orden
                horarios.push({
                  inicio: initialHora + ":00",
                  fin: initialHora + ":30",
                });
                horarios.sort((a, b) => a.inicio.localeCompare(b.inicio));
              }
            }
          }

          setSlotsDisponibles(horarios);
        } else {
          setSlotsDisponibles([]);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
        setSlotsDisponibles([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [formData.id_personal, formData.id_sala, formData.fecha_base, isEditing]);

  const handleSave = async () => {
    if (!formData.hora_seleccionada) {
      setSaveError("Debe seleccionar un horario.");
      return;
    }

    setSaving(true);
    setSaveError("");

    const fecha_agendamiento = `${formData.fecha_base} ${formData.hora_seleccionada}:00`;

    const payload = {
      id_personal: formData.id_personal,
      id_paciente: formData.id_paciente,
      fecha_agendamiento: fecha_agendamiento,
      id_sala: formData.id_sala,
      cita_obs: formData.cita_obs,
      id_estado_cita: formData.estado_cita,
      fecha_finalizacion:
        formData.estado_cita == ESTADO_CITA.COMPLETADA
          ? new Date().toISOString()
          : null,
      id_usuario: user?.id_usuario || null,
      id_sesion: user?.id_sesion || null,
    };

    try {
      const res = await fetch(`${API_URL}/citas/${idCita}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        fetchCita();

        if (originalCita) {
          originalCita.id_personal = formData.id_personal;
          originalCita.id_paciente = formData.id_paciente;
          originalCita.id_sala = formData.id_sala;
          originalCita.fecha_agendamiento = fecha_agendamiento;
          originalCita.id_estado_cita = formData.estado_cita;
          originalCita.cita_obs = formData.cita_obs;
        }
      } else {
        setSaveError(data.message || "Error al actualizar la cita.");
      }
    } catch (err) {
      setSaveError("Error de conexión al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (newStatus, setFinalization = true) => {
    setSaving(true);
    setSaveError("");

    const payload = {
      id_personal: originalCita?.id_personal || cita?.id_personal,
      id_paciente: originalCita?.id_paciente || cita?.id_paciente,
      fecha_agendamiento: cita?.fecha_agendamiento,
      id_sala: originalCita?.id_sala || cita?.id_sala,
      cita_obs: cita?.cita_obs,
      id_estado_cita: newStatus, // integer ID del enum
      fecha_finalizacion: setFinalization ? new Date().toISOString() : null,
      id_usuario: user?.id_usuario || null,
      id_sesion: user?.id_sesion || null,
    };

    try {
      const res = await fetch(`${API_URL}/citas/${idCita}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        onClose();
      } else {
        setSaveError(data.message || `Error al cambiar estado`);
      }
    } catch (err) {
      setSaveError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  const handleReprogramar = () => {
    // originalCita viene del listado y tiene los IDs numéricos (id_paciente, id_personal, id_sala)
    // cita viene del fetch de detalle y tiene nombres pero no siempre los IDs
    const idSource = originalCita; // para IDs
    const dataSource = cita || originalCita; // para fecha y obs

    let fechaBase = "";
    if (dataSource?.fecha_agendamiento) {
      if (dataSource.fecha_agendamiento.includes(' ')) {
        // Formato DD/MM/YY HH:MM -> Extraer DD/MM/YY y convertir a YYYY-MM-DD para el input date si es posible
        const [datePart] = dataSource.fecha_agendamiento.split(" ");
        const [d, m, y] = datePart.split("/");
        // Intentamos reconstruir un formato aceptable para el input (asumiendo 20xx para el año)
        fechaBase = `20${y}-${m}-${d}`;
      } else {
        fechaBase = dataSource.fecha_agendamiento.split("T")[0];
      }
    }

    setReprogramarData({
      id_paciente: idSource?.id_paciente,
      id_personal: idSource?.id_personal,
      id_sala: idSource?.id_sala,
      cita_obs: dataSource?.cita_obs || "",
      fecha_base: fechaBase,
    });
    setShowReprogramarModal(true);
  };

  // Se llama DESPUÉS de que AgendarCitas crea la nueva cita exitosamente
  const handleReprogramarSuccess = async () => {
    setShowReprogramarModal(false);
    // Ahora sí marcamos la cita original como REPROGRAMADA
    await handleStatusUpdate(ESTADO_CITA.REPROGRAMADA, false);
  };

  const pacientesResult = dataMaster?.pacientes || [];

  return (
    <div className="fixed inset-0 bg-[#2A5C4D]/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-2xl font-black text-[#2A5C4D] italic tracking-tighter">
              {isEditing ? "Modificar Cita" : "Detalles de la Cita"}
            </h3>
            <p className="text-[#148F77] text-xs font-bold uppercase tracking-widest mt-1">
              {isEditing ? "Editando información" : "Información completa"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all focus:outline-none"
          >
            ✕
          </button>
        </div>

        <div className="p-10 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#148F77] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-black uppercase">
              ⚠️ {error}
            </div>
          ) : isEditing ? (
            <div className="space-y-6">
              {saveError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-black uppercase">
                  ⚠️ {saveError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Paciente
                  </label>
                  <select
                    className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50"
                    value={formData.id_paciente}
                    onChange={(e) =>
                      setFormData({ ...formData, id_paciente: e.target.value })
                    }
                  >
                    <option value="">Seleccione Paciente</option>
                    {pacientesResult.map((p) => (
                      <option
                        key={p.id_persona || p.id_usuario || p.id}
                        value={p.id_persona || p.id_usuario || p.id}
                      >
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Especialista
                  </label>
                  <select
                    className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50"
                    value={formData.id_personal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        id_personal: e.target.value,
                        hora_seleccionada: "",
                      })
                    }
                  >
                    <option value="">Seleccione Especialista</option>
                    {dataMaster?.odontologos?.map((o) => (
                      <option
                        key={o.id_usuario || o.id_persona || o.id}
                        value={o.id_usuario || o.id_persona || o.id}
                      >
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Sala
                  </label>
                  <select
                    className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50"
                    value={formData.id_sala}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        id_sala: e.target.value,
                        hora_seleccionada: "",
                      })
                    }
                  >
                    <option value="">Seleccione Sala</option>
                    {dataMaster?.salas?.map((s) => (
                      <option key={s.id_sala} value={s.id_sala}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50"
                    value={formData.fecha_base}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_base: e.target.value,
                        hora_seleccionada: "",
                      })
                    }
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-[2rem] p-6 border border-dashed border-gray-200 min-h-[130px]">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-4 tracking-widest">
                  Horarios Disponibles:
                </p>
                {loadingSlots ? (
                  <div className="flex justify-center py-4 space-x-2">
                    <div className="w-2 h-2 bg-[#148F77] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#148F77] rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-[#148F77] rounded-full animate-bounce delay-150"></div>
                  </div>
                ) : slotsDisponibles.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slotsDisponibles.map((slot, index) => {
                      const horaValue = slot.inicio.slice(0, 5);
                      return (
                        <button
                          key={index}
                          type="button"
                          className={`p-2 rounded-xl text-xs font-bold transition-all ${
                            formData.hora_seleccionada === horaValue
                              ? "bg-[#148F77] text-white shadow-md transform scale-105"
                              : "bg-white text-gray-600 hover:bg-emerald-50 hover:text-[#148F77]"
                          }`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              hora_seleccionada: horaValue,
                            })
                          }
                        >
                          {horaValue}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-xs italic py-4">
                    {!formData.id_personal ||
                    !formData.id_sala ||
                    !formData.fecha_base
                      ? "Seleccione Odontólogo, Sala y Fecha para ver horarios"
                      : "No hay horarios disponibles"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Estado
                  </label>
                  <select
                    className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50"
                    value={formData.estado_cita}
                    onChange={(e) =>
                      setFormData({ ...formData, estado_cita: e.target.value })
                    }
                  >
                    <option value={ESTADO_CITA.PROGRAMADA}>Programada</option>
                    <option value={ESTADO_CITA.COMPLETADA}>Completada</option>
                    <option value={ESTADO_CITA.CANCELADA}>Cancelada</option>
                    <option value={ESTADO_CITA.REPROGRAMADA}>
                      Reprogramada
                    </option>
                    <option value={ESTADO_CITA.NO_ASISTIO}>No Asistió</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                  Observaciones
                </label>
                <textarea
                  className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-medium border-none outline-none focus:ring-4 focus:ring-emerald-50 resize-none h-24"
                  value={formData.cita_obs}
                  onChange={(e) =>
                    setFormData({ ...formData, cita_obs: e.target.value })
                  }
                  placeholder="Detalles adicionales..."
                ></textarea>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-4 bg-[#2A5C4D] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#1f453a] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={saving}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : cita ? (
            <div className="space-y-6">
              {saveError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-black uppercase animate-shake">
                  ⚠️ {saveError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Paciente
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {cita.nombre_paciente}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Especialista
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {cita.nombre_personal}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                    Fecha Agendada
                  </p>
                  <p className="text-sm font-bold text-[#148F77]">
                    <p className="text-xl font-black text-[#2A5C4D]">
                      {cita.fecha_agendamiento || "Cargando..."}
                    </p>
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Sala
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {cita.nombre_sala}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Fecha de Registro
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {cita.fecha_registro
                      ? new Date(cita.fecha_registro).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Fecha de Finalización
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {cita.fecha_finalizacion ? (
                      new Date(cita.fecha_finalizacion).toLocaleString()
                    ) : (
                      <span className="italic opacity-50">Pendiente</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Estado Actual
                </p>
                {(() => {
                  const colors =
                    ESTADO_CITA_COLORS[cita.id_estado_cita] ||
                    ESTADO_CITA_COLORS[ESTADO_CITA.PROGRAMADA];
                  const label =
                    cita.nombre_estado ||
                    ESTADO_CITA_LABELS[cita.id_estado_cita] ||
                    `Estado ${cita.id_estado_cita}`;
                  return (
                    <span
                      className={`px-3 py-1 mt-1 inline-block rounded-full text-[10px] font-black uppercase tracking-wider ${colors.badge}`}
                    >
                      {label}
                    </span>
                  );
                })()}
              </div>

              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Observaciones
                </p>
                <p className="text-sm font-medium text-gray-600">
                  {cita.cita_obs || (
                    <span className="italic opacity-50">
                      Sin observaciones registradas.
                    </span>
                  )}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate("FINALIZADA")}
                    disabled={saving}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? "..." : "Finalizar"}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate("CANCELADA")}
                    disabled={saving}
                    className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? "..." : "Cancelar"}
                  </button>
                  <button
                    onClick={handleReprogramar}
                    disabled={saving}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {saving ? "..." : "Reprogramar"}
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-4 bg-[#2A5C4D] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#1f453a] active:scale-95 transition-all"
                  >
                    Modificar Cita
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showReprogramarModal && reprogramarData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <AgendarCitas
            onClose={() => {
              setShowReprogramarModal(false);
              setReprogramarData(null);
            }}
            user={user}
            dataMaster={dataMaster}
            isStaff={true}
            initialData={reprogramarData}
            onRefresh={() => {}}
            onSuccess={handleReprogramarSuccess}
          />
        </div>
      )}
    </div>
  );
}

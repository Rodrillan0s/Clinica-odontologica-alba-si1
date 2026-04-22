import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth_store';
import logo from '../assets/LOGOTIPO.png';

const API_URL = import.meta.env.VITE_API_URL;

const ROLES = { ADMINISTRADOR: 1, ODONTOLOGO: 2, ASISTENTE: 3, RECEPCIONISTA: 4, CLIENTE: 5, PACIENTE: 6 };

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('Panel de Control');
  const [showModalCita, setShowModalCita] = useState(false);

  // Intentamos sacar el nombre real. Si el backend manda el dato correcto, aquí se verá bien.
  const nombreReal = user?.nombre || 'Usuario';
  const primerNombre = nombreReal.split(' ')[0];
  const userRolId = Number(user?.rol) || ROLES.CLIENTE;
  const isStaff = userRolId < ROLES.CLIENTE;

  const menuItems = [
    { text: "Panel de Control", roles: [1,2,3,4,5,6] },
    { text: "Gestión Clínica", roles: [1,2] },
    { text: "Agenda General", roles: [1,2,3,4] },
    { text: "Mis Citas", roles: [5,6] },
    { text: "Pacientes", roles: [1,2,4] }
  ];

  return (
    <div className="flex h-screen bg-[#F4F9F9] font-sans antialiased overflow-hidden text-gray-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-sm">
        <div className="p-8 flex justify-center">
          <img src={logo} alt="Clínica Alba" className="h-10 w-auto" />
        </div>

        <div className="p-6 flex flex-col items-center border-b border-gray-50">
          <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black mb-3 shadow-lg ${isStaff ? 'bg-emerald-50 text-[#148F77]' : 'bg-[#148F77] text-white'}`}>
            {primerNombre.charAt(0)}
          </div>
          <h3 className="text-[#2A5C4D] font-black text-[11px] text-center leading-tight px-4 uppercase tracking-tighter">
            {nombreReal}
          </h3>
          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-2 bg-gray-50 px-2 py-1 rounded">ID Persona: {user?.id_persona}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.filter(item => item.roles.includes(userRolId)).map((item) => (
            <div 
              key={item.text}
              onClick={() => setActiveMenu(item.text)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer transition-all ${activeMenu === item.text ? 'bg-[#148F77] text-white shadow-xl shadow-emerald-100' : 'text-gray-400 hover:bg-emerald-50 hover:text-[#148F77]'}`}
            >
              <span className="font-bold text-xs">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="p-6">
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full py-4 rounded-2xl text-red-400 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest transition-all">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-20 px-10 flex items-center justify-between border-b border-gray-50">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Alba / <span className="text-[#148F77]">{activeMenu}</span></div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          {activeMenu === 'Panel de Control' && (
            isStaff 
              ? <DashboardStaff openModal={() => setShowModalCita(true)} /> 
              : <DashboardPaciente openModal={() => setShowModalCita(true)} />
          )}
          {activeMenu !== 'Panel de Control' && (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
                <p className="text-6xl mb-4">🦷</p>
                <p className="font-black uppercase tracking-[0.3em] text-xs text-[#2A5C4D]">Módulo en construcción</p>
            </div>
          )}
        </div>
      </main>

      {showModalCita && <ModalNuevaCita onClose={() => setShowModalCita(false)} user={user} isStaff={isStaff} />}
    </div>
  );
}

// ==========================================
// COMPONENTE: MODAL DE CITA
// ==========================================

function ModalNuevaCita({ onClose, user, isStaff }) {
  const [loading, setLoading] = useState(false);
  const [odontologos, setOdontologos] = useState([]);
  const [esParaFamiliar, setEsParaFamiliar] = useState(false);
  const [nombreFamiliar, setNombreFamiliar] = useState('');

  // DATA DE SALAS SEGÚN TU TABLA clinica.t_sala
  const salas = [
    { id: 1, nombre: "Consultorio 1", caso: "Consulta General", estado: "DISPONIBLE" },
    { id: 2, nombre: "Quirofano A", caso: "Cirugía Dental", estado: "DISPONIBLE" },
    { id: 3, nombre: "Sala Rayos X", caso: "Imagenología", estado: "DISPONIBLE" },
    { id: 4, nombre: "Consultorio 2", caso: "Consulta", estado: "MANTENIMIENTO" },
  ];

  const [formData, setFormData] = useState({
    fecha_agendamiento: '',
    id_paciente: user?.id_persona || '', 
    id_odontologo: '',
    id_sala: '', 
    cita_obs: ''
  });

  // CARGAR ESPECIALISTAS REALES
  useEffect(() => {
    const fetchDoctores = async () => {
        try {
            const res = await fetch(`${API_URL}/odontologos`);
            const data = await res.json();
            if (Array.isArray(data)) setOdontologos(data);
        } catch (err) {
            console.error("Error cargando doctores:", err);
            setOdontologos([{id: 2, nombre: 'Dra. Alba'}]); 
        }
    }
    fetchDoctores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Convertimos los campos a números para evitar errores de tipos en Postgres
    const payload = {
        fecha_agendamiento: formData.fecha_agendamiento,
        id_paciente: Number(formData.id_paciente),
        id_odontologo: Number(formData.id_odontologo),
        id_sala: Number(formData.id_sala),
        // Concatenamos el familiar para no tocar el backend
        cita_obs: esParaFamiliar ? `PACIENTE: ${nombreFamiliar} | ${formData.cita_obs}` : formData.cita_obs
    };

    try {
      const res = await fetch(`${API_URL}/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        alert("¡Cita agendada correctamente!");
        onClose();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2A5C4D]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] p-10 w-full max-w-xl shadow-2xl animate-fade-in-up relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-bl-[5rem] -z-0 opacity-40"></div>

        <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-3xl font-black text-[#2A5C4D] tracking-tighter italic">Agendar Cita</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Servicio Odontológico</p>
                </div>
                <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* BLOQUE DE IDENTIDAD REAL */}
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black uppercase text-emerald-800 tracking-widest mb-1">Titular Responsable</p>
                    <p className="text-base font-black text-emerald-900 leading-none">{user?.nombre || 'Usuario Alba'}</p>
                </div>
                <div className="text-[8px] bg-emerald-600 text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm">Identidad Verificada</div>
              </div>

              {/* OPCIÓN FAMILIAR */}
              {!isStaff && (
                <label className="flex items-center gap-3 px-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-5 h-5 accent-[#148F77] cursor-pointer" checked={esParaFamiliar} onChange={e => setEsParaFamiliar(e.target.checked)} />
                  <span className="text-xs font-bold text-gray-500">¿La cita es para un hijo o familiar?</span>
                </label>
              )}

              {esParaFamiliar && (
                <div className="animate-fade-down">
                    <input type="text" required placeholder="Nombre completo del paciente" className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50 shadow-inner" onChange={e => setNombreFamiliar(e.target.value)} />
                </div>
              )}

              {isStaff && (
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">ID del Paciente</label>
                    <input type="number" required className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50" onChange={e => setFormData({...formData, id_paciente: e.target.value})} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Fecha y Hora</label>
                    <input type="datetime-local" required className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50" onChange={e => setFormData({...formData, fecha_agendamiento: e.target.value})} />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Especialista</label>
                    <select required className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50 cursor-pointer" onChange={e => setFormData({...formData, id_odontologo: e.target.value})}>
                        <option value="">Elegir odontólogo...</option>
                        {odontologos.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                    </select>
                </div>
              </div>

              {/* SELECT DE SALA SEGÚN CASO */}
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 mb-1 block">Sala de Atención</label>
                <select required className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50 cursor-pointer" onChange={e => setFormData({...formData, id_sala: e.target.value})}>
                    <option value="">Seleccione según su caso...</option>
                    {salas.map(s => (
                        <option key={s.id} value={s.id} disabled={s.estado === 'MANTENIMIENTO'}>
                            {s.nombre} ({s.caso}) - {s.estado}
                        </option>
                    ))}
                </select>
              </div>

              <textarea placeholder="Motivo o síntomas..." className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-bold h-24 border-none outline-none focus:ring-4 focus:ring-emerald-50 resize-none" onChange={e => setFormData({...formData, cita_obs: e.target.value})}></textarea>

              <button type="submit" disabled={loading} className="w-full py-5 bg-[#148F77] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#0f6b59] active:scale-[0.98] transition-all">
                {loading ? "PROCESANDO..." : "CONFIRMAR CITA"}
              </button>
            </form>
        </div>
      </div>
    </div>
  );
}

function DashboardStaff({ openModal }) { 
    return (
        <div className="animate-fade-in">
            <div className="bg-[#148F77] text-white p-10 rounded-[2.5rem] shadow-xl flex justify-between items-center cursor-pointer hover:bg-[#0f6b59] transition-all" onClick={openModal}>
                <div><h3 className="text-2xl font-black italic">Nueva Atención</h3><p className="opacity-70 text-sm">Registro de cita presencial</p></div>
                <div className="text-4xl">＋</div>
            </div>
        </div>
    ); 
}

function DashboardPaciente({ openModal }) { 
    return (
        <div className="animate-fade-in">
            <div className="bg-gradient-to-br from-[#148F77] to-[#2A5C4D] text-white p-12 rounded-[3rem] shadow-2xl cursor-pointer hover:scale-[1.01] transition-transform" onClick={openModal}>
                <h2 className="text-4xl font-black mb-3 tracking-tighter italic">¿Quieres una sonrisa perfecta?</h2>
                <p className="opacity-80 text-base max-w-md mb-8">Agenda una limpieza dental o una revisión general en segundos.</p>
                <div className="bg-white/20 inline-block px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest">Agendar Cita ➔</div>
            </div>
        </div>
    ); 
}
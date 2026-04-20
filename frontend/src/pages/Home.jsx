import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth_store';
import logo from '../assets/LOGOTIPO.png';

const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// CONFIGURACIÓN DE ROLES (IDs DE TU DB)
// ==========================================
const ROLES = {
  ADMINISTRADOR: 1,
  ODONTOLOGO: 2,
  ASISTENTE: 3,
  RECEPCIONISTA: 4,
  CLIENTE: 5,   // Usuario Web nuevo
  PACIENTE: 6   // Usuario con cita o registro clínico
};

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('Panel de Control');
  const [showModalCita, setShowModalCita] = useState(false);

  const handleLogout = () => {
    logout(); 
    navigate('/login'); 
  };

  const primerNombre = user?.nombre ? user.nombre.split(' ')[0] : 'Usuario';
  const userRolId = Number(user?.rol) || ROLES.CLIENTE;
  
  // STAFF son todos los roles menores a 5
  const isStaff = userRolId < ROLES.CLIENTE;

  const getRolName = (rolId) => {
    const nombres = {
      [ROLES.ADMINISTRADOR]: 'Administrador',
      [ROLES.ODONTOLOGO]: 'Odontólogo',
      [ROLES.ASISTENTE]: 'Asistente',
      [ROLES.RECEPCIONISTA]: 'Recepción',
      [ROLES.CLIENTE]: 'Cliente Web',
      [ROLES.PACIENTE]: 'Paciente'
    };
    return nombres[rolId] || 'Usuario';
  };

  const menuItems = [
    { text: "Panel de Control", roles: [1,2,3,4,5,6], icon: "grid" },
    { text: "Gestión Clínica", roles: [1,2], icon: "hospital" },
    { text: "Agenda General", roles: [1,2,3,4], icon: "calendar" },
    { text: "Mis Citas", roles: [5,6], icon: "user-calendar" },
    { text: "Pacientes", roles: [1,2,4], icon: "users" },
    { text: "Usuarios y Roles", roles: [1], icon: "lock" }
  ];

  return (
    <div className="flex h-screen bg-[#F4F9F9] font-sans antialiased overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-sm">
        <div className="p-6 border-b border-gray-50 flex justify-center">
          <img src={logo} alt="Clínica Alba" className="h-10 w-auto object-contain" />
        </div>

        <div className="p-6 flex flex-col items-center border-b border-gray-50">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black mb-3 border-2 border-white shadow-md ${isStaff ? 'bg-[#E8F4F8] text-[#148F77]' : 'bg-orange-50 text-orange-500'}`}>
            {primerNombre.charAt(0)}
          </div>
          <h3 className="text-[#2A5C4D] font-black text-sm text-center">{user?.nombre || 'Usuario'}</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{getRolName(userRolId)}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {menuItems.filter(item => item.roles.includes(userRolId)).map((item) => (
            <div 
              key={item.text}
              onClick={() => setActiveMenu(item.text)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${activeMenu === item.text ? 'bg-[#148F77] text-white shadow-md' : 'text-gray-500 hover:bg-[#E8F4F8]'}`}
            >
              <span className="font-bold text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-50">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-20 px-8 flex items-center justify-between shadow-sm z-10">
          <div className="text-sm font-bold text-gray-400">/ <span className="text-[#148F77]">{activeMenu}</span></div>
          {isStaff && <input type="text" placeholder="Buscar..." className="bg-gray-50 px-4 py-2 rounded-xl w-96 border border-gray-100 text-sm" />}
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeMenu === 'Panel de Control' && (
            isStaff 
              ? <DashboardStaff userRolId={userRolId} openModal={() => setShowModalCita(true)} /> 
              : <DashboardPaciente openModal={() => setShowModalCita(true)} />
          )}
          {activeMenu !== 'Panel de Control' && <div className="text-gray-400 italic">Módulo de {activeMenu} en construcción...</div>}
        </div>
      </main>

      {showModalCita && <ModalNuevaCita onClose={() => setShowModalCita(false)} user={user} isStaff={isStaff} />}
    </div>
  );
}

// ==========================================
// COMPONENTES DE VISTA
// ==========================================

function DashboardStaff({ userRolId, openModal }) {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Citas Hoy</p>
          <h3 className="text-2xl font-black text-gray-800">12</h3>
        </div>
        {(userRolId === 1 || userRolId === 2) && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Ingresos</p>
            <h3 className="text-2xl font-black text-[#148F77]">Bs. 2,450</h3>
          </div>
        )}
        <div onClick={openModal} className="bg-[#2A5C4D] p-6 rounded-3xl shadow-md text-white flex justify-between items-center cursor-pointer hover:scale-[1.02] transition-transform">
          <div><p className="text-white/70 text-[10px] font-bold uppercase mb-1">Operación</p><h3 className="text-xl font-black">Registrar Cita</h3></div>
          <div className="bg-white/20 p-3 rounded-xl">+</div>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h3 className="font-black text-[#2A5C4D] text-lg mb-4">Agenda Próxima</h3>
        <p className="text-gray-400 text-sm italic">Cargando datos del servidor...</p>
      </div>
    </div>
  );
}

function DashboardPaciente({ openModal }) {
  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-r from-[#148F77] to-[#2A5C4D] rounded-3xl p-8 text-white mb-8">
        <h2 className="text-2xl font-black mb-2">¡Hola! Bienvenido</h2>
        <p className="text-white/80 text-sm">Gestiona tu salud dental de forma rápida y segura.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div onClick={openModal} className="bg-white p-8 rounded-3xl shadow-sm border-l-8 border-[#148F77] cursor-pointer hover:shadow-md transition-all">
          <h4 className="font-black text-gray-800 text-lg">Agendar Nueva Cita</h4>
          <p className="text-gray-500 text-xs mt-1">Busca un horario con nuestros especialistas.</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border-l-8 border-blue-400 opacity-60">
          <h4 className="font-black text-gray-800 text-lg">Mi Historial</h4>
          <p className="text-gray-500 text-xs mt-1">Revisa tus tratamientos pasados.</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODAL DE CITAS (CON FIX DE ID PERSONA Y ROL)
// ==========================================

function ModalNuevaCita({ onClose, user, isStaff }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fecha_agendamiento: '',
    id_paciente: '', // Se llenará con el id_persona (Ej: 13)
    id_odontologo: '',
    id_sala: '',
    cita_obs: ''
  });

  // Aseguramos que el id_paciente sea el ID de la PERSONA (13) y no el de usuario (9)
  useEffect(() => {
    if (!isStaff && user?.id_persona) {
      setFormData(prev => ({ ...prev, id_paciente: user.id_persona }));
    }
  }, [user, isStaff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_paciente) {
      alert("Error: No se pudo verificar su identidad clínica. Re-inicie sesión.");
      return;
    }

    setLoading(true);
    try {
      const url = API_URL.endsWith('/api') ? `${API_URL}/citas` : `${API_URL}/api/citas`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        alert("¡Cita agendada correctamente!");

        // --- MAGIA: ACTUALIZAR EL ROL EN VIVO EN EL NAVEGADOR ---
        const currentUser = useAuthStore.getState().user;
        if (currentUser && Number(currentUser.rol) === 5) {
          useAuthStore.setState({ 
            user: { ...currentUser, rol: 6 } 
          });
        }
        // -----------------------------------------------------

        onClose();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black text-[#2A5C4D]">📅 Agendar Cita</h3>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400">Fecha y Hora</label>
              <input type="datetime-local" required className="w-full p-3 bg-gray-50 border rounded-xl text-sm" onChange={e => setFormData({...formData, fecha_agendamiento: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400">ID Sala</label>
              <input type="number" placeholder="1, 2..." required className="w-full p-3 bg-gray-50 border rounded-xl text-sm" onChange={e => setFormData({...formData, id_sala: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400">ID Odontólogo</label>
            <input type="number" placeholder="ID del doctor" required className="w-full p-3 bg-gray-50 border rounded-xl text-sm" onChange={e => setFormData({...formData, id_odontologo: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400">ID Clínico (Persona)</label>
            <input 
              type="number" 
              required
              disabled={!isStaff}
              value={formData.id_paciente}
              className={`w-full p-3 border rounded-xl text-sm font-bold ${!isStaff ? 'bg-gray-100 text-[#148F77]' : 'bg-gray-50'}`}
              onChange={e => setFormData({...formData, id_paciente: e.target.value})}
            />
            {!isStaff && <span className="text-[9px] text-[#148F77] font-bold mt-1 block">✓ Identidad Verificada (ID: {formData.id_paciente})</span>}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400">Observaciones</label>
            <textarea placeholder="Motivo de la cita..." className="w-full p-3 bg-gray-50 border rounded-xl text-sm h-24" onChange={e => setFormData({...formData, cita_obs: e.target.value})}></textarea>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-gray-400 font-bold">Cerrar</button>
            <button type="submit" disabled={loading} className="flex-1 py-4 bg-[#148F77] text-white rounded-2xl font-black shadow-xl hover:bg-[#0f6b59] disabled:bg-gray-400">
              {loading ? "PROCESANDO..." : "CONFIRMAR CITA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
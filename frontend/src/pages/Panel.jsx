import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth_store';

import Sidebar from '../components/layout/Sidebar';
import DashboardAdmin from '../components/dashboards/DashboardAdmin';
import DashboardOdontologo from '../components/dashboards/DashboardOdontologo';
import DashboardRecepcionista from '../components/dashboards/DashboardRecepcionista';
import DashboardPaciente from '../components/dashboards/DashboardPaciente';
import AdminUI from '../components/UIs/Admin';
import CambioPasswordUI from '../components/UIs/CambioPassword';
import AgendarCitas from '../components/UIs/AgendarCitas';
import ModuloPacientes from '../components/UIs/ModuloPacientes';
import Bitacora from '../components/UIs/Bitacora';

const API_URL = import.meta.env.VITE_API_URL;
const ROLES = { ADMINISTRADOR: 1, ODONTOLOGO: 2, ASISTENTE: 3, RECEPCIONISTA: 4, CLIENTE: 5, PACIENTE: 6 };

export default function Panel() {
  const user = useAuthStore((state) => state.user);
  const clearStore = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('Panel de Control');
  const [showModalCita, setShowModalCita] = useState(false);
  const [dataMaster, setDataMaster] = useState({ 
    procedimientos: [], odontologos: [], usuarios: [], pacientes: [], loading: true 
  });

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      clearStore();
      navigate('/login');
    }
  };

  const fetchTodo = async (signal) => {
    try {
      const config = { 
        signal, 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      };

      const resProc = await fetch(`${API_URL}/procedimientos`, config).then(r => r.json());
      const resDoc = await fetch(`${API_URL}/odontologos`, config).then(r => r.json());
      const resUsu = await fetch(`${API_URL}/usuarios?t=${Date.now()}`, config).then(r => r.json());
      
      const listaUsuarios = resUsu.success ? resUsu.data : [];
      setDataMaster({
        procedimientos: resProc.success ? resProc.data : [],
        odontologos: Array.isArray(resDoc) ? resDoc : (resDoc.data || []),
        usuarios: listaUsuarios,
        pacientes: listaUsuarios.filter(u => u.id_rol === 5 || u.id_rol === 6),
        loading: false
      });
    } catch (err) {
      if (err.name !== 'AbortError') setDataMaster(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTodo(controller.signal);
    return () => controller.abort();
  }, []);

  const userRolId = user?.rol ? Number(user.rol) : null;

  if (!userRolId && dataMaster.loading) {
      return <div className="h-screen w-full flex items-center justify-center bg-[#F4F9F9] text-[#148F77] font-bold">Cargando sesión...</div>;
  }

  return (
    <div className="flex h-screen bg-[#F4F9F9] font-sans antialiased overflow-hidden text-gray-800">
      <Sidebar 
        user={user} 
        dataMaster={dataMaster} 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        userRolId={userRolId}
        logout={handleLogout} 
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-20 px-10 flex items-center border-b border-gray-50 shadow-sm">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic tracking-tighter">
              Clínica Alba / <span className="text-[#148F77] font-black">{activeMenu}</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-10">
          
          {/* PANEL DE CONTROL / DASHBOARDS */}
          {activeMenu === 'Panel de Control' && (
            userRolId === ROLES.ADMINISTRADOR ? 
              /* PASAMOS setView PARA QUE EL BOTÓN NARANJA FUNCIONE */
              <DashboardAdmin setView={(v) => setActiveMenu(v === 'bitacora' ? 'Bitácora' : 'Panel de Control')} /> :
            userRolId === ROLES.ODONTOLOGO ? <DashboardOdontologo openModal={() => setShowModalCita(true)} /> :
            userRolId === ROLES.RECEPCIONISTA ? <DashboardRecepcionista openModal={() => setShowModalCita(true)} /> :
            <DashboardPaciente openModal={() => setShowModalCita(true)} />
          )}

          {/* GESTIÓN DE USUARIOS */}
          {activeMenu === 'Usuarios y Roles' && userRolId === ROLES.ADMINISTRADOR && (
              <AdminUI dataMaster={dataMaster} onRefresh={() => fetchTodo()} />
          )}

          {/* NUEVA VISTA: BITÁCORA (AUDITORÍA) */}
          {activeMenu === 'Bitácora' && userRolId === ROLES.ADMINISTRADOR && (
              <Bitacora />
          )}

          {activeMenu === 'Pacientes' && <ModuloPacientes />}
          {activeMenu === 'Cambiar contraseña' && <CambioPasswordUI />}

          {/* ESTADO DE DESARROLLO */}
          {!['Panel de Control', 'Usuarios y Roles', 'Cambiar contraseña', 'Pacientes', 'Bitácora'].includes(activeMenu) && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <p className="text-6xl mb-4">⚙️</p>
                <p className="font-black uppercase tracking-[0.3em] text-xs">Módulo en Desarrollo</p>
            </div>
          )}
        </div>
      </main>

      {showModalCita && (
          <AgendarCitas onClose={() => setShowModalCita(false)} user={user} dataMaster={dataMaster} isStaff={userRolId < 5} />
      )}
    </div>
  );
}
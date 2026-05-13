import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth_store';

import Sidebar from '../components/layout/Sidebar';

import DashboardAdmin from '../components/dashboards/DashboardAdmin';
import DashboardOdontologo from '../components/dashboards/DashboardOdontologo';
import DashboardRecepcionista from '../components/dashboards/DashboardRecepcionista';
import DashboardPaciente from '../components/dashboards/DashboardPaciente';

import CambioPasswordUI from '../components/UIs/CambioPassword';
import AgendarCitas from '../components/UIs/AgendarCitas';
import ModuloPacientes from '../components/UIs/ModuloPacientes';
import Bitacora from '../components/UIs/Bitacora';
import ModuloUsuarios from '../components/UIs/ModuloUsuarios';

const API_URL = import.meta.env.VITE_API_URL;

const ROLES = {
  ADMINISTRADOR: 1,
  ODONTOLOGO: 2,
  ASISTENTE: 3,
  RECEPCIONISTA: 4,
  CLIENTE: 5,
  PACIENTE: 6
};

export default function Panel() {

  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const clearStore = useAuthStore((state) => state.logout);

  const [activeMenu, setActiveMenu] = useState('Panel de Control');
  const [showModalCita, setShowModalCita] = useState(false);

  const [dataMaster, setDataMaster] = useState({
    procedimientos: [],
    odontologos: [],
    usuarios: [],
    pacientes: [],
    loading: true
  });

  // =========================
  // FETCH CONFIG
  // =========================
  const fetchConfig = (signal) => ({

    signal,

    credentials: 'include',

    headers: {
      'Content-Type': 'application/json',

      Authorization: `Bearer ${localStorage.getItem('token')}`
    }

  });

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {

    try {

      await fetch(`${API_URL}/logout`, {

        method: 'POST',

        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }

      });

    } finally {

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      clearStore();

      navigate('/login');

    }

  };

  // =========================
  // FETCH GENERAL
  // =========================
  const fetchTodo = async (signal) => {

    try {

      const config = fetchConfig(signal);

      const [resProc, resDoc, resUsu] = await Promise.all([

        fetch(`${API_URL}/procedimientos`, config)
          .then(r => r.json()),

        fetch(`${API_URL}/odontologos`, config)
          .then(r => r.json()),

        fetch(`${API_URL}/usuarios?t=${Date.now()}`, config)
          .then(r => r.json())

      ]);

      const usuarios = resUsu.success
        ? resUsu.data
        : [];

      setDataMaster({

        procedimientos: resProc.success
          ? resProc.data
          : [],

        odontologos: Array.isArray(resDoc)
          ? resDoc
          : (resDoc.data || []),

        usuarios,

        pacientes: usuarios.filter(
          u => u.id_rol === 5 || u.id_rol === 6
        ),

        loading: false

      });

    } catch (err) {

      if (err.name !== 'AbortError') {

        console.log(err);

        setDataMaster(prev => ({
          ...prev,
          loading: false
        }));

      }

    }

  };

  useEffect(() => {

    const controller = new AbortController();

    fetchTodo(controller.signal);

    return () => controller.abort();

  }, []);

  const userRolId = user?.rol
    ? Number(user.rol)
    : null;

  // =========================
  // LOADING
  // =========================
  if (!userRolId && dataMaster.loading) {

    return (

      <div className="
        h-screen flex items-center justify-center
        bg-[#F4F9F9] text-[#148F77]
        font-bold text-sm md:text-lg
      ">
        Cargando sesión...
      </div>

    );

  }

  return (

    <div className="
      flex flex-col md:flex-row
      h-screen overflow-hidden
      bg-[#F4F9F9] text-gray-800
    ">

      {/* SIDEBAR */}
      <Sidebar
        user={user}
        dataMaster={dataMaster}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        userRolId={userRolId}
        logout={handleLogout}
      />

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="
          bg-white border-b border-gray-100 shadow-sm
          px-4 md:px-8 py-4
          flex items-center
        ">

          <div className="
            text-[10px] md:text-xs
            uppercase tracking-widest
            font-black italic text-gray-300
          ">

            Clínica Alba /

            <span className="text-[#148F77]">
              {' '}{activeMenu}
            </span>

          </div>

        </header>

        {/* CONTENT */}
        <div className="
          flex-1 overflow-y-auto
          p-4 md:p-8
        ">

          {/* DASHBOARD */}
          {activeMenu === 'Panel de Control' && (

            userRolId === ROLES.ADMINISTRADOR ?

              <DashboardAdmin
                setView={(v) =>
                  setActiveMenu(
                    v === 'bitacora'
                      ? 'Bitácora'
                      : 'Panel de Control'
                  )
                }
              />

            : userRolId === ROLES.ODONTOLOGO ?

              <DashboardOdontologo
                openModal={() => setShowModalCita(true)}
              />

            : userRolId === ROLES.RECEPCIONISTA ?

              <DashboardRecepcionista
                openModal={() => setShowModalCita(true)}
              />

            :

              <DashboardPaciente
                openModal={() => setShowModalCita(true)}
              />

          )}

          {/* USUARIOS */}
          {activeMenu === 'Usuarios y Roles' &&
            userRolId === ROLES.ADMINISTRADOR && (
              <ModuloUsuarios />
          )}

          {/* BITACORA */}
          {activeMenu === 'Bitácora' &&
            userRolId === ROLES.ADMINISTRADOR && (
              <Bitacora />
          )}

          {/* PACIENTES */}
          {activeMenu === 'Pacientes' && (
            <ModuloPacientes />
          )}

          {/* PASSWORD */}
          {activeMenu === 'Cambiar contraseña' && (
            <CambioPasswordUI />
          )}

        </div>

      </main>

      {/* MODAL */}
      {showModalCita && (

        <AgendarCitas
          onClose={() => setShowModalCita(false)}
          user={user}
          dataMaster={dataMaster}
          isStaff={userRolId < 5}
        />

      )}

    </div>

  );

}
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

  const token = localStorage.getItem("token");

  const user = useAuthStore((state) => state.user);
  const clearStore = useAuthStore((state) => state.logout);

  const navigate = useNavigate();

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
  // HEADERS AUTH
  // =========================
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {

    try {

      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: authHeaders
      });

    } finally {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      clearStore();

      navigate('/login');

    }
  };

  // =========================
  // FETCH GENERAL
  // =========================
  const fetchTodo = async (signal) => {

    try {

      const config = {
        signal,
        headers: authHeaders
      };

      const resProc = await fetch(
        `${API_URL}/procedimientos`,
        config
      ).then(r => r.json());

      const resDoc = await fetch(
        `${API_URL}/odontologos`,
        config
      ).then(r => r.json());

      const resUsu = await fetch(
        `${API_URL}/usuarios?t=${Date.now()}`,
        config
      ).then(r => r.json());

      const listaUsuarios = resUsu.success
        ? resUsu.data
        : [];

      setDataMaster({
        procedimientos: resProc.success ? resProc.data : [],
        odontologos: Array.isArray(resDoc)
          ? resDoc
          : (resDoc.data || []),
        usuarios: listaUsuarios,
        pacientes: listaUsuarios.filter(
          u => u.id_rol === 5 || u.id_rol === 6
        ),
        loading: false
      });

    } catch (err) {

      if (err.name !== 'AbortError') {

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
        h-screen
        w-full
        flex
        items-center
        justify-center
        bg-[#F4F9F9]
        text-[#148F77]
        font-bold
        text-sm
        md:text-lg
        px-4
        text-center
      ">
        Cargando sesión...
      </div>
    );
  }

  return (

    <div className="
      flex
      flex-col
      md:flex-row
      h-screen
      bg-[#F4F9F9]
      font-sans
      antialiased
      overflow-hidden
      text-gray-800
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
      <main className="
        flex-1
        flex
        flex-col
        overflow-hidden
      ">

        {/* HEADER */}
        <header className="
          bg-white
          min-h-[70px]
          md:h-20
          px-4
          md:px-10
          py-3
          flex
          items-center
          border-b
          border-gray-100
          shadow-sm
        ">

          <div className="
            text-[9px]
            md:text-[10px]
            font-black
            text-gray-300
            uppercase
            tracking-widest
            italic
            break-words
          ">

            Clínica Alba /

            <span className="text-[#148F77] font-black">
              {" "}{activeMenu}
            </span>

          </div>

        </header>

        {/* CONTENT */}
        <div className="
          flex-1
          overflow-y-auto
          p-4
          md:p-10
        ">

          {/* DASHBOARDS */}
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

          {/* MODULO EN DESARROLLO */}
          {![
            'Panel de Control',
            'Usuarios y Roles',
            'Cambiar contraseña',
            'Pacientes',
            'Bitácora'
          ].includes(activeMenu) && (

            <div className="
              h-full
              flex
              flex-col
              items-center
              justify-center
              opacity-20
              text-center
              px-4
            ">

              <p className="
                text-4xl
                md:text-6xl
                mb-4
              ">
                ⚙️
              </p>

              <p className="
                font-black
                uppercase
                tracking-[0.2em]
                md:tracking-[0.3em]
                text-[10px]
                md:text-xs
              ">
                Módulo en Desarrollo
              </p>

            </div>

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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth_store";

import Sidebar from "../components/layout/Sidebar";

import DashboardAdmin from "../components/dashboards/DashboardAdmin";
import ModuloCitas from "../components/UIs/ModuloCitas";
import DashboardOdontologo from "../components/dashboards/DashboardOdontologo";
import DashboardRecepcionista from "../components/dashboards/DashboardRecepcionista";
import DashboardPaciente from "../components/dashboards/DashboardPaciente";

import CambioPasswordUI from "../components/UIs/CambioPassword";
import AgendarCitas from "../components/UIs/AgendarCitas";
import AgendaCitas from "../components/UIs/AgendaCitas";
import ModuloPacientes from "../components/UIs/ModuloPacientes";
import Bitacora from "../components/UIs/Bitacora";
import ModuloUsuarios from "../components/UIs/ModuloUsuarios";
import ModuloProcedimientos from "../components/UIs/ModuloProcedimientos";
import ReporteCitas from "../components/UIs/ReporteCitas";

const API_URL = import.meta.env.VITE_API_URL;
const ROLES = {
  ADMINISTRADOR: 1,
  ODONTOLOGO: 2,
  ASISTENTE: 3,
  RECEPCIONISTA: 4,
  CLIENTE: 5,
  PACIENTE: 6,
};

export default function Panel() {
  const user = useAuthStore((state) => state.user);
  const clearStore = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Panel de Control");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModalCita, setShowModalCita] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [dataMaster, setDataMaster] = useState({
    procedimientos: [],
    odontologos: [],
    usuarios: [],
    pacientes: [],
    salas: [],
    loading: true,
  });

  // =========================
  // FETCH CONFIG
  // =========================
  const fetchConfig = (signal) => ({
    signal,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id_sesion: user?.id_sesion,
          id_usuario: user?.id_usuario,
        }),
      });
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      clearStore();
      navigate("/login");
    }
  };

  // =========================
  // FETCH GENERAL
  // =========================
  const fetchTodo = async (signal) => {
    try {
      const config = fetchConfig(signal);
      const rolActual = user?.rol ? Number(user.rol) : null;
      const esAdmin = rolActual === 1;

      // /api/usuarios solo está disponible para administradores
      const fetchUsuarios = esAdmin
        ? fetch(`${API_URL}/usuarios?t=${Date.now()}`, config).then((r) =>
            r.json(),
          )
        : Promise.resolve({ success: true, data: [] });

      const [resProc, resDoc, resUsu, resSalas, resPacientes] =
        await Promise.all([
          fetch(`${API_URL}/procedimientos?t=${Date.now()}`, config).then((r) => r.json()),
          fetch(`${API_URL}/odontologos`, config).then((r) => r.json()),
          fetchUsuarios,
          fetch(`${API_URL}/salas`, config).then((r) => r.json()),
          fetch(`${API_URL}/pacientes`, config).then((r) => r.json()),
        ]);

      const listaUsuarios = resUsu.success ? resUsu.data : [];

      setDataMaster({
        procedimientos: resProc.success ? resProc.data : [],
        odontologos: Array.isArray(resDoc) ? resDoc : resDoc.data || [],
        usuarios: listaUsuarios,
        pacientes: resPacientes.success ? resPacientes.data : [],
        salas: resSalas.success ? resSalas.data : [],
        loading: false,
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.log(err);
        setDataMaster((prev) => ({ ...prev, loading: false }));
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTodo(controller.signal);
    return () => controller.abort();
  }, []);

  const userRolId = user?.rol ? Number(user.rol) : null;

  // =========================
  // LOADING
  // =========================
  if (!userRolId && dataMaster.loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F4F9F9] text-[#148F77] font-bold">
        Cargando sesión...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F4F9F9] font-sans antialiased overflow-hidden text-gray-800">
      <Sidebar
        user={user}
        dataMaster={dataMaster}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        userRolId={userRolId}
        logout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 shadow-sm px-4 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-[#148F77]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-widest italic">
              Clínica Alba /{" "}
              <span className="text-[#148F77] font-black">{activeMenu}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          {/* PANEL DE CONTROL / DASHBOARDS */}
          {activeMenu === "Panel de Control" &&
            (userRolId === ROLES.ADMINISTRADOR ? (
              <DashboardAdmin
                setView={(v) =>
                  setActiveMenu(
                    v === "bitacora" ? "Bitácora" : "Panel de Control",
                  )
                }
              />
            ) : userRolId === ROLES.ODONTOLOGO ? (
              <DashboardOdontologo openModal={() => setShowModalCita(true)} />
            ) : userRolId === ROLES.RECEPCIONISTA ? (
              <DashboardRecepcionista
                openModal={() => setShowModalCita(true)}
              />
            ) : (
              <DashboardPaciente openModal={() => setShowModalCita(true)} />
            ))}

          {/* GESTIÓN DE USUARIOS */}
          {activeMenu === "Usuarios y Roles" &&
            userRolId === ROLES.ADMINISTRADOR && <ModuloUsuarios />}

          {/* BITÁCORA */}
          {activeMenu === "Bitácora" && userRolId === ROLES.ADMINISTRADOR && (
            <Bitacora />
          )}

          {/* PACIENTES */}
          {activeMenu === "Pacientes" && <ModuloPacientes />}

          {/* CONTRASEÑA */}
          {activeMenu === "Cambiar contraseña" && <CambioPasswordUI />}

          {/* CITAS */}
          {activeMenu === "Citas" && (
            <ModuloCitas
              openModal={() => setShowModalCita(true)}
              openAgendaModal={() => setShowAgendaModal(true)}
              dataMaster={dataMaster}
              user={user}
            />
          )}

          {/* PROCEDIMIENTOS */}
          {activeMenu === "Procedimientos" && (
            <ModuloProcedimientos dataMaster={dataMaster} onRefresh={() => fetchTodo()} />
          )}

          {/* REPORTES */}
          {activeMenu === "Reportes" && (
            <ReporteCitas dataMaster={dataMaster} user={user} />
          )}

          {/* MÓDULO EN DESARROLLO */}
          {![
            "Panel de Control",
            "Usuarios y Roles",
            "Cambiar contraseña",
            "Pacientes",
            "Bitácora",
            "Citas",
            "Procedimientos",
            "Reportes"
          ].includes(activeMenu) && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <p className="text-4xl md:text-6xl mb-4">⚙️</p>
              <p className="font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">
                Módulo en Desarrollo
              </p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL AGENDAR */}
      {showModalCita && (
        <AgendarCitas
          onClose={() => setShowModalCita(false)}
          user={user}
          dataMaster={dataMaster}
          isStaff={userRolId < 5}
          onRefresh={() => fetchTodo()}
        />
      )}

      {/* MODAL AGENDA */}
      {showAgendaModal && (
        <AgendaCitas
          onClose={() => setShowAgendaModal(false)}
          dataMaster={dataMaster}
          user={user}
        />
      )}
    </div>
  );
}
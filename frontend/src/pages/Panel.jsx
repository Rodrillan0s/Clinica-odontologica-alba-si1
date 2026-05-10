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

  const [activeMenu, setActiveMenu] = useState("Citas");

  const [showModalCita, setShowModalCita] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

      const fetchUsuarios = esAdmin
        ? fetch(`${API_URL}/usuarios?t=${Date.now()}`, config).then((r) =>
            r.json(),
          )
        : Promise.resolve({
            success: true,
            data: [],
          });

      const [resProc, resDoc, resUsu, resSalas, resPacientes] =
        await Promise.all([
          fetch(`${API_URL}/procedimientos`, config).then((r) => r.json()),
          fetch(`${API_URL}/odontologos`, config).then((r) => r.json()),
          fetchUsuarios,
          fetch(`${API_URL}/salas`, config).then((r) => r.json()),
          fetch(`${API_URL}/pacientes`, config).then((r) => r.json()),
        ]);

      setDataMaster({
        procedimientos: resProc.success ? resProc.data : [],
        odontologos: Array.isArray(resDoc)
          ? resDoc
          : resDoc.data || [],
        usuarios: resUsu.success ? resUsu.data : [],
        pacientes: resPacientes.success
          ? resPacientes.data
          : [],
        salas: resSalas.success ? resSalas.data : [],
        loading: false,
      });
    } catch (err) {
      if (err.name !== "AbortError") {
        console.log(err);

        setDataMaster((prev) => ({
          ...prev,
          loading: false,
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
      <div className="min-h-screen flex items-center justify-center bg-[#F4F9F9] text-[#148F77] font-bold">
        Cargando sesión...
      </div>
    );
  }

  // =========================
  // RENDER MODULOS
  // =========================

  const renderContent = () => {
    switch (activeMenu) {
      case "Panel de Control":
        return userRolId === ROLES.ADMINISTRADOR ? (
          <DashboardAdmin
            setView={(v) =>
              setActiveMenu(
                v === "bitacora"
                  ? "Bitácora"
                  : "Panel de Control",
              )
            }
          />
        ) : userRolId === ROLES.ODONTOLOGO ? (
          <DashboardOdontologo
            openModal={() => setShowModalCita(true)}
          />
        ) : userRolId === ROLES.RECEPCIONISTA ? (
          <DashboardRecepcionista
            openModal={() => setShowModalCita(true)}
          />
        ) : (
          <DashboardPaciente
            openModal={() => setShowModalCita(true)}
          />
        );

      case "Usuarios y Roles":
        return userRolId === ROLES.ADMINISTRADOR ? (
          <ModuloUsuarios />
        ) : null;

      case "Bitácora":
        return userRolId === ROLES.ADMINISTRADOR ? (
          <Bitacora />
        ) : null;

      case "Pacientes":
        return <ModuloPacientes />;

      case "Cambiar contraseña":
        return <CambioPasswordUI />;

      case "Citas":
        return (
          <ModuloCitas
            openModal={() => setShowModalCita(true)}
            openAgendaModal={() => setShowAgendaModal(true)}
            dataMaster={dataMaster}
            user={user}
          />
        );

      default:
        return (
          <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
            <p className="text-6xl mb-4">⚙️</p>

            <p className="font-black uppercase tracking-[0.3em] text-xs">
              Módulo en Desarrollo
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F9F9] text-gray-800 overflow-hidden">

      {/* SIDEBAR */}
      <Sidebar
        user={user}
        dataMaster={dataMaster}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        userRolId={userRolId}
        logout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* HEADER */}
        <header className="bg-white min-h-[80px] px-4 md:px-10 flex items-center justify-between border-b border-gray-100 shadow-sm">

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden text-2xl text-[#148F77]"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="text-[10px] md:text-xs font-black text-gray-300 uppercase tracking-widest italic">
            Clínica Alba /
            <span className="text-[#148F77] ml-2">
              {activeMenu}
            </span>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          {renderContent()}
        </div>
      </main>

      {/* MODAL AGENDAR */}
      {showModalCita && (
        <AgendarCitas
          onClose={() => setShowModalCita(false)}
          user={user}
          dataMaster={dataMaster}
          isStaff={userRolId < 5}
          onRefresh={() => {
            const controller = new AbortController();
            fetchTodo(controller.signal);
          }}
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
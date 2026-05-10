import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth_store";

import Sidebar from "../components/layout/Sidebar";

import DashboardAdmin from "../components/dashboards/DashboardAdmin";
import ModuloCitas from "../components/UIs/ModuloCitas";
import DashboardOdontologo from "../components/dashboards/DashboardOdontologo";
import DashboardRecepcionista from "../components/dashboards/DashboardRecepcionista";
import DashboardPaciente from "../components/dashboards/DashboardPaciente";

import AdminUI from "../components/UIs/Admin";
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
  const token = localStorage.getItem("token");

  const user = useAuthStore((state) => state.user);
  const clearStore = useAuthStore((state) => state.logout);

  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("Panel de Control");
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
  // HEADERS AUTH
  // =========================
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
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
      const config = {
        signal,
        credentials: "include",
        headers: authHeaders,
      };

      const resProc = await fetch(`${API_URL}/procedimientos`, config).then(
        (r) => r.json(),
      );
      const resDoc = await fetch(`${API_URL}/odontologos`, config).then((r) =>
        r.json(),
      );
      const resUsu = await fetch(
        `${API_URL}/usuarios?t=${Date.now()}`,
        config,
      ).then((r) => r.json());
      const resSalas = await fetch(`${API_URL}/salas`, config).then((r) =>
        r.json(),
      );

      const resPacientes = await fetch(`${API_URL}/pacientes`, config).then(
        (r) => r.json(),
      );

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
      if (err.name !== "AbortError")
        setDataMaster((prev) => ({ ...prev, loading: false }));
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
            Clínica Alba /{" "}
            <span className="text-[#148F77] font-black">{activeMenu}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10">
          {/* PANEL DE CONTROL / DASHBOARDS */}
          {activeMenu === "Panel de Control" &&
            (userRolId === ROLES.ADMINISTRADOR ? (
              /* PASAMOS setView PARA QUE EL BOTÓN NARANJA FUNCIONE */
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
            userRolId === ROLES.ADMINISTRADOR && (
              <AdminUI dataMaster={dataMaster} onRefresh={() => fetchTodo()} />
            )}

          {/* NUEVA VISTA: BITÁCORA (AUDITORÍA) */}
          {activeMenu === "Bitácora" && userRolId === ROLES.ADMINISTRADOR && (
            <Bitacora />
          )}

          {activeMenu === "Pacientes" && <ModuloPacientes />}
          {activeMenu === "Cambiar contraseña" && <CambioPasswordUI />}
          {activeMenu === "Citas" && (
            <ModuloCitas
              openModal={() => setShowModalCita(true)}
              openAgendaModal={() => setShowAgendaModal(true)}
              dataMaster={dataMaster}
              user={user}
            />
          )}

          {/* ESTADO DE DESARROLLO */}
          {![
            "Panel de Control",
            "Usuarios y Roles",
            "Cambiar contraseña",
            "Pacientes",
            "Bitácora",
            "Citas",
          ].includes(activeMenu) && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <p className="text-6xl mb-4">⚙️</p>
              <p className="font-black uppercase tracking-[0.3em] text-xs">
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
          onRefresh={() => fetchTodo()}
        />
      )}

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

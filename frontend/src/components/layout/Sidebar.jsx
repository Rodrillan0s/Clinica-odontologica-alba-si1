import { useState } from "react";
import logo from "../../assets/LOGOTIPO.png";

const ROLES = {
  ADMINISTRADOR: 1,
  ODONTOLOGO: 2,
  ASISTENTE: 3,
  RECEPCIONISTA: 4,
  CLIENTE: 5,
  PACIENTE: 6,
};

export default function Sidebar({
  activeMenu,
  setActiveMenu,
  user,
  dataMaster,
  userRolId,
  logout,
  sidebarOpen = false,
  setSidebarOpen = () => {},
}) {
  const [openMenus, setOpenMenus] = useState({
    citas: true,
    usuarios: true,
    pacientes: true,
    administracion: false,
  });

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const currentUserData =
    dataMaster?.usuarios?.find(
      (u) =>
        u.id_usuario === user?.id_usuario ||
        u.correo === user?.correo,
    ) || user;

  const usernameDisplay =
    currentUserData?.nombre_usuario ||
    currentUserData?.correo?.split("@")[0] ||
    "usuario";

  const getRolName = (rolId) => {
    const rolEncontrado = Object.keys(ROLES).find(
      (key) => ROLES[key] === Number(rolId),
    );

    return rolEncontrado || "CLIENTE";
  };

  const MenuItem = ({ title }) => (
    <button
      type="button"
      onClick={() => {
        setActiveMenu(title);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all
      ${
        activeMenu === title
          ? "bg-[#148F77] text-white shadow-lg"
          : "text-gray-500 hover:bg-emerald-50 hover:text-[#148F77]"
      }`}
    >
      <span className="font-bold text-xs">{title}</span>
    </button>
  );

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative top-0 left-0 z-50
          h-screen w-72 bg-white border-r border-gray-100
          flex flex-col shadow-xl transition-transform duration-300
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        {/* HEADER */}
        <div className="p-8 flex items-center justify-between border-b border-gray-100">
          <img src={logo} alt="Alba" className="h-10" />

          <button
            className="md:hidden text-2xl text-gray-400"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* USER */}
        <div className="p-6 flex flex-col items-center border-b border-gray-100">
          <div
            className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black mb-3 shadow-lg
            ${
              Number(userRolId) === 1
                ? "bg-orange-50 text-orange-600"
                : "bg-[#148F77] text-white"
            }`}
          >
            {currentUserData?.nombre?.charAt(0) || "U"}
          </div>

          <h3 className="text-[#2A5C4D] font-black text-[11px] text-center uppercase">
            {currentUserData?.nombre || "Usuario"}
          </h3>

          <p className="text-gray-400 text-[10px] font-bold mt-1 tracking-widest lowercase">
            @{usernameDisplay}
          </p>

          <p className="text-[#148F77] text-[8px] font-black uppercase mt-3 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            {getRolName(userRolId)}
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* CITAS */}
          <div>
            <button
              type="button"
              onClick={() => toggleMenu("citas")}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
            >
              <span>Citas</span>
              <span>{openMenus.citas ? "−" : "+"}</span>
            </button>

            {openMenus.citas && (
              <div className="mt-2 space-y-2">
          
                <MenuItem title="Citas" />
              </div>
            )}
          </div>

          {/* USUARIOS */}
          {Number(userRolId) === 1 && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu("usuarios")}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                <span>Usuarios</span>
                <span>{openMenus.usuarios ? "−" : "+"}</span>
              </button>

              {openMenus.usuarios && (
                <div className="mt-2 space-y-2">
                  <MenuItem title="Usuarios y Roles" />
                  <MenuItem title="Cambiar contraseña" />
                </div>
              )}
            </div>
          )}

          {/* PACIENTES */}
          {[1, 2, 4].includes(Number(userRolId)) && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu("pacientes")}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                <span>Pacientes</span>
                <span>{openMenus.pacientes ? "−" : "+"}</span>
              </button>

              {openMenus.pacientes && (
                <div className="mt-2 space-y-2">
                  <MenuItem title="Pacientes" />
                </div>
              )}
            </div>
          )}

          {/* ADMINISTRACION */}
          {Number(userRolId) === 1 && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu("administracion")}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400"
              >
                <span>Administración</span>
                <span>{openMenus.administracion ? "−" : "+"}</span>
              </button>

              {openMenus.administracion && (
                <div className="mt-2 space-y-2">
                  <MenuItem title="Bitácora" />
                </div>
              )}
            </div>
          )}
        </nav>

        {/* FOOTER */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full py-4 rounded-2xl text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}
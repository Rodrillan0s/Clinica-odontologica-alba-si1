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
}) {
  // Buscamos datos extendidos en la lista de usuarios cargada
  const currentUserData =
    dataMaster.usuarios.find(
      (u) => u.id_usuario === user?.id_usuario || u.correo === user?.correo,
    ) || user;

  const usernameDisplay =
    currentUserData?.nombre_usuario ||
    currentUserData?.correo?.split("@")[0] ||
    "usuario";

  const getRolName = (rolId) => {
    const rolEncontrado = Object.keys(ROLES).find(
      (key) => ROLES[key] === Number(rolId),
    );
    return rolEncontrado ? rolEncontrado : "CLIENTE";
  };

  const menuItems = [
    { text: "Panel de Control", roles: [1, 2, 3, 4, 5, 6] },
    { text: "Usuarios y Roles", roles: [1] },
    { text: "Gestión Clínica", roles: [1, 2, 3] },
    { text: "Citas", roles: [1, 2, 3, 4, 5, 6] },
    { text: "Pacientes", roles: [1, 2, 4] },

    { text: "Cambiar contraseña", roles: [1, 2, 3, 4, 5, 6] },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-sm">
      <div className="p-8 flex justify-center border-b border-gray-50">
        <img src={logo} alt="Alba" className="h-10" />
      </div>

      <div className="p-6 flex flex-col items-center border-b border-gray-50 bg-gray-50/10">
        <div
          className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black mb-3 shadow-lg ${userRolId === 1 ? "bg-orange-50 text-orange-600" : "bg-[#148F77] text-white"}`}
        >
          {currentUserData?.nombre?.charAt(0) || "U"}
        </div>
        <h3 className="text-[#2A5C4D] font-black text-[11px] text-center leading-tight px-4 uppercase">
          {currentUserData?.nombre || "Usuario"}
        </h3>
        <p className="text-gray-400 text-[10px] font-bold mt-1 tracking-widest lowercase transition-all">
          @{usernameDisplay}
        </p>
        <p className="text-[#148F77] text-[8px] font-black uppercase mt-3 bg-emerald-50 px-3 py-1.5 rounded-full shadow-sm border border-emerald-100">
          {getRolName(userRolId)}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems
          .filter((item) => item.roles.includes(Number(userRolId)))
          .map((item) => (
            <button
              key={item.text}
              onClick={() => setActiveMenu(item.text)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeMenu === item.text ? "bg-[#148F77] text-white shadow-xl" : "text-gray-400 hover:bg-emerald-50 hover:text-[#148F77]"}`}
            >
              <span className="font-bold text-xs">{item.text}</span>
            </button>
          ))}
      </nav>

      <div className="p-6 border-t">
        <button
          onClick={logout}
          className="w-full py-4 rounded-2xl text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

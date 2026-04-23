import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth_store';
import logo from '../assets/LOGOTIPO.png';

const API_URL = import.meta.env.VITE_API_URL;
const ROLES = { 
    ADMINISTRADOR: 1, 
    ODONTOLOGO: 2, 
    ASISTENTE: 3, 
    RECEPCIONISTA: 4, 
    CLIENTE: 5, 
    PACIENTE: 6 
};

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
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

  const fetchTodo = async (signal) => {
    try {
      // Peticiones secuenciales para evitar saturación del backend
      const resProc = await fetch(`${API_URL}/procedimientos`, { signal }).then(r => r.json());
      const resDoc = await fetch(`${API_URL}/odontologos`, { signal }).then(r => r.json());
      const resUsu = await fetch(`${API_URL}/usuarios?t=${Date.now()}`, { signal }).then(r => r.json());
      
      const listaUsuarios = resUsu.success ? resUsu.data : [];
      const listaPacientes = listaUsuarios.filter(u => u.id_rol === 5 || u.id_rol === 6);

      setDataMaster({
        procedimientos: resProc.success ? resProc.data : [],
        odontologos: Array.isArray(resDoc) ? resDoc : (resDoc.data || []),
        usuarios: listaUsuarios,
        pacientes: listaPacientes,
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

  const userRolId = Number(user?.rol) || ROLES.CLIENTE;
  const isStaff = userRolId < ROLES.CLIENTE;
  const isAdmin = userRolId === ROLES.ADMINISTRADOR;

  const getRolName = (rolId) => {
      const rolEncontrado = Object.keys(ROLES).find(key => ROLES[key] === rolId);
      return rolEncontrado ? rolEncontrado : 'USUARIO';
  };

  const menuItems = [
    { text: "Panel de Control", roles: [1,2,3,4,5,6] },
    { text: "Usuarios y Roles", roles: [1] },
    { text: "Gestión Clínica", roles: [1,2,3] },
    { text: "Agenda General", roles: [1,2,3,4] },
    { text: "Pacientes", roles: [1,2,4] },
    { text: "Mis Citas", roles: [5,6] },
    { text: "Cambiar contraseña", roles: [1,2,3,4,5,6] }
  ];

  const currentUserData = dataMaster.usuarios.find(u => u.id_usuario === user?.id_usuario) || user;
  const usernameDisplay = currentUserData?.nombre_usuario || currentUserData?.correo?.split('@')[0] || 'cuenta';

  return (
    <div className="flex h-screen bg-[#F4F9F9] font-sans antialiased overflow-hidden text-gray-800">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-sm">
        <div className="p-8 flex justify-center border-b border-gray-50">
            <img src={logo} alt="Alba" className="h-10" />
        </div>
        
        <div className="p-6 flex flex-col items-center border-b border-gray-50 bg-gray-50/10">
          <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black mb-3 shadow-lg ${isAdmin ? 'bg-orange-50 text-orange-600' : isStaff ? 'bg-emerald-50 text-[#148F77]' : 'bg-[#148F77] text-white'}`}>
            {currentUserData?.nombre?.charAt(0) || 'U'}
          </div>
          
          <h3 className="text-[#2A5C4D] font-black text-[11px] text-center leading-tight px-4 uppercase">
              {currentUserData?.nombre || 'Usuario'}
          </h3>
          
          <p className="text-gray-400 text-[10px] font-bold mt-1 tracking-widest lowercase transition-all">
              @{usernameDisplay}
          </p>

          <p className="text-[#148F77] text-[8px] font-black uppercase mt-3 bg-emerald-50 px-3 py-1.5 rounded-full shadow-sm border border-emerald-100">
            {getRolName(userRolId)}
          </p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.filter(item => item.roles.includes(userRolId)).map((item) => (
            <button
              key={item.text}
              onClick={() => setActiveMenu(item.text)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all ${activeMenu === item.text ? 'bg-[#148F77] text-white shadow-xl' : 'text-gray-400 hover:bg-emerald-50 hover:text-[#148F77]'}`}
            >
              <span className="font-bold text-xs">{item.text}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t">
            <button 
                onClick={() => { logout(); navigate('/login'); }} 
                className="w-full py-4 rounded-2xl text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
            >
                Cerrar Sesión
            </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-20 px-10 flex items-center border-b border-gray-50 shadow-sm">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic tracking-tighter">
              Clínica Alba / <span className="text-[#148F77] font-black">{activeMenu}</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-10">
          {activeMenu === 'Panel de Control' && (
            isAdmin ? <DashboardAdmin /> :
            isStaff ? <DashboardStaff openModal={() => setShowModalCita(true)} /> :
            <DashboardPaciente openModal={() => setShowModalCita(true)} />
          )}

          {activeMenu === 'Usuarios y Roles' && isAdmin && (
              <GestionUsuariosView dataMaster={dataMaster} onRefresh={() => fetchTodo()} />
          )}
          
          {activeMenu === 'Cambiar contraseña' && <CambiarPasswordView />}

          {activeMenu !== 'Panel de Control' && activeMenu !== 'Usuarios y Roles' && activeMenu !== 'Cambiar contraseña' && (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
                <p className="text-6xl mb-4">⚙️</p>
                <p className="font-black uppercase tracking-[0.3em] text-xs">Módulo en Desarrollo</p>
            </div>
          )}
        </div>
      </main>

      {showModalCita && (
          <ModalNuevaCita onClose={() => setShowModalCita(false)} user={user} dataMaster={dataMaster} isStaff={isStaff} />
      )}
    </div>
  );
}


// Cambio de Contraseña (Todos los usuarios pueden cambiar su contraseña)
function CambiarPasswordView() {
  const user = useAuthStore(state => state.user);
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", confirmar: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ mensaje: "", tipo: "" });

  const notify = (mensaje, tipo = "success") => {
      setToast({ mensaje, tipo });
      setTimeout(() => setToast({ mensaje: "", tipo: "" }), 4500);
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!passwords.actual || !passwords.nueva || !passwords.confirmar) return notify("Por favor, completa todos los campos", "error");
      if (passwords.nueva !== passwords.confirmar) return notify("Las contraseñas nuevas no coinciden", "error");
      if (passwords.actual === passwords.nueva) return notify("La nueva contraseña no puede ser igual a la actual", "error");
      if (passwords.nueva.length < 8) return notify("La contraseña debe tener al menos 8 caracteres", "error");
      if (!/[A-Z]/.test(passwords.nueva)) return notify("La contraseña debe incluir al menos una mayúscula", "error");
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwords.nueva)) return notify("La contraseña debe incluir al menos un símbolo especial", "error");

      setLoading(true);
      try {
          const res = await fetch(`${API_URL}/usuarios/${user.id_usuario}/password`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  password_actual: passwords.actual,
                  nueva_password: passwords.nueva
              })
          }).then(r => r.json());

          if (res.success) {
              notify("Contraseña actualizada correctamente");
              setPasswords({ actual: "", nueva: "", confirmar: "" });
          } else {
              notify(res.message, "error");
          }
      } catch (err) {
          notify("Error de conexión con el servidor", "error");
      } finally {
          setLoading(false);
      }
  };

  return (
      <div className="animate-fade-in relative max-w-2xl mx-auto mt-10">
          {toast.mensaje && (
              <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest animate-fade-in-up border-b-4 ${
                  toast.tipo === 'error' ? 'bg-red-500 text-white border-red-700' : 'bg-[#148F77] text-white border-emerald-900'
              }`}>
                  {toast.tipo === 'error' ? '⚠️ ' : '✓ '} {toast.mensaje}
              </div>
          )}

          <div className="mb-8">
              <h2 className="text-3xl font-black text-[#2A5C4D] tracking-tighter italic">FORMULARIO DE CAMBIO DE CONTRASEÑA</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Asegurése de cambiar su contraseña regularmente</p>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contraseña Actual</label>
                      <input 
                          type="password" required
                          className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50"
                          value={passwords.actual}
                          onChange={e => setPasswords({...passwords, actual: e.target.value})}
                      />
                  </div>
                  
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nueva Contraseña</label>
                      <input 
                          type="password" required minLength="8"
                          className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50"
                          value={passwords.nueva}
                          onChange={e => setPasswords({...passwords, nueva: e.target.value})}
                      />
                      <p className="text-[8px] text-gray-400 ml-2 font-bold uppercase tracking-widest">
                          Recuerde su contraseña, es su responsabilidad mantenerla segura.
                      </p>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Confirmar Nueva Contraseña</label>
                      <input 
                          type="password" required minLength="8"
                          className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50"
                          value={passwords.confirmar}
                          onChange={e => setPasswords({...passwords, confirmar: e.target.value})}
                      />
                  </div>

                  <button 
                      type="submit" disabled={loading}
                      className="w-full py-5 mt-4 bg-[#148F77] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-[#0e6352] active:scale-95 transition-all"
                  >
                      {loading ? "COMPROBANDO..." : "ACTUALIZAR CONTRASEÑA"}
                  </button>
              </form>
          </div>
      </div>
  );
}


// VISTAS Y DASHBOARDS (ROLES)
function GestionUsuariosView({ dataMaster, onRefresh }) {
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nombre_usuario: "", correo: "", id_rol: "" });
  
  const [toast, setToast] = useState({ mensaje: "", tipo: "" });
  const [loading, setLoading] = useState(false);
  
  // ESTADO PARA EL MODAL DE CONFIRMACIÓN DE ELIMINAR
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const notify = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast({ mensaje: "", tipo: "" }), 4000);
  };

  const handleIniciarEdicion = (u) => {
    setEditando(u.id_usuario);
    setFormEdit({ 
        nombre_usuario: u.nombre_usuario || u.correo?.split('@')[0] || '', 
        correo: u.correo, 
        id_rol: u.id_rol 
    });
  };

  const handleGuardarCambios = async (idUsuario) => {
    try {
      const res = await fetch(`${API_URL}/usuarios/${idUsuario}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              nombre_usuario: formEdit.nombre_usuario,
              correo: formEdit.correo,
              id_rol: Number(formEdit.id_rol)
          })
      }).then(r => r.json());
      
      if (res.success) {
          notify("Registro actualizado correctamente");
          setEditando(null);
          onRefresh();
          
          if (idUsuario === user.id_usuario && Number(formEdit.id_rol) !== user.rol) {
              setTimeout(() => { logout(); navigate('/login'); }, 1500);
          }
      } else { 
          notify(res.message, "error"); 
      }
    } catch (err) { 
        notify("Error al procesar la solicitud", "error"); 
    }
  };

  // FUNCIÓN MODIFICADA PARA ABRIR EL MODAL EN LUGAR DE USAR ALERT()
  const confirmarEliminacion = (id) => {
      if (id === user.id_usuario) {
          notify("No puedes eliminar tu propia cuenta", "error");
          return;
      }
      setUsuarioAEliminar(id);
  };

  const handleEliminar = async () => {
    if (!usuarioAEliminar) return;
    try {
        const res = await fetch(`${API_URL}/usuarios/${usuarioAEliminar}`, { method: 'DELETE' }).then(r => r.json());
        if (res.success) {
            notify("Registro eliminado correctamente");
            onRefresh();
        } else { 
            notify(res.message, "error"); 
        }
    } catch { 
        notify("Error al procesar la solicitud", "error"); 
    } finally {
        setUsuarioAEliminar(null); // Cierra el modal
    }
  };

  const usuariosFiltrados = dataMaster.usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-20 relative">
        {toast.mensaje && (
            <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest animate-fade-in-up border-b-4 ${
                toast.tipo === 'error' ? 'bg-red-500 text-white border-red-700' : 'bg-[#148F77] text-white border-emerald-900'
            }`}>
                {toast.tipo === 'error' ? '⚠️ ' : '✓ '} {toast.mensaje}
            </div>
        )}

        {/* MODAL DE CONFIRMACIÓN PERSONALIZADO (REEMPLAZA AL WINDOW.CONFIRM) */}
        {usuarioAEliminar && (
            <div className="fixed inset-0 bg-[#2A5C4D]/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-up text-center p-10 border-t-8 border-red-500">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-6">⚠️</div>
                    <h3 className="text-2xl font-black text-[#2A5C4D] mb-2 tracking-tighter">Eliminar Usuario</h3>
                    <p className="text-gray-400 text-xs mb-8 leading-relaxed">
                        ¿Estás seguro que deseas eliminar permanentemente este acceso? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => setUsuarioAEliminar(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Cancelar</button>
                        <button onClick={handleEliminar} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all">Eliminar</button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <div>
                <h2 className="text-3xl font-black text-[#2A5C4D] tracking-tighter italic">Gestión de Acceso</h2>
                <button 
                    onClick={onRefresh} 
                    className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
                >
                    <span className={loading ? 'animate-spin' : ''}>↻</span>
                    {loading ? 'Actualizando...' : 'Actualizar Datos'}
                </button>
            </div>
            
            <div className="relative w-full md:w-96 group">
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre, e-mail o cuenta..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-bold shadow-sm focus:ring-4 focus:ring-emerald-50 outline-none transition-all" 
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)} 
                />
                <span className="absolute left-5 top-4.5 text-lg opacity-20">🔍</span>
            </div>
        </div>
        
        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <tr>
                        <th className="px-10 py-7">Identidad y Cuenta</th>
                        <th className="px-10 py-7">Contacto</th>
                        <th className="px-10 py-7">Privilegios</th>
                        <th className="px-10 py-7 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {usuariosFiltrados.map(u => {
                        const tableUsername = u.nombre_usuario || u.correo?.split('@')[0] || 'usuario';

                        return (
                        <tr key={u.id_usuario} className="hover:bg-emerald-50/20 transition-colors group">
                            <td className="px-10 py-6">
                                {editando === u.id_usuario ? (
                                    <div>
                                        <div className="text-[8px] text-gray-400 font-bold mb-1 uppercase tracking-widest">
                                            Nombre de Usuario
                                        </div>
                                        <input 
                                            className="bg-emerald-50 border-none text-[#148F77] text-xs font-black rounded-lg px-4 py-2 w-full outline-none focus:ring-2 focus:ring-emerald-200" 
                                            value={formEdit.nombre_usuario} 
                                            onChange={(e) => setFormEdit({...formEdit, nombre_usuario: e.target.value})} 
                                            placeholder="Nuevo @usuario..."
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="font-black text-xs text-[#2A5C4D] flex items-center gap-2">
                                            {u.nombre}
                                            {u.id_usuario === user.id_usuario && ( 
                                                <span className="bg-orange-100 text-orange-600 text-[7px] px-2 py-0.5 rounded-full font-black">
                                                    MÍ PERFIL
                                                </span> 
                                            )}
                                        </div>
                                        <div className="text-[9px] text-gray-400 font-bold lowercase tracking-widest mt-1">
                                            @{tableUsername}
                                        </div>
                                    </div>
                                )}
                            </td>

                            <td className="px-10 py-6">
                                {editando === u.id_usuario ? (
                                    <input 
                                        className="bg-emerald-50 border-none text-[#148F77] text-xs font-black rounded-xl px-4 py-2 w-full outline-none" 
                                        value={formEdit.correo} 
                                        onChange={(e) => setFormEdit({...formEdit, correo: e.target.value})} 
                                    />
                                ) : (
                                    <div className="text-xs text-gray-400 font-medium italic">
                                        {u.correo}
                                    </div>
                                )}
                            </td>

                            <td className="px-10 py-6">
                                {editando === u.id_usuario ? (
                                    <select 
                                        disabled={u.id_usuario === user.id_usuario} 
                                        className={`text-[10px] font-black rounded-xl px-4 py-2 outline-none border-2 transition-all ${ 
                                            u.id_usuario === user.id_usuario ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-emerald-100 text-[#148F77] focus:ring-2 focus:ring-emerald-200' 
                                        }`} 
                                        value={formEdit.id_rol} 
                                        onChange={(e) => setFormEdit({...formEdit, id_rol: e.target.value})}
                                    >
                                        <option value="1">ADMINISTRADOR</option>
                                        <option value="2">ODONTOLOGO</option>
                                        <option value="4">RECEPCIONISTA</option>
                                        <option value="6">PACIENTE</option>
                                    </select>
                                ) : (
                                    <div className={`inline-block px-4 py-1.5 text-[9px] font-black rounded-full border ${ 
                                        u.id_rol === 1 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-emerald-50 text-[#148F77] border-emerald-100' 
                                    }`}>
                                        {u.rol_nombre}
                                    </div>
                                )}
                            </td>

                            <td className="px-10 py-6 text-center">
                                {editando === u.id_usuario ? (
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => handleGuardarCambios(u.id_usuario)} 
                                            className="bg-[#148F77] text-white px-5 py-2.5 rounded-2xl text-[9px] font-black shadow-lg hover:bg-[#0e6352] active:scale-95 transition-all"
                                        >
                                            GUARDAR
                                        </button>
                                        <button 
                                            onClick={() => setEditando(null)} 
                                            className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-2xl text-[9px] font-black"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-center gap-6">
                                        <button 
                                            onClick={() => handleIniciarEdicion(u)} 
                                            className="text-[#148F77] hover:text-[#2A5C4D] text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Editar
                                        </button>
                                        {u.id_usuario !== user.id_usuario && (
                                            <button 
                                                onClick={() => confirmarEliminacion(u.id_usuario)} 
                                                className="text-red-300 hover:text-red-600 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    );})}
                </tbody>
            </table>
        </div>
    </div>
  );
}


// MODAL DE CITA (PROTEGIDO Y OPTIMIZADO)
function ModalNuevaCita({ onClose, user, isStaff, dataMaster }) {
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const userRolId = Number(user?.rol);
  const isOdontologo = userRolId === ROLES.ODONTOLOGO;
  
  const [odontologosFiltrados, setOdontologosFiltrados] = useState(dataMaster.odontologos);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  
  const [formData, setFormData] = useState({
    fecha_base: '', 
    hora_seleccionada: '', 
    id_paciente: isStaff ? '' : (user?.id_persona || user?.id_usuario || ''), 
    id_odontologo: isOdontologo ? (user?.id_persona || user?.id_usuario || '') : '', 
    id_sala: '', 
    cita_obs: '', 
    id_procedimiento: ''
  });

  const abortDoc = useRef(null);
  const abortSlots = useRef(null);
  const hoy = new Date().toISOString().split('T')[0];

  const salas = useMemo(() => [
    { id: 1, nombre: "Consultorio 1" }, 
    { id: 2, nombre: "Quirofano A" },
    { id: 3, nombre: "Sala Rayos X" }, 
    { id: 4, nombre: "Consultorio 2" }
  ], []);

  const handleProcChange = async (idProc) => {
    if (abortDoc.current) abortDoc.current.abort();
    abortDoc.current = new AbortController();

    setFormData(prev => ({ 
        ...prev, 
        id_procedimiento: idProc, 
        id_odontologo: isOdontologo ? prev.id_odontologo : '', 
        hora_seleccionada: '' 
    }));
    setSlotsDisponibles([]);

    if (!idProc) {
        setOdontologosFiltrados(dataMaster.odontologos);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/citas/odontologos-por-procedimiento/${idProc}`, { signal: abortDoc.current.signal }).then(r => r.json());
        if (res.success) setOdontologosFiltrados(res.data);
    } catch (err) {
        if (err.name !== 'AbortError') console.error("Fallo carga especialistas");
    }
  };

  useEffect(() => {
    if (!formData.id_odontologo || !formData.id_sala || !formData.fecha_base) {
        setSlotsDisponibles([]);
        return;
    }

    const partesFecha = formData.fecha_base.split('-');
    if (partesFecha[0].length !== 4 || formData.fecha_base.length !== 10) return;

    if (abortSlots.current) abortSlots.current.abort();
    abortSlots.current = new AbortController();

    const delayDebounceFn = setTimeout(() => {
        setLoadingSlots(true);
        setErrorMessage('');
        
        const cargarSlots = async () => {
            try {
                const res = await fetch(`${API_URL}/citas/disponibilidad?id_personal=${formData.id_odontologo}&id_sala=${formData.id_sala}&fecha=${formData.fecha_base}`, { signal: abortSlots.current.signal }).then(r => r.json());
                if (res.success) {
                    let horariosFiltrados = res.data;

                    const dateObj = new Date(formData.fecha_base + "T00:00:00");
                    if (dateObj.getDay() === 6) { // Sábado
                        horariosFiltrados = horariosFiltrados.filter(slot => {
                            const horaInt = parseInt(slot.inicio.split(':')[0], 10);
                            return horaInt >= 9 && horaInt < 13;
                        });
                    }

                    setSlotsDisponibles(horariosFiltrados);
                    if (!horariosFiltrados.some(s => s.inicio === formData.hora_seleccionada)) {
                        setFormData(prev => ({ ...prev, hora_seleccionada: '' }));
                    }
                }
            } catch (err) {
                if (err.name !== 'AbortError') setErrorMessage("Error al obtener disponibilidad.");
            } finally {
                setLoadingSlots(false);
            }
        };
        cargarSlots();
    }, 450);

    return () => {
        clearTimeout(delayDebounceFn);
        if (abortSlots.current) abortSlots.current.abort();
    };
  }, [formData.id_odontologo, formData.id_sala, formData.fecha_base]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hora_seleccionada) return setErrorMessage("Selecciona una hora disponible.");
    if (!formData.id_paciente) return setErrorMessage("Debe seleccionar un paciente.");
    
    setLoading(true);
    setErrorMessage('');

    const payload = {
        fecha_agendamiento: `${formData.fecha_base} ${formData.hora_seleccionada}:00`,
        id_paciente: Number(formData.id_paciente),
        id_odontologo: Number(formData.id_odontologo),
        id_sala: Number(formData.id_sala),
        cita_obs: formData.cita_obs
    };

    try {
      const res = await fetch(`${API_URL}/citas`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (data.success) setIsSuccess(true);
      else setErrorMessage(data.message);
    } catch { 
        setErrorMessage("Error de conexión local."); 
    } finally { 
        setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2A5C4D]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[95vh] overflow-y-auto">
        {isSuccess ? (
            <div className="p-12 text-center animate-fade-in">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto animate-bounce">✓</div>
                <h3 className="text-3xl font-black text-[#2A5C4D] mb-2 tracking-tighter">¡Cita Confirmada!</h3>
                <p className="text-gray-400 text-xs mb-10">Tu cita fue registrada correctamente.</p>
                <button onClick={onClose} className="w-full py-5 bg-[#148F77] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Regresar</button>
            </div>
        ) : (
            <div className="p-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-[#2A5C4D] italic tracking-tighter">Agendar Cita</h3>
                    <button onClick={onClose} className="text-gray-300 hover:text-red-500 transition-colors">✕</button>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-[10px] font-black uppercase animate-shake">
                        ⚠️ {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {isStaff && (
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Paciente</label>
                            <select 
                                required 
                                className="w-full p-4 bg-emerald-50 text-[#148F77] rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-100" 
                                value={formData.id_paciente} 
                                onChange={e => setFormData(prev => ({...prev, id_paciente: e.target.value}))}
                            >
                                <option value="">Seleccione un paciente...</option>
                                {dataMaster.pacientes.map(p => (
                                    <option key={p.id_usuario} value={p.id_usuario || p.id_persona}>{p.nombre} - {p.correo}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">1. Tratamiento</label>
                        <select className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50" value={formData.id_procedimiento} onChange={(e) => handleProcChange(e.target.value)}>
                            <option value="">Cualquier servicio...</option>
                            {dataMaster.procedimientos.map(p => <option key={p.id} value={p.id}>{p.descripcion}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">2. Especialista</label>
                            <select 
                                required 
                                disabled={isOdontologo} 
                                className={`w-full p-4 rounded-2xl text-xs font-bold border-none outline-none ${isOdontologo ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 focus:ring-4 focus:ring-emerald-50'}`} 
                                value={formData.id_odontologo} 
                                onChange={e => setFormData(prev => ({...prev, id_odontologo: e.target.value}))}
                            >
                                <option value="">Elegir...</option>
                                {isOdontologo && !odontologosFiltrados.some(o => (o.id_personal || o.id) == formData.id_odontologo) && (
                                    <option value={formData.id_odontologo}>(Tú)</option>
                                )}
                                {odontologosFiltrados.map(o => <option key={o.id_personal || o.id} value={o.id_personal || o.id}>{o.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">3. Sala</label>
                            <select required className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50" value={formData.id_sala} onChange={e => setFormData(prev => ({...prev, id_sala: e.target.value}))}>
                                <option value="">Sala...</option>
                                {salas.map(s => <option key={s.id} value={s.id} disabled={s.id === 4}>{s.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">4. Fecha</label>
                        <input type="date" required min={hoy} max="2099-12-31" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-4 focus:ring-emerald-50" value={formData.fecha_base} 
                            onChange={e => {
                                const year = e.target.value.split('-')[0];
                                if (year.length > 4) return;
                                
                                const dateObj = new Date(e.target.value + "T00:00:00");
                                if (dateObj.getDay() === 0) {
                                    setErrorMessage("La clínica Alba no atiende los días domingo.");
                                    setFormData(prev => ({...prev, fecha_base: ''}));
                                    return;
                                }

                                setErrorMessage('');
                                setFormData(prev => ({...prev, fecha_base: e.target.value}));
                            }} 
                        />
                    </div>

                    <div className="bg-gray-50 rounded-[2rem] p-6 border border-dashed border-gray-200 min-h-[130px]">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-4 tracking-widest">5. Horarios Disponibles:</p>
                        {loadingSlots ? (
                            <div className="flex justify-center py-4 space-x-2">
                                <div className="w-2 h-2 bg-[#148F77] rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-[#148F77] rounded-full animate-bounce [animation-delay:-.3s]"></div>
                                <div className="w-2 h-2 bg-[#148F77] rounded-full animate-bounce [animation-delay:-.5s]"></div>
                            </div>
                        ) : slotsDisponibles.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                                {slotsDisponibles.map((slot, i) => (
                                    <button 
                                        key={i} 
                                        type="button" 
                                        onClick={() => setFormData(prev => ({...prev, hora_seleccionada: slot.inicio}))}
                                        className={`p-2 text-[10px] font-black rounded-xl transition-all shadow-sm ${formData.hora_seleccionada === slot.inicio ? 'bg-[#148F77] text-white' : 'bg-white text-[#148F77] hover:bg-emerald-50'}`}
                                    >
                                        {slot.inicio}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-[9px] text-gray-400 italic py-4">
                                Selecciona al doctor, una sala y una fecha. Consulta la disponibilidad del día.
                            </p>
                        )}
                    </div>

                    <textarea 
                        placeholder="Motivo de consulta / Observaciones..." 
                        required 
                        className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold h-20 border-none resize-none shadow-inner outline-none focus:ring-4 focus:ring-emerald-50" 
                        value={formData.cita_obs} 
                        onChange={e => setFormData(prev => ({...prev, cita_obs: e.target.value}))}
                    ></textarea>

                    <button type="submit" disabled={loading} className="w-full py-5 bg-[#148F77] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                        {loading ? "REGISTRANDO..." : "AGENDAR CITA"}
                    </button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
}

// VISTAS DE DASHBOARDS
function DashboardAdmin() {
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-[#2A5C4D] text-white p-12 rounded-[3rem] shadow-xl">
              <h2 className="text-3xl font-black mb-2 italic">Estado del Sistema</h2>
              <p className="opacity-70 text-xs uppercase tracking-widest mb-8">Administración</p>
              <div className="flex gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl text-center flex-1">
                      <p className="text-2xl font-black">100%</p>
                      <p className="text-[8px] uppercase font-bold opacity-50 mt-1">DISPONIBILIDAD</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl text-center flex-1">
                      <p className="text-2xl font-black">ONLINE</p>
                      <p className="text-[8px] uppercase font-bold opacity-50 mt-1">CLÍNICA ALBA</p>
                  </div>
              </div>
          </div>
          <div className="bg-orange-500 text-white p-12 rounded-[3rem] shadow-xl flex flex-col justify-center">
              <h3 className="text-xl font-black italic mb-2">AUDITORÍA</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-6">Registro de actividades y eventos importantes. Control de acceso y modificaciones.</p>
          </div>
      </div>
  );
}

function DashboardStaff({ openModal }) {
  return (
      <div onClick={openModal} className="bg-[#148F77] text-white p-12 rounded-[3rem] shadow-xl cursor-pointer hover:bg-[#0f6b59] transition-all flex justify-between items-center animate-fade-in">
          <div>
              <h2 className="text-3xl font-black italic mb-2">Operaciones Clínicas</h2>
              <p className="opacity-70 text-sm">Registrar atención presencial o cirugía</p>
          </div>
          <span className="text-5xl font-light">＋</span>
      </div>
  );
}

function DashboardPaciente({ openModal }) {
  return (
      <div className="animate-fade-in">
          <div onClick={openModal} className="bg-gradient-to-br from-[#148F77] to-[#2A5C4D] text-white p-12 rounded-[3rem] shadow-2xl cursor-pointer hover:scale-[1.01] transition-transform">
              <h2 className="text-4xl font-black mb-3 tracking-tighter italic">Cuidamos tu Sonrisa, queremos que seas la mejor versión de ti</h2>
              <p className="opacity-80 text-sm mb-10 leading-relaxed max-w-md">Agenda tu cita hoy mismo con nuestros especialistas. Horarios: Lun-Vie (08:00-19:00) y Sáb (09:00-13:00).</p>
              <div className="bg-white/20 inline-block px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-sm">
                  AGENDAR CITA ➔
              </div>
          </div>
      </div>
  );
}
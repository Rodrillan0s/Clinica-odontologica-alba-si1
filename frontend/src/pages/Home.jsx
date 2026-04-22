import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth_store';
import logo from '../assets/LOGOTIPO.png';

const API_URL = import.meta.env.VITE_API_URL;
const ROLES = { ADMINISTRADOR: 1, ODONTOLOGO: 2, ASISTENTE: 3, RECEPCIONISTA: 4, CLIENTE: 5, PACIENTE: 6 };

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState('Panel de Control');
  const [showModalCita, setShowModalCita] = useState(false);
  
  // PRECARGA DE DATOS (Rutas directas sin /api/)
  const [dataMaster, setDataMaster] = useState({ procedimientos: [], odontologos: [], loading: true });

  useEffect(() => {
    const controller = new AbortController();
    const precargar = async () => {
      try {
        const [resProc, resDoc] = await Promise.all([
          fetch(`${API_URL}/procedimientos`, { signal: controller.signal }).then(r => r.json()),
          fetch(`${API_URL}/odontologos`, { signal: controller.signal }).then(r => r.json())
        ]);
        setDataMaster({
          procedimientos: resProc.success ? resProc.data : (Array.isArray(resProc) ? resProc : []),
          odontologos: Array.isArray(resDoc) ? resDoc : (resDoc.data || []),
          loading: false
        });
      } catch (err) {
        if (err.name !== 'AbortError') setDataMaster(prev => ({ ...prev, loading: false }));
      }
    };
    precargar();
    return () => controller.abort();
  }, []);

  // LÓGICA DE ROLES
  const userRolId = Number(user?.rol) || ROLES.CLIENTE;
  const isStaff = userRolId < ROLES.CLIENTE;
  const isAdmin = userRolId === ROLES.ADMINISTRADOR;

  // MENÚ DINÁMICO
  const menuItems = [
    { text: "Panel de Control", roles: [1,2,3,4,5,6] },
    { text: "Usuarios y Roles", roles: [1] }, // Solo Admin
    { text: "Gestión Clínica", roles: [1,2,3] },
    { text: "Agenda General", roles: [1,2,3,4] },
    { text: "Pacientes", roles: [1,2,4] },
    { text: "Mis Citas", roles: [5,6] }
  ];

  return (
    <div className="flex h-screen bg-[#F4F9F9] font-sans antialiased overflow-hidden text-gray-800">
      
      {/* SIDEBAR DINÁMICO */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-sm">
        <div className="p-8 flex justify-center border-b border-gray-50"><img src={logo} alt="Alba" className="h-10" /></div>
        <div className="p-6 flex flex-col items-center border-b border-gray-50 bg-gray-50/10">
          <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-xl font-black mb-3 shadow-lg ${isAdmin ? 'bg-orange-50 text-orange-600' : isStaff ? 'bg-emerald-50 text-[#148F77]' : 'bg-[#148F77] text-white'}`}>
            {user?.nombre?.charAt(0) || 'U'}
          </div>
          <h3 className="text-[#2A5C4D] font-black text-[11px] text-center leading-tight px-4 uppercase">{user?.nombre || 'Usuario'}</h3>
          <p className="text-gray-400 text-[9px] font-bold uppercase mt-2 bg-white px-2 py-1 rounded shadow-sm">
            {isAdmin ? 'ADMINISTRADOR' : `ID: ${user?.id_persona}`}
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
        
        <div className="p-6 border-t"><button onClick={() => { logout(); navigate('/login'); }} className="w-full py-4 rounded-2xl text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all">Cerrar Sesión</button></div>
      </aside>

      {/* CONTENIDO PRINCIPAL SEGÚN ROL Y MENÚ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white h-20 px-10 flex items-center border-b border-gray-50 shadow-sm">
          <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic tracking-tighter">Clínica Alba / <span className="text-[#148F77] font-black">{activeMenu}</span></div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-10">
          {activeMenu === 'Panel de Control' && (
            isAdmin ? <DashboardAdmin /> :
            isStaff ? <DashboardStaff openModal={() => setShowModalCita(true)} /> :
            <DashboardPaciente openModal={() => setShowModalCita(true)} />
          )}

          {activeMenu === 'Usuarios y Roles' && isAdmin && <GestionUsuariosView />}

          {activeMenu !== 'Panel de Control' && activeMenu !== 'Usuarios y Roles' && (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
                <p className="text-6xl mb-4">⚙️</p>
                <p className="font-black uppercase tracking-[0.3em] text-xs">Módulo en Desarrollo</p>
            </div>
          )}
        </div>
      </main>

      {/* EL MODAL OPTIMIZADO QUE ME PASASTE */}
      {showModalCita && <ModalNuevaCita onClose={() => setShowModalCita(false)} user={user} dataMaster={dataMaster} isStaff={isStaff} />}
    </div>
  );
}

// ==========================================
// MODAL DE CITA (PROTEGIDO Y OPTIMIZADO)
// ==========================================

function ModalNuevaCita({ onClose, user, isStaff, dataMaster }) {
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [odontologosFiltrados, setOdontologosFiltrados] = useState(dataMaster.odontologos);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  
  const [formData, setFormData] = useState({
    fecha_base: '', hora_seleccionada: '', id_paciente: user?.id_persona || '', 
    id_odontologo: '', id_sala: '', cita_obs: '', id_procedimiento: ''
  });

  const abortDoc = useRef(null);
  const abortSlots = useRef(null);
  const hoy = new Date().toISOString().split('T')[0];

  const salas = useMemo(() => [
    { id: 1, nombre: "Consultorio 1" }, { id: 2, nombre: "Quirofano A" },
    { id: 3, nombre: "Sala Rayos X" }, { id: 4, nombre: "Consultorio 2" }
  ], []);

  const handleProcChange = async (idProc) => {
    if (abortDoc.current) abortDoc.current.abort();
    abortDoc.current = new AbortController();

    setFormData(prev => ({ ...prev, id_procedimiento: idProc, id_odontologo: '', hora_seleccionada: '' }));
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
                    setSlotsDisponibles(res.data);
                    if (!res.data.some(s => s.inicio === formData.hora_seleccionada)) {
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
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-fade-in-up">
        {isSuccess ? (
            <div className="p-12 text-center animate-fade-in">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto animate-bounce">✓</div>
                <h3 className="text-3xl font-black text-[#2A5C4D] mb-2 tracking-tighter">¡Cita Confirmada!</h3>
                <p className="text-gray-400 text-xs mb-10">La información ha sido guardada en la base de datos.</p>
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
                            <select required className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none" value={formData.id_odontologo} onChange={e => setFormData(prev => ({...prev, id_odontologo: e.target.value}))}>
                                <option value="">Elegir...</option>
                                {odontologosFiltrados.map(o => <option key={o.id_personal || o.id} value={o.id_personal || o.id}>{o.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">3. Sala</label>
                            <select required className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none" value={formData.id_sala} onChange={e => setFormData(prev => ({...prev, id_sala: e.target.value}))}>
                                <option value="">Sala...</option>
                                {salas.map(s => <option key={s.id} value={s.id} disabled={s.id === 4}>{s.nombre}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">4. Fecha</label>
                        <input type="date" required min={hoy} max="2099-12-31" className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none" value={formData.fecha_base} 
                            onChange={e => {
                                const year = e.target.value.split('-')[0];
                                if (year.length <= 4) setFormData(prev => ({...prev, fecha_base: e.target.value}));
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
                                    <button key={i} type="button" onClick={() => setFormData(prev => ({...prev, hora_seleccionada: slot.inicio}))}
                                        className={`p-2 text-[10px] font-black rounded-xl transition-all shadow-sm ${formData.hora_seleccionada === slot.inicio ? 'bg-[#148F77] text-white' : 'bg-white text-[#148F77] hover:bg-emerald-50'}`}>{slot.inicio}</button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-[9px] text-gray-400 italic py-4">Seleccione doctor, sala y fecha para ver disponibilidad.</p>
                        )}
                    </div>

                    {isStaff && <input type="number" placeholder="ID Paciente" required className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold border-none shadow-inner" value={formData.id_paciente} onChange={e => setFormData(prev => ({...prev, id_paciente: e.target.value}))} />}
                    <textarea placeholder="Motivo de consulta..." required className="w-full p-4 bg-gray-50 rounded-2xl text-xs font-bold h-20 border-none resize-none shadow-inner" value={formData.cita_obs} onChange={e => setFormData(prev => ({...prev, cita_obs: e.target.value}))}></textarea>

                    <button type="submit" disabled={loading} className="w-full py-5 bg-[#148F77] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                        {loading ? "PROCESANDO..." : "AGENDAR CITA"}
                    </button>
                </form>
            </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// VISTAS Y DASHBOARDS (ROLES)
// ==========================================

function GestionUsuariosView() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nombre: "", correo: "", id_rol: "" });
  
  // ESTADO PARA NOTIFICACIONES DE INTERFAZ
  const [toast, setToast] = useState({ mensaje: "", tipo: "" });
  const [loading, setLoading] = useState(false);

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  // Función para disparar avisos visuales
  const notify = (mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast({ mensaje: "", tipo: "" }), 4000);
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      // Usamos el timestamp para asegurar que no traiga datos cacheados
      const res = await fetch(`${API_URL}/usuarios?t=${Date.now()}`).then(r => r.json());
      if (res.success) setUsuarios(res.data);
    } catch (e) {
      notify("Error al sincronizar con la base de datos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleIniciarEdicion = (u) => {
    setEditando(u.id_usuario);
    setFormEdit({ 
        nombre: u.nombre, 
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
              nombre_usuario: formEdit.nombre, // Mapeado exacto a tu backend
              correo: formEdit.correo,
              id_rol: Number(formEdit.id_rol)
          })
      }).then(r => r.json());
      
      if (res.success) {
          notify("Registro actualizado exitosamente");
          setEditando(null);
          await fetchUsuarios(); // Refresco inmediato del front
          
          // Si el admin logra cambiarse el rol a sí mismo (seguridad extra)
          if (idUsuario === user.id_usuario && Number(formEdit.id_rol) !== user.rol) {
              setTimeout(() => { logout(); navigate('/login'); }, 1500);
          }
      } else {
          notify(res.message, "error");
      }
    } catch (err) {
      notify("Fallo crítico en la comunicación con el servidor", "error");
    }
  };

  const handleEliminar = async (id) => {
    if (id === user.id_usuario) return notify("No puedes eliminar tu propia cuenta", "error");
    if (!confirm("¿Deseas eliminar permanentemente este acceso?")) return;
    
    try {
        const res = await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (res.success) {
            notify("Usuario removido del sistema");
            fetchUsuarios();
        } else {
            notify(res.message, "error");
        }
    } catch {
        notify("Error al procesar la solicitud", "error");
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.correo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="animate-fade-in pb-20 relative">
        
        {/* SISTEMA DE TOASTS (NOTIFICACIONES) */}
        {toast.mensaje && (
            <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl font-black text-[10px] uppercase tracking-widest animate-fade-in-up border-b-4 ${
                toast.tipo === 'error' ? 'bg-red-500 text-white border-red-700' : 'bg-[#148F77] text-white border-emerald-900'
            }`}>
                {toast.tipo === 'error' ? '⚠️ ' : '✓ '} {toast.mensaje}
            </div>
        )}

        {/* HEADER Y BÚSQUEDA */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
            <div>
                <h2 className="text-3xl font-black text-[#2A5C4D] tracking-tighter italic">Gestión de Acceso</h2>
                <button 
                    onClick={fetchUsuarios} 
                    className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
                >
                    <span className={loading ? 'animate-spin' : ''}>↻</span>
                    {loading ? 'Sincronizando...' : 'Actualizar Datos'}
                </button>
            </div>
            
            <div className="relative w-full md:w-96 group">
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre, e-mail o rol..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-bold shadow-sm focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
                <span className="absolute left-5 top-4.5 text-lg opacity-20">🔍</span>
            </div>
        </div>
        
        {/* TABLA DINÁMICA */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <tr>
                        <th className="px-10 py-7">Identidad</th>
                        <th className="px-10 py-7">Contacto</th>
                        <th className="px-10 py-7">Privilegios</th>
                        <th className="px-10 py-7 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {usuariosFiltrados.map(u => (
                        <tr key={u.id_usuario} className="hover:bg-emerald-50/20 transition-colors group">
                            {/* NOMBRE */}
                            <td className="px-10 py-6">
                                {editando === u.id_usuario ? (
                                    <input 
                                        className="bg-emerald-50 border-none text-[#148F77] text-xs font-black rounded-xl px-4 py-2 w-full outline-none focus:ring-2 focus:ring-emerald-200"
                                        value={formEdit.nombre}
                                        onChange={(e) => setFormEdit({...formEdit, nombre: e.target.value})}
                                    />
                                ) : (
                                    <div>
                                        <div className="font-black text-xs text-[#2A5C4D] flex items-center gap-2">
                                            {u.nombre}
                                            {u.id_usuario === user.id_usuario && (
                                                <span className="bg-orange-100 text-orange-600 text-[7px] px-2 py-0.5 rounded-full font-black">MÍ PERFIL</span>
                                            )}
                                        </div>
                                        <div className="text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-1">Ref: {u.id_usuario}</div>
                                    </div>
                                )}
                            </td>

                            {/* CORREO */}
                            <td className="px-10 py-6">
                                {editando === u.id_usuario ? (
                                    <input 
                                        className="bg-emerald-50 border-none text-[#148F77] text-xs font-black rounded-xl px-4 py-2 w-full outline-none"
                                        value={formEdit.correo}
                                        onChange={(e) => setFormEdit({...formEdit, correo: e.target.value})}
                                    />
                                ) : (
                                    <div className="text-xs text-gray-400 font-medium italic">{u.correo}</div>
                                )}
                            </td>

                            {/* ROL (PROTECCIÓN PARA EL USUARIO LOGUEADO) */}
                            <td className="px-10 py-6">
                                {editando === u.id_usuario ? (
                                    <select 
                                        disabled={u.id_usuario === user.id_usuario}
                                        className={`text-[10px] font-black rounded-xl px-4 py-2 outline-none border-2 transition-all ${
                                            u.id_usuario === user.id_usuario 
                                            ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white border-emerald-100 text-[#148F77] focus:ring-2 focus:ring-emerald-200'
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

                            {/* ACCIONES */}
                            <td className="px-10 py-6 text-center">
                                {editando === u.id_usuario ? (
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleGuardarCambios(u.id_usuario)} className="bg-[#148F77] text-white px-5 py-2.5 rounded-2xl text-[9px] font-black shadow-lg hover:bg-[#0e6352] active:scale-95 transition-all">GUARDAR</button>
                                        <button onClick={() => setEditando(null)} className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-2xl text-[9px] font-black">✕</button>
                                    </div>
                                ) : (
                                    <div className="flex justify-center gap-6">
                                        <button onClick={() => handleIniciarEdicion(u)} className="text-[#148F77] hover:text-[#2A5C4D] text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Editar</button>
                                        {u.id_usuario !== user.id_usuario && (
                                            <button onClick={() => handleEliminar(u.id_usuario)} className="text-red-300 hover:text-red-600 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Eliminar</button>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}

function DashboardAdmin() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-[#2A5C4D] text-white p-12 rounded-[3rem] shadow-xl">
                <h2 className="text-3xl font-black mb-2 italic">Estado del Sistema</h2>
                <p className="opacity-70 text-xs uppercase tracking-widest mb-8">Consola de Administración</p>
                <div className="flex gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl text-center flex-1"><p className="text-2xl font-black">100%</p><p className="text-[8px] uppercase font-bold opacity-50">Base de Datos</p></div>
                    <div className="bg-white/10 p-4 rounded-2xl text-center flex-1"><p className="text-2xl font-black">ONLINE</p><p className="text-[8px] uppercase font-bold opacity-50">Servidor Flask</p></div>
                </div>
            </div>
            <div className="bg-orange-500 text-white p-12 rounded-[3rem] shadow-xl flex flex-col justify-center">
                <h3 className="text-xl font-black italic mb-2">Auditoría de Seguridad</h3>
                <p className="text-sm opacity-90 mb-6 leading-tight">Control total sobre los roles y permisos de la Clínica Alba.</p>
            </div>
        </div>
    );
}

function DashboardStaff({ openModal }) {
    return (
        <div onClick={openModal} className="bg-[#148F77] text-white p-12 rounded-[3rem] shadow-xl cursor-pointer hover:bg-[#0f6b59] transition-all flex justify-between items-center animate-fade-in">
            <div><h2 className="text-3xl font-black italic mb-2">Operaciones Clínicas</h2><p className="opacity-70 text-sm">Registrar atención presencial o cirugía</p></div>
            <span className="text-5xl font-light">＋</span>
        </div>
    );
}

function DashboardPaciente({ openModal }) {
    return (
        <div className="animate-fade-in">
            <div onClick={openModal} className="bg-gradient-to-br from-[#148F77] to-[#2A5C4D] text-white p-12 rounded-[3rem] shadow-2xl cursor-pointer hover:scale-[1.01] transition-transform">
                <h2 className="text-4xl font-black mb-3 tracking-tighter italic">Cuidamos tu Sonrisa</h2>
                <p className="opacity-80 text-sm mb-10 leading-relaxed max-w-md">Agenda tu cita hoy mismo con nuestros especialistas. Horarios: Lun-Vie (08:00-19:00) y Sáb (09:00-13:00).</p>
                <div className="bg-white/20 inline-block px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-sm">Empezar Registro ➔</div>
            </div>
        </div>
    );
}
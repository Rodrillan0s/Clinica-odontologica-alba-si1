import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth_store';
import logo from '../assets/LOGOTIPO.png';

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login'); 
  };

  const primerNombre = user?.nombre ? user.nombre.split(' ')[0] : 'Doc';

  // Componente reutilizable para los items del Sidebar
  const SidebarItem = ({ icon, text, active }) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active 
      ? 'bg-[#148F77] text-white shadow-md shadow-[#148F77]/20' 
      : 'text-gray-500 hover:bg-[#E8F4F8] hover:text-[#148F77]'
    }`}>
      {icon}
      <span className="font-bold text-sm">{text}</span>
    </div>
  );

  return (
    // CONTENEDOR PRINCIPAL: Pantalla completa dividida en Flex (Sidebar + Main)
    <div className="flex h-screen bg-[#F4F9F9] font-sans antialiased overflow-hidden">
      
      {/* ================= BARRA LATERAL (SIDEBAR) ================= */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex z-20 shadow-sm">
        
        {/* Logo */}
        <div className="p-6 border-b border-gray-50 flex justify-center">
          <img src={logo} alt="Clínica Alba" className="h-10 w-auto object-contain" />
        </div>

        {/* Perfil del Usuario Resumido (Estilo de tu imagen) */}
        <div className="p-6 flex flex-col items-center border-b border-gray-50">
          <div className="w-16 h-16 bg-[#E8F4F8] rounded-full flex items-center justify-center text-[#148F77] text-xl font-black mb-3 border-2 border-white shadow-md">
            {primerNombre.charAt(0)}
          </div>
          <h3 className="text-[#2A5C4D] font-black text-sm">{user?.nombre || 'Administrador'}</h3>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Odontólogo / Admin</p>
        </div>

        {/* Menú de Navegación */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <SidebarItem 
            active={true} 
            text="Panel de Control" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" /></svg>} 
          />
          <SidebarItem 
            active={false} 
            text="Gestión Clínica" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>} 
          />
          <SidebarItem 
            active={false} 
            text="Agenda de Citas" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-2.25h.008v.008H16.5V15zm0 2.25h.008v.008H16.5v-.008z" /></svg>} 
          />
          <SidebarItem 
            active={false} 
            text="Pacientes" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} 
          />
        </div>

        {/* Botón Salir al final del Sidebar */}
        <div className="p-4 border-t border-gray-50">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 font-bold text-sm transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ================= CONTENIDO PRINCIPAL (DERECHA) ================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER TOP (Barra de búsqueda y Notificaciones) */}
        <header className="bg-white h-20 px-8 flex items-center justify-between shadow-sm z-10">
          
          {/* Breadcrumb / Título */}
          <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            <span>/</span>
            <span className="text-[#148F77]">Panel de Control</span>
          </div>

          {/* Buscador central */}
          <div className="hidden md:flex items-center bg-gray-50 px-4 py-2 rounded-xl w-96 border border-gray-100 focus-within:ring-2 focus-within:ring-[#148F77]/30 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            <input type="text" placeholder="Buscar paciente, cita o tratamiento..." className="bg-transparent border-none outline-none text-sm w-full ml-3 text-gray-700 placeholder-gray-400" />
          </div>

          {/* Iconos derechos */}
          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-[#148F77] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg></button>
          </div>
        </header>

        {/* ÁREA DE TRABAJO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* Fila 1: Pestañas de Días (Inspirado en la imagen) */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl shadow-sm p-1 inline-flex gap-1 border border-gray-100">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dia, index) => (
                <button key={dia} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  index === 2 ? 'bg-[#148F77] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                  {dia}
                </button>
              ))}
            </div>
          </div>

          {/* Fila 2: Citas (Appointments) */}
          <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-[#2A5C4D] font-black text-lg mb-6 flex items-center justify-between">
              Citas Programadas para Hoy
              <button className="text-xs text-[#148F77] font-bold uppercase hover:underline">Ver todas</button>
            </h3>
            
            {/* Grid de pacientes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tarjeta Cita 1 */}
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-[#148F77] hover:shadow-md transition-all cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">MA</div>
                <div className="flex-1">
                  <h4 className="text-gray-800 font-bold text-sm">María Aguilar</h4>
                  <p className="text-gray-400 text-xs">Ortodoncia</p>
                </div>
                <span className="bg-red-50 text-red-600 font-bold text-xs px-2.5 py-1 rounded-md">08:00</span>
              </div>
              
              {/* Tarjeta Cita 2 */}
              <div className="flex items-center gap-4 p-4 border border-[#148F77]/30 bg-[#F4F9F9] rounded-2xl hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#148F77]"></div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">CS</div>
                <div className="flex-1">
                  <h4 className="text-gray-800 font-bold text-sm">Carlos Soria</h4>
                  <p className="text-gray-400 text-xs">Revisión General</p>
                </div>
                <span className="bg-[#148F77] text-white font-bold text-xs px-2.5 py-1 rounded-md">09:30</span>
              </div>

              {/* Tarjeta Cita 3 */}
              <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-[#148F77] hover:shadow-md transition-all cursor-pointer">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">LV</div>
                <div className="flex-1">
                  <h4 className="text-gray-800 font-bold text-sm">Lucía Vargas</h4>
                  <p className="text-gray-400 text-xs">Blanqueamiento</p>
                </div>
                <span className="bg-gray-100 text-gray-600 font-bold text-xs px-2.5 py-1 rounded-md">11:00</span>
              </div>
            </div>
          </section>

          {/* Fila 3: Estadísticas Inferiores (Earnings/Summary) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
              <div className="p-4 bg-orange-50 rounded-2xl text-orange-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Ingresos del Día</p>
                <h3 className="text-2xl font-black text-gray-800">Bs. 1,450</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
              <div className="p-4 bg-blue-50 rounded-2xl text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.969-1.584A6.016 6.016 0 013.25 15.33m14.75 3.39l-.001-.03m0 0a2.003 2.003 0 00-3.41-1.41M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Pacientes Totales</p>
                <h3 className="text-2xl font-black text-gray-800">142</h3>
              </div>
            </div>

            <div className="bg-[#2A5C4D] p-6 rounded-3xl shadow-md border border-[#2A5C4D] flex items-center justify-between text-white relative overflow-hidden group cursor-pointer">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Nueva Operación</p>
                <h3 className="text-xl font-black">Registrar Paciente</h3>
              </div>
              <div className="relative z-10 bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
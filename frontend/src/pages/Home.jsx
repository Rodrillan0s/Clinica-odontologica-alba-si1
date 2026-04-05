import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth_store';
import logoAgro from '../assets/LOGO.png';

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); 
    navigate('/login'); 
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans antialiased">
      
      {/* Navbar Superior - Estilo Corporativo */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={logoAgro} alt="AgroEnlace" className="w-9 h-9 rounded-md border border-gray-100" />
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-[#1A5729] tracking-tight leading-none">AgroEnlace</h1>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ERP Agrícola</span>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-700">
              {user?.nombre_razon_social || 'Administrador del Sistema'}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#5B9D1E] animate-pulse"></span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Sesión Activa</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div> {/* Separador visual */}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg text-sm font-bold transition-colors hover:bg-red-50"
          >
            {/* Icono de Salir (SVG) */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        
        {/* Encabezado del Dashboard */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#1A5729] tracking-tight">Panel de Control General</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">Resumen operativo y acceso rápido a módulos.</p>
          </div>
          <button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 w-fit">
            {/* Icono de + */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva Operación
          </button>
        </div>

        {/* Grid de Módulos Operativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Módulo: Terrenos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-[#5B9D1E] hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-50 rounded-lg text-[#2D6A4F] group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors">
                {/* Icono de Mapa/Terreno */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Activo</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Gestión de Terrenos</h3>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">Administración de lotes, parcelas y asignación de campañas agrícolas.</p>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-2xl font-black text-gray-800">24</span>
              <span className="text-xs font-bold text-gray-400 uppercase">Lotes Reg.</span>
            </div>
          </div>

          {/* Módulo: Maquinaria */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-[#5B9D1E] hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 rounded-lg text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                {/* Icono de Engranajes/Maquinaria */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Operativo</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Maquinaria y Equipos</h3>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">Control de flota, mantenimientos preventivos y asignación de tractores.</p>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-2xl font-black text-gray-800">12</span>
              <span className="text-xs font-bold text-gray-400 uppercase">Equipos</span>
            </div>
          </div>

          {/* Módulo: Inventario */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-[#5B9D1E] hover:shadow-md transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                {/* Icono de Caja/Bodega */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Revisión</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Inventario y Bodega</h3>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">Control de stock de agroquímicos, semillas, fertilizantes y herramientas.</p>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-2xl font-black text-gray-800">850</span>
              <span className="text-xs font-bold text-gray-400 uppercase">Artículos</span>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
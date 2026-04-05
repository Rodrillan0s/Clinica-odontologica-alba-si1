import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoAgro from '../assets/LOGO.png'; 

export default function Welcome() {
  const [showButtons, setShowButtons] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); // Para el fade-in inicial
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
    const token = localStorage.getItem('token'); 
    if (token) navigate('/home'); 
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-[#D9F0FB] flex flex-col items-center justify-center relative overflow-hidden font-sans antialiased transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Círculos decorativos de fondo con desenfoque (Elegancia moderna) */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-[#5B9D1E]/10 rounded-full blur-3xl"></div>

      {/* Contenedor principal */}
      <div className={`transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center z-10 ${
          showButtons ? '-translate-y-16' : 'translate-y-0'
        }`}
      >
        {/* Logo con efecto de elevación */}
        <div className="relative group">
          <img 
            src={logoAgro} 
            alt="Logo AgroEnlace" 
            className="w-44 h-44 md:w-52 md:h-52 object-contain rounded-2xl mb-8 transition-transform duration-700 group-hover:scale-105"
          />
          {/* Brillo sutil detrás del logo */}
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full -z-10 scale-75"></div>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-[#1A5729] tracking-tight text-center drop-shadow-sm mb-2">
          AgroEnlace
        </h1>
        
        <div className="h-1 w-20 bg-[#5B9D1E] rounded-full mb-4"></div> {/* Divisor elegante */}
        
        <p className="text-sm md:text-lg text-[#2D6A4F] font-medium text-center tracking-[0.2em] uppercase opacity-80">
          Gestor para empresas Agrícolas
        </p>
      </div>

      {/* Botones con Micro-interacciones */}
      <div className={`transition-all duration-1000 delay-300 ease-out mt-4 flex flex-col sm:flex-row gap-5 z-10 ${
          showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        {/* Botón Primario */}
        <Link
          to="/login"
          className="group relative bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold py-3 px-10 rounded-lg shadow-md hover:shadow-xl active:scale-95 transition-all duration-300 text-center min-w-[180px] tracking-wide overflow-hidden"
        >
          <span className="relative z-10">Iniciar Sesión</span>
          {/* Efecto de brillo al pasar el mouse */}
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
        </Link>
        
        {/* Botón Secundario */}
        <Link
          to="/register"
          className="bg-white hover:bg-gray-50 text-[#2D6A4F] border-2 border-[#2D6A4F]/20 hover:border-[#2D6A4F] font-semibold py-3 px-10 rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all duration-300 text-center min-w-[180px] tracking-wide"
        >
          Registrarse
        </Link>
      </div>

      {/* Footer minimalista */}
      <div className={`absolute bottom-8 transition-opacity duration-1000 delay-1000 ${showButtons ? 'opacity-40' : 'opacity-0'}`}>
        <p className="text-[#1A5729] text-xs font-medium uppercase tracking-[0.3em]">Santa Cruz • Bolivia</p>
      </div>
      
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoAgro from '../assets/LOGO.png'; // Tu logo de ALBA
import fondoWelcome from '../assets/Fondo_Welcome.jpg'; // Imagen de fondo para el hero

export default function Welcome() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Redirección si ya está logueado
  useEffect(() => {
    const token = localStorage.getItem('token'); 
    if (token) navigate('/home'); 
    setIsLoaded(true);
  }, [navigate]);

  // Efecto para detectar el scroll y cambiar el Navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen bg-white font-sans antialiased transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* NAVBAR INTELIGENTE */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3 cursor-pointer">
            <img 
              src={logoAgro} 
              alt="Clínica Alba" 
              className={`transition-all duration-300 object-contain ${isScrolled ? 'h-10' : 'h-14 drop-shadow-lg bg-white/80 rounded p-1'}`} 
            />
            <div className={`flex flex-col transition-colors duration-300 ${isScrolled ? 'text-[#2A5C4D]' : 'text-white drop-shadow-md'}`}>
              <span className="text-xl font-black tracking-tight leading-none">Clínica Alba</span>
              <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5">Odontología Integral</span>
            </div>
          </div>

          {/* Menú Central (Oculto en móviles) */}
          <div className={`hidden md:flex gap-8 font-bold text-sm transition-colors duration-300 ${isScrolled ? 'text-gray-600' : 'text-white drop-shadow-md'}`}>
            <a href="#inicio" className="hover:text-[#148F77] transition-colors">Inicio</a>
            <a href="#servicios" className="hover:text-[#148F77] transition-colors">Especialidades</a>
            <a href="#nosotros" className="hover:text-[#148F77] transition-colors">Nosotros</a>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className={`hidden sm:block text-sm font-bold transition-colors duration-300 ${
                isScrolled ? 'text-[#2A5C4D] hover:text-[#148F77]' : 'text-white hover:text-gray-200 drop-shadow-md'
              }`}
            >
              Iniciar Sesión
            </Link>
            <Link 
              to="/register" 
              className="bg-[#148F77] hover:bg-[#0f6b59] text-white text-sm font-bold py-2.5 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Agendar Cita
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION (Pantalla Principal) */}
      <section id="inicio" className="relative h-screen flex items-center justify-center">
        {/* Imagen de fondo (Placeholder moderno dental) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fondoWelcome})` }}
        ></div>
        
        {/* Overlays para oscurecer y dar el tono corporativo */}
        <div className="absolute inset-0 bg-[#2A5C4D]/60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white"></div>

        {/* Contenido Central */}
        <div className="relative z-10 text-center px-4 max-w-4xl mt-16">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-white backdrop-blur-sm text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in-up">
            Tecnología y Calidad en Santa Cruz
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-lg mb-6 leading-tight">
            Tu mejor sonrisa <br className="hidden md:block"/> comienza aquí.
          </h1>
          <p className="text-lg md:text-xl text-gray-100 font-medium drop-shadow mb-10 max-w-2xl mx-auto">
            Especialistas en transformar tu salud dental con tratamientos modernos, seguros y sin dolor.
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 bg-[#148F77] hover:bg-[#0f6b59] text-white text-lg font-bold py-4 px-10 rounded-full shadow-2xl hover:shadow-[#148F77]/30 transition-all hover:-translate-y-1 active:scale-95"
          >
            ¡QUIERO AGENDAR MI CONSULTA!
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* CINTILLO DE INFORMACIÓN FLOTANTE */}
      <div className="relative z-20 -mt-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border border-gray-100 overflow-hidden">
          
          {/* Item 1: Ubicación */}
          <div className="flex-1 p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="p-3 bg-[#E8F4F8] rounded-full text-[#148F77]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            </div>
            <div>
              <h3 className="text-[#2A5C4D] font-black text-sm uppercase tracking-wider mb-1">Ubicación</h3>
              <p className="text-gray-500 text-sm">Santa Cruz de la Sierra, Bolivia<br/>(Av. Piraí, entre 4to y 5to anillo)</p>
            </div>
          </div>

          {/* Item 2: Contacto */}
          <div className="flex-1 p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="p-3 bg-[#E8F4F8] rounded-full text-[#148F77]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.18-7.076-7.076l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
            </div>
            <div>
              <h3 className="text-[#2A5C4D] font-black text-sm uppercase tracking-wider mb-1">Llámanos</h3>
              <p className="text-gray-500 text-sm">+591 63508885</p>
            </div>
          </div>

          {/* Item 3: Horarios */}
          <div className="flex-1 p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="p-3 bg-[#E8F4F8] rounded-full text-[#148F77]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-[#2A5C4D] font-black text-sm uppercase tracking-wider mb-1">Horarios</h3>
              <p className="text-gray-500 text-sm">Lunes - Viernes: 08:00 - 19:00<br/>Sábados: 09:00 - 13:00</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
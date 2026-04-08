import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// IMPORTA TUS IMÁGENES
import logoAgro from '../assets/LOGO.png'; 
import fondoWelcome from '../assets/Fondo_Welcome.jpg'; 
import fondoNosotros from '../assets/Fondo_Nosotros.jpg';

export default function Welcome() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token'); 
    if (token) navigate('/home'); 
    setIsLoaded(true);
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen bg-white font-sans antialiased transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* ==========================================
          NAVBAR CON MENU DESPLEGABLE
          ========================================== */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
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

          {/* MENÚ CENTRAL CON DROPDOWN */}
          <div className={`hidden md:flex items-center gap-8 font-bold text-sm transition-colors duration-300 ${isScrolled ? 'text-gray-600' : 'text-white drop-shadow-md'}`}>
            <a href="#inicio" className="hover:text-[#148F77] transition-colors">Inicio</a>
            
            {/* DROPDOWN ESPECIALIDADES */}
            <div className="relative group py-4">
              <button className="flex items-center gap-1 hover:text-[#148F77] transition-colors outline-none font-bold">
                Especialidades
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 mt-0.5 transition-transform duration-300 group-hover:rotate-180">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              
              {/* Caja del Menú (Aparece en Hover) */}
              <div className="absolute top-full left-0 w-64 bg-white shadow-2xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col py-3 border border-gray-100 overflow-hidden">
                {[
                  { name: 'Exodoncia', path: 'exodoncia' },
                  { name: 'Endodoncia', path: 'endodoncia' },
                  { name: 'Prótesis Fija', path: 'protesis-fija' },
                  { name: 'Prótesis Removible', path: 'protesis-removible' },
                  { name: 'Periodoncia', path: 'periodoncia' },
                  { name: 'Odontopediatría', path: 'odontopediatria' },
                ].map((item) => (
                  <Link 
                    key={item.path}
                    to={`/especialidad/${item.path}`} 
                    className="px-6 py-3 text-sm text-gray-700 hover:bg-[#148F77] hover:text-white font-semibold transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <a href="#nosotros" className="hover:text-[#148F77] transition-colors">Nosotros</a>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3">
            <Link to="/login" className={`hidden sm:block text-sm font-bold transition-colors ${isScrolled ? 'text-[#2A5C4D]' : 'text-white'}`}>
              Iniciar Sesión
            </Link>
            <Link to="/register" className="bg-[#148F77] hover:bg-[#0f6b59] text-white text-sm font-bold py-2.5 px-6 rounded-lg shadow-lg transition-all active:scale-95">
              Agendar Cita
            </Link>
          </div>
        </div>
      </nav>

      {/* ==========================================
          HERO SECTION
          ========================================== */}
      <section id="inicio" className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${fondoWelcome})` }}></div>
        <div className="absolute inset-0 bg-[#2A5C4D]/60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mt-16">
          <span className="inline-block py-1 px-3 rounded-full bg-white/20 text-white backdrop-blur-sm text-xs font-bold tracking-widest uppercase mb-6">
            Tecnología y Calidad en Santa Cruz
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-lg mb-6 leading-tight">
            Tu mejor sonrisa <br className="hidden md:block"/> comienza aquí.
          </h1>
          <p className="text-lg md:text-xl text-gray-100 font-medium mb-10 max-w-2xl mx-auto">
            Especialistas en transformar tu salud dental con tratamientos modernos, seguros y sin dolor.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-[#148F77] hover:bg-[#0f6b59] text-white text-lg font-bold py-4 px-10 rounded-full shadow-2xl transition-all hover:-translate-y-1">
            ¡QUIERO AGENDAR MI CONSULTA!
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>
      </section>

      {/* ==========================================
          CINTILLO INFORMATIVO
          ========================================== */}
      <div className="relative z-20 -mt-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border border-gray-100 overflow-hidden">
          <div className="flex-1 p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="p-3 bg-[#E8F4F8] rounded-full text-[#148F77]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            </div>
            <div>
              <h3 className="text-[#2A5C4D] font-black text-sm uppercase mb-1">Ubicación</h3>
              <p className="text-gray-500 text-sm">Santa Cruz de la Sierra, Bolivia<br/>(Av. Piraí, entre 4to y 5to anillo)</p>
            </div>
          </div>

          <div className="flex-1 p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="p-3 bg-[#E8F4F8] rounded-full text-[#148F77]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.18-7.076-7.076l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
            </div>
            <div>
              <h3 className="text-[#2A5C4D] font-black text-sm uppercase mb-1">Llámanos</h3>
              <p className="text-gray-500 text-sm">+591 63508885</p>
            </div>
          </div>

          <div className="flex-1 p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="p-3 bg-[#E8F4F8] rounded-full text-[#148F77]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-[#2A5C4D] font-black text-sm uppercase mb-1">Horarios</h3>
              <p className="text-gray-500 text-sm">Lun - Vie: 08:00 - 19:00<br/>Sáb: 09:00 - 13:00</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          SECCIÓN NOSOTROS
          ========================================== */}
      <section id="nosotros" className="w-full bg-white pt-24 pb-16">
        <div className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${fondoNosotros})` }}></div>
          <div className="absolute inset-0 bg-[#2A5C4D]/80 mix-blend-multiply"></div>
          <div className="relative z-10 text-center px-4 max-w-5xl">
            <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-white/90 text-xs font-bold tracking-[0.2em] uppercase mb-4 shadow-sm backdrop-blur-sm">
              Conoce a Clínica Alba
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
              Porque nuestro único fin es <br className="hidden md:block"/> hacerte sonreír.
            </h2>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-3xl md:text-4xl font-black text-[#2A5C4D] mb-6">Excelencia odontológica <br/> con calidez humana.</h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-6">
              En <strong className="text-[#148F77]">Clínica Alba</strong> cuidamos personas. Con más de 10 años de trayectoria, unimos tecnología y empatía para brindarte la mejor experiencia.
            </p>
            <ul className="space-y-4 mt-8 font-medium">
              {['Equipamiento 3D.', 'Materiales premium.', 'Sin dolor.', 'Especialistas certificados.'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-[#E8F4F8] flex items-center justify-center text-[#148F77]">✓</div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm"><h4 className="text-5xl font-black text-[#148F77] mb-2">+5k</h4><p className="text-[#2A5C4D] font-bold text-sm uppercase">Pacientes</p></div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm mt-8"><h4 className="text-5xl font-black text-[#148F77] mb-2">12</h4><p className="text-[#2A5C4D] font-bold text-sm uppercase">Años</p></div>
            <div className="bg-[#2A5C4D] p-8 rounded-2xl shadow-lg transform -translate-y-8"><h4 className="text-5xl font-black text-white mb-2">100%</h4><p className="text-white/80 font-bold text-sm uppercase">Calidad</p></div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm"><h4 className="text-5xl font-black text-[#148F77] mb-2">6</h4><p className="text-[#2A5C4D] font-bold text-sm uppercase">Áreas</p></div>
          </div>
        </div>
      </section>

    </div>
  );
}
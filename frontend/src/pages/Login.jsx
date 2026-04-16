import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/LOGO.png'; // Logo de Clínica Alba
import fondoWelcome from '../assets/Fondo_Welcome.jpg'; // Imagen de fondo unificada
import { useAuthStore } from '../store/auth_store';

// ÚNICA DECLARACIÓN DE LA URL
const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  // ESTADOS REACT
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ACCION LOGIN DE ZUSTAND
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_input: user, 
          password: password 
        }),
      });

      // Capturador de errores por si Flask manda HTML (ej. servidor caído)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Error de conexión con el servidor. Verifica que Flask esté encendido.");
      }

      const data = await response.json();

      // VALIDACION SUCCESS BACKEND
      if (!data.success) {
        throw new Error(data.message || 'Credenciales incorrectas. Intente de nuevo.');
      }

      console.log('Login exitoso para:', data.user.nombre);
      
      // GUARDAMOS TOKEN Y DATOS DEL USUARIO
      login(data.access_token, data.user);
      
      // REDIRIGIMOS A '/home'
      navigate('/home'); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clases reutilizables para mantener el código HTML limpio
  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#148F77] focus:border-transparent outline-none bg-gray-50 text-sm transition-all shadow-inner";
  const labelClass = "block text-[11px] font-bold text-[#2A5C4D] uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-10 font-sans antialiased">
      
      {/* IMAGEN DE FONDO (Con blur para no distraer) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
        style={{ backgroundImage: `url(${fondoWelcome})` }}
      ></div>
      
      {/* CAPA OSCURECEDORA (Para dar contraste) */}
      <div className="absolute inset-0 bg-[#2A5C4D]/70 mix-blend-multiply"></div>

      {/* TARJETA DE LOGIN */}
      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden z-10 animate-fade-in-up">
        
        {/* Barra superior de acento */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#148F77] to-[#2A5C4D]"></div>
        
        {/* --- NUEVO BOTÓN PARA VOLVER A WELCOME --- */}
        <Link 
          to="/" 
          className="absolute top-6 left-6 text-gray-400 hover:text-[#148F77] transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Volver
        </Link>
        {/* ----------------------------------------- */}

        
        {/* Logo y Encabezado */}
        <div className="text-center mb-8">
          <Link to="/">
            <img 
              src={logo} 
              alt="Logo Clínica Alba" 
              className="h-16 w-auto object-contain mx-auto mb-4 drop-shadow-md hover:scale-105 transition-transform cursor-pointer" 
            />
          </Link>
          <h2 className="animate-text-fast text-3xl font-black text-[#2A5C4D] tracking-tight">
            Bienvenido
          </h2>
          <p className="animate-text-fast delay-150 text-[#148F77] text-xs font-bold uppercase tracking-widest mt-1">
            Acceso Clínica Alba
          </p>
        </div>

        {/* MENSAJE ERROR */}
        {error && (
          <div className="bg-red-50/90 border border-red-200 text-red-600 px-4 py-3.5 rounded-lg mb-6 text-sm flex items-center shadow-sm animate-shake transition-all">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium tracking-wide">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Input Usuario/Correo */}
          <div>
            <label className={labelClass}>
              Usuario o Correo
            </label>
            <input
              type="text"
              required
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className={inputClass}
              placeholder="correo@ejemplo.com o tu usuario"
            />
          </div>

          {/* Input Contraseña */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={labelClass}>
                Contraseña
              </label>
              <Link to="#" className="text-[10px] font-bold text-[#148F77] uppercase hover:text-[#2A5C4D] hover:underline transition-colors">
                ¿Olvidaste tu clave?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {/* Botón de Acción */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 mt-2 rounded-xl font-bold text-white shadow-xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center tracking-wide ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#148F77] hover:bg-[#0f6b59] hover:shadow-[#148F77]/30'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Autenticando...
              </span>
            ) : (
              "INGRESAR AL SISTEMA"
            )}
          </button>
        </form>

        {/* Pie de la tarjeta */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/register" className="text-[#148F77] font-bold hover:text-[#2A5C4D] transition-colors hover:underline">
              REGÍSTRATE AQUÍ
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/LOGO.png';
import fondoWelcome from '../assets/Fondo_Welcome.jpg'; 
import { useAuthStore } from '../store/auth_store';

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ 
          user_input: user.trim(), 
          password: password 
        }),
      });

      // Verificamos si el servidor respondió con un error de red o de ruta (404/500)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error del servidor (${response.status})`);
      }

      const data = await response.json();
      
      if (data.success) {
        /* IMPORTANTE PARA LA BITÁCORA:
          data.user debe contener { id_usuario, nombre, rol, id_sesion }
          Al llamar a login(data.user), el store de Zustand guardará la sesión activa.
        */
        login(data.user); 
        navigate('/panel'); 
      } else {
        throw new Error(data.message || 'Credenciales incorrectas.');
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#148F77] focus:border-transparent outline-none bg-gray-50 text-sm transition-all shadow-inner";
  const labelClass = "block text-[11px] font-bold text-[#2A5C4D] uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-10 font-sans antialiased">
      
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm" style={{ backgroundImage: `url(${fondoWelcome})` }}></div>
      <div className="absolute inset-0 bg-[#2A5C4D]/70 mix-blend-multiply"></div>

      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden z-10 animate-fade-in-up">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#148F77] to-[#2A5C4D]"></div>
        
        <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-[#148F77] transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest z-20">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Volver
        </Link>
        
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Logo" className="h-16 w-auto mx-auto mb-4 drop-shadow-md hover:scale-105 transition-transform" />
          </Link>
          <h2 className="text-3xl font-black text-[#2A5C4D] tracking-tight italic">BIENVENIDO</h2>
          <p className="text-[#148F77] text-xs font-bold uppercase tracking-widest mt-1">Inicia sesión en Clínica Alba</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm flex items-center animate-shake">
            <span className="font-bold text-[10px] uppercase">⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className={labelClass}>Usuario o Correo</label>
            <input type="text" required value={user} onChange={(e) => setUser(e.target.value)} className={inputClass} placeholder="Nombre de usuario o e-mail" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={labelClass}>Contraseña</label>
              <Link to="/forgot-password" className="text-[10px] font-bold text-[#148F77] uppercase hover:text-[#2A5C4D]">¿Olvidaste tu contraseña?</Link>
            </div>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className={`w-full py-4 mt-2 rounded-xl font-black text-white shadow-xl transition-all transform active:scale-95 flex items-center justify-center ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#148F77] hover:bg-[#0f6b59]'}`}>
            {loading ? "AUTENTICANDO..." : "INGRESAR AL SISTEMA"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/register" className="text-[#148F77] font-bold hover:underline">REGÍSTRATE AQUÍ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/LOGO.png'; // Logo de Clínica Alba
import fondoWelcome from '../assets/Fondo_Welcome.jpg'; // Usamos la misma imagen del Welcome

// ÚNICA DECLARACIÓN DE LA URL
const API_URL = import.meta.env.VITE_API_URL;

export default function Register() {
  const navigate = useNavigate();

  // ESTADOS
  const [userName, setUserName] = useState('');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(''); 
  const [direccion, setDireccion] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fecha límite para el HTML (Evita seleccionar fechas futuras)
  const fechaHoy = new Date().toISOString().split("T")[0];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // 1. VALIDACIÓN DE CONTRASEÑAS
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    // 2. VALIDACIÓN ESTRICTA DE FECHA (Evita errores de tipeo absurdos)
    const anioIngresado = parseInt(fechaNacimiento.split('-')[0]);
    const anioActual = new Date().getFullYear();
    
    if (anioIngresado < 1900 || anioIngresado > anioActual) {
      setError('Por favor, ingresa un año de nacimiento válido.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user: userName,
          ci: documentoIdentidad,
          name: nombreCompleto,
          mail: correo,
          number: telefono,
          birth: fechaNacimiento,
          dir: direccion,
          password: password 
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Error del servidor (Posiblemente falta configurar CORS en Flask).");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Error al registrar.');
      }

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clase reutilizable para los inputs
  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#148F77] focus:border-transparent outline-none bg-gray-50 text-sm transition-all shadow-inner";
  const labelClass = "block text-[11px] font-bold text-[#2A5C4D] uppercase tracking-wider mb-1";

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-10 font-sans antialiased">
      
      {/* IMAGEN DE FONDO */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
        style={{ backgroundImage: `url(${fondoWelcome})` }}
      ></div>
      
      {/* CAPA OSCURECEDORA */}
      <div className="absolute inset-0 bg-[#2A5C4D]/70 mix-blend-multiply"></div>

      {/* TARJETA DEL FORMULARIO */}
      <div className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/50 relative overflow-hidden z-10 animate-fade-in-up">
        
        {/* Barra superior de acento */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#148F77] to-[#2A5C4D]"></div>

        {/* BOTÓN PARA VOLVER A WELCOME */}
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
        <div className="text-center mb-6">
          <Link to="/">
            <img 
              src={logo} 
              alt="Logo Clínica Alba" 
              className="h-16 w-auto object-contain mx-auto mb-3 drop-shadow-md hover:scale-105 transition-transform" 
            />
          </Link>
          <h2 className="text-3xl font-black text-[#2A5C4D] tracking-tight">
            Registro
          </h2>
          <p className="text-[#148F77] text-xs font-bold uppercase tracking-widest mt-1">
            Clínica Alba
          </p>
        </div>

        {/* MENSAJES DE ERROR Y ÉXITO */}
        {error && (
          <div className="bg-red-50/90 border border-red-200 text-red-600 px-4 py-3.5 rounded-lg mb-5 text-sm flex items-center shadow-sm">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium tracking-wide">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-[#E8F4F8] border border-[#148F77]/30 text-[#2A5C4D] px-4 py-3.5 rounded-lg mb-5 text-sm flex items-center shadow-sm">
             <svg className="w-5 h-5 mr-3 flex-shrink-0 text-[#148F77]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
            <span className="font-medium tracking-wide">Cuenta creada exitosamente. Redirigiendo...</span>
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleRegister} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Nombre de Usuario *</label>
              <input 
                type="text" 
                required 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)} 
                className={inputClass} 
                placeholder="luis_garcia" 
              />
            </div>
            <div>
              <label className={labelClass}>CI / NIT *</label>
              <input 
                type="number" 
                required 
                value={documentoIdentidad} 
                onChange={(e) => setDocumentoIdentidad(e.target.value)} 
                className={inputClass} 
                placeholder="" 
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Nombre Completo *</label>
            <input 
              type="text" 
              required 
              value={nombreCompleto} 
              onChange={(e) => setNombreCompleto(e.target.value)} 
              className={inputClass} 
              placeholder="Nombre y Apellidos" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Correo Electrónico *</label>
              <input 
                type="email" 
                required 
                value={correo} 
                onChange={(e) => setCorreo(e.target.value)} 
                className={inputClass} 
                placeholder="correo@ejemplo.com" 
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input 
                type="number" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                className={inputClass} 
                placeholder="" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Fecha de Nacimiento *</label>
              <input 
                type="date" 
                required 
                value={fechaNacimiento} 
                onChange={(e) => setFechaNacimiento(e.target.value)} 
                min="1900-01-01"
                max={fechaHoy}
                maxLength="10"
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Dirección (Opcional)</label>
              <input 
                type="text" 
                value={direccion} 
                onChange={(e) => setDireccion(e.target.value)} 
                className={inputClass} 
                placeholder="" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Contraseña *</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className={inputClass} 
                placeholder="" 
              />
            </div>
            <div>
              <label className={labelClass}>Confirmar Contraseña *</label>
              <input 
                type="password" 
                required 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className={inputClass} 
                placeholder="" 
              />
            </div>
          </div>

          {/* BOTÓN DE SUBMIT */}
          <button
            type="submit"
            disabled={loading || success}
            className={`w-full py-4 mt-6 rounded-xl font-bold text-white shadow-xl transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center tracking-wide ${
              loading || success ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#148F77] hover:bg-[#0f6b59] hover:shadow-[#148F77]/30'
            }`}
          >
            {loading ? (
               <span className="flex items-center gap-2">
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Procesando...
               </span>
            ) : (
              "REGISTRARME"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 font-medium">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-[#148F77] font-bold hover:text-[#2A5C4D] transition-colors hover:underline">
              INICIA SESIÓN AQUÍ
            </Link>
          </p>
        </div>
        
      </div>
    </div>
  );
}
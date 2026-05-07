import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Bitacora() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 1. EL ESTADO: Ahora usamos 'nombre' en lugar de 'id_usuario'
  const [filters, setFilters] = useState({
    nombre: '', 
    modulo: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  // 2. LA FUNCIÓN DE CARGA: Debe usar las llaves exactas del estado
  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      
      // Vinculamos el filtro de nombre a la URL
      if (filters.nombre.trim()) params.append('nombre', filters.nombre.trim());
      if (filters.modulo) params.append('modulo', filters.modulo);
      if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
      if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);

      console.log("Buscando con params:", params.toString()); // Debug para consola

      const res = await fetch(`${API_URL}/bitacora?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setLogs(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => {
    fetchLogs();
  }, []);

  // 3. MANEJADOR DEL BOTÓN: Previene la recarga y dispara la búsqueda
  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (accion) => {
    const styles = {
      'LOGIN_SUCCESS': 'bg-emerald-100 text-emerald-700',
      'LOGIN_FAILED': 'bg-red-100 text-red-700',
      'DELETE': 'bg-rose-100 text-rose-700',
      'CREATE': 'bg-blue-100 text-blue-700',
      'UPDATE': 'bg-amber-100 text-amber-700',
      'default': 'bg-gray-100 text-gray-700'
    };
    return styles[accion] || styles.default;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#2A5C4D] tracking-tighter italic">Auditoría de Sistema</h2>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Historial de movimientos - Clínica Alba</p>
      </div>

      {/* FORMULARIO DE FILTROS */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-[2rem] shadow-xl mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end border border-gray-50">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Módulo</label>
          <select 
            className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-200"
            value={filters.modulo}
            onChange={(e) => setFilters({...filters, modulo: e.target.value})}
          >
            <option value="">Todos los módulos</option>
            <option value="AUTH">AUTH (Sesiones)</option>
            <option value="CITAS">CITAS (Agenda)</option>
            <option value="USUARIOS">USUARIOS (Cuentas)</option>
            <option value="SECURITY">SECURITY (Alertas)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Buscar por Nombre</label>
          <input 
            type="text" 
            placeholder="Ej: Luis o @lucho"
            className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-200"
            value={filters.nombre}
            onChange={(e) => setFilters({...filters, nombre: e.target.value})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Desde</label>
          <input 
            type="date" 
            className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-200"
            value={filters.fecha_inicio}
            onChange={(e) => setFilters({...filters, fecha_inicio: e.target.value})}
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Hasta</label>
          <input 
            type="date" 
            className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-200"
            value={filters.fecha_fin}
            onChange={(e) => setFilters({...filters, fecha_fin: e.target.value})}
          />
        </div>

        {/* EL BOTÓN: Debe estar dentro del form para que el 'enter' también funcione */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full p-3 bg-[#148F77] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#117A65] transition-all disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Filtrar'}
        </button>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border-l-4 border-red-500">
          ⚠️ {error}
        </div>
      )}

      {/* TABLA DE RESULTADOS */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#2A5C4D] text-white">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Fecha y Hora</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Usuario Responsable</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Módulo</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Acción</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest">Descripción del Evento</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest">IP Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex justify-center space-x-2 animate-pulse">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="p-5 text-[11px] font-bold text-gray-400">{log.fecha}</td>
                    <td className="p-5">
                      <div className="text-[11px] font-black text-[#2A5C4D] uppercase">{log.usuario}</div>
                      <div className="text-[8px] text-gray-300 font-bold">SESIÓN: {log.id_sesion || 'S/N'}</div>
                    </td>
                    <td className="p-5 text-[10px] font-black text-gray-400 uppercase">{log.modulo}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${getActionBadge(log.accion)}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="p-5 text-[11px] text-gray-600 font-medium max-w-xs" title={log.descripcion}>
                      {log.descripcion}
                    </td>
                    <td className="p-5">
                      <code className="bg-gray-50 px-2 py-1 rounded text-[9px] text-gray-400 font-mono">
                        {log.metadata?.ip || 'Desconocida'}
                      </code>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-[0.2em] italic">
                    Sin registros que coincidan con la búsqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
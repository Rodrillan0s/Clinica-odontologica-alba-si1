import { useState, useEffect } from 'react';
// IMPORTANTE: Asegúrate que esta ruta apunte correctamente a tu RegisterPatient
import FormularioPaciente from '../../pages/RegisterPatient';

const API_URL = import.meta.env.VITE_API_URL;

export default function ModuloPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/pacientes`);
      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Error al obtener pacientes");
      }

      setPacientes(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-[#2A5C4D]">
          Pacientes
        </h2>

        <button
          onClick={() => setShowForm(true)}
          className="bg-[#148F77] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#0f6b59] transition"
        >
          + Registrar Nuevo Paciente
        </button>
      </div>

      {loading && <p>Cargando pacientes...</p>}
      {error && <p className="text-red-500 font-bold">Error: {error}</p>}
      {!loading && !error && pacientes.length === 0 && <p>No hay pacientes</p>}

      {!loading && !error && pacientes.map((p) => (
        <div key={p.id} className="p-4 bg-white rounded-xl shadow mb-2">
          <p className="font-bold text-[#2A5C4D]">{p.nombre}</p>
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-500 font-bold z-10"
            >
              ✕
            </button>

            <FormularioPaciente
              onClose={() => setShowForm(false)}
              onSuccess={() => {
                setShowForm(false);
                fetchPacientes();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
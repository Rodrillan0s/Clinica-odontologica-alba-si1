import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function FormularioPaciente({ onClose, onSuccess }) {
  const token = localStorage.getItem('token');
  const [formData, setFormData] = useState({
    nombre: '',
    ci: '',
    fecha_nacimiento: '',
    direccion: '',
    telefono: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // limpia error al escribir
    setErrors({
      ...errors,
      [e.target.name]: ''
    });
  };

  const validate = () => {
    const newErrors = {};

    if (formData.ci && isNaN(Number(formData.ci))) {
      newErrors.ci = "Este campo debe ser numérico";
    }

    if (formData.telefono && isNaN(Number(formData.telefono))) {
      newErrors.telefono = "Este campo debe ser numérico";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/pacientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
         },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        alert("Paciente registrado correctamente");
        onSuccess?.();
        onClose?.();
      } else {
        alert(data.message);
      }

    } catch (error) {
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-2xl mx-auto relative">

      {/*  BOTÓN CERRAR */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl font-black"
      >
        ✕
      </button>

      <h3 className="text-xl font-black mb-4">Registrar Paciente</h3>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          name="nombre"
          placeholder="Nombre completo"
          onChange={handleChange}
          required
          className="w-full p-3 bg-gray-50 rounded-xl"
        />

        <div>
          <input
            name="ci"
            placeholder="CI"
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-50 rounded-xl"
          />
          {errors.ci && (
            <p className="text-red-500 text-sm mt-1">{errors.ci}</p>
          )}
        </div>

        <input
          type="date"
          name="fecha_nacimiento"
          onChange={handleChange}
          required
          className="w-full p-3 bg-gray-50 rounded-xl"
        />

        <input
          name="direccion"
          placeholder="Dirección"
          onChange={handleChange}
          className="w-full p-3 bg-gray-50 rounded-xl"
        />

        <div>
          <input
            name="telefono"
            placeholder="Teléfono"
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 rounded-xl"
          />
          {errors.telefono && (
            <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#148F77] text-white py-3 rounded-xl"
        >
          {loading ? "Guardando..." : "Registrar"}
        </button>

      </form>
    </div>
  );
}
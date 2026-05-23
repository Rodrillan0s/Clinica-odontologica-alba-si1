import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function EditPatient({
  paciente,
  onSuccess,
  onClose
}) {

  const [formData, setFormData] = useState({
    nombre: '',
    ci: '',
    fecha_nacimiento: '',
    direccion: '',
    telefono: ''
  });

  const [loading, setLoading] = useState(false);

  // MENSAJES VISUALES
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  useEffect(() => {

    if (paciente) {

      setFormData({
        nombre: paciente.nombre || '',
        ci: paciente.ci || '',
        fecha_nacimiento:
          paciente.fecha_nacimiento || '',
        direccion: paciente.direccion || '',
        telefono: paciente.telefono || ''
      });

    }

  }, [paciente]);

  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setMensaje('');
    setTipoMensaje('');

    try {

      setLoading(true);

      // SOLO CAMPOS MODIFICADOS
      const cambios = {};

      if (formData.nombre !== paciente.nombre) {
        cambios.nombre = formData.nombre;
      }

      if (String(formData.ci) !== String(paciente.ci)) {
        cambios.ci = formData.ci;
      }

      if (
        formData.fecha_nacimiento !==
        paciente.fecha_nacimiento
      ) {
        cambios.fecha_nacimiento =
          formData.fecha_nacimiento;
      }

      if (
        formData.direccion !==
        paciente.direccion
      ) {
        cambios.direccion = formData.direccion;
      }

      if (
        String(formData.telefono) !==
        String(paciente.telefono)
      ) {
        cambios.telefono = formData.telefono;
      }

      // SI NO HAY CAMBIOS
      if (Object.keys(cambios).length === 0) {

        setTipoMensaje('error');

        setMensaje('No se realizaron cambios');

        setLoading(false);

        return;
      }

      const res = await fetch(
        `${API_URL}/pacientes/${paciente.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cambios)
        }
      );

      const data = await res.json();

      if (!res.ok || data.success === false) {

        throw new Error(
          data.message || 'Error al modificar paciente'
        );

      }

      setTipoMensaje('success');

      setMensaje('Paciente modificado correctamente');

      setTimeout(() => {
        onSuccess();
      }, 1200);

    } catch (err) {

      setTipoMensaje('error');

      setMensaje(
        err.message || 'Ocurrió un error inesperado'
      );

    } finally {

      setLoading(false);

    }
  };

  return (

    <div className="
      bg-white
      rounded-3xl
      shadow-2xl
      p-5
      sm:p-8
      w-full
    ">

      {/* HEADER */}
      <div className="mb-6">

        <h2 className="
          text-2xl
          sm:text-3xl
          font-black
          text-[#2A5C4D]
        ">
          Editar Paciente
        </h2>

        <p className="
          text-gray-500
          mt-1
        ">
          Modifique los datos necesarios
        </p>

      </div>

      {/* MENSAJES */}
      {mensaje && (

        <div
          className={`
            mb-5
            p-4
            rounded-xl
            font-semibold
            border
            ${
              tipoMensaje === 'error'
                ? 'bg-red-100 text-red-700 border-red-300'
                : 'bg-green-100 text-green-700 border-green-300'
            }
          `}
        >

          {mensaje}

        </div>

      )}

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* NOMBRE */}
        <div>

          <label className="
            block
            font-semibold
            text-gray-700
            mb-2
          ">
            Nombre Completo
          </label>

          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="
              w-full
              border
              border-gray-300
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-[#148F77]
            "
          />

        </div>

        {/* CI */}
        <div>

          <label className="
            block
            font-semibold
            text-gray-700
            mb-2
          ">
            CI
          </label>

          <input
            type="number"
            name="ci"
            value={formData.ci}
            onChange={handleChange}
            className="
              w-full
              border
              border-gray-300
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-[#148F77]
            "
          />

        </div>

        {/* FECHA */}
        <div>

          <label className="
            block
            font-semibold
            text-gray-700
            mb-2
          ">
            Fecha de Nacimiento
          </label>

          <input
            type="date"
            name="fecha_nacimiento"
            value={formData.fecha_nacimiento}
            onChange={handleChange}
            className="
              w-full
              border
              border-gray-300
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-[#148F77]
            "
          />

        </div>

        {/* DIRECCIÓN */}
        <div>

          <label className="
            block
            font-semibold
            text-gray-700
            mb-2
          ">
            Dirección
          </label>

          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            className="
              w-full
              border
              border-gray-300
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-[#148F77]
            "
          />

        </div>

        {/* TELÉFONO */}
        <div>

          <label className="
            block
            font-semibold
            text-gray-700
            mb-2
          ">
            Teléfono
          </label>

          <input
            type="number"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className="
              w-full
              border
              border-gray-300
              rounded-xl
              px-4
              py-3
              outline-none
              focus:ring-2
              focus:ring-[#148F77]
            "
          />

        </div>

        {/* BOTONES */}
        <div className="
          flex
          flex-col
          sm:flex-row
          gap-3
          pt-4
        ">

          <button
            type="button"
            onClick={onClose}
            className="
              flex-1
              bg-gray-200
              hover:bg-gray-300
              text-gray-700
              py-3
              rounded-xl
              font-bold
              transition
            "
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="
              flex-1
              bg-[#148F77]
              hover:bg-[#0f6b59]
              disabled:opacity-50
              text-white
              py-3
              rounded-xl
              font-bold
              transition
            "
          >
            {loading
              ? 'Guardando...'
              : 'Guardar Cambios'}
          </button>

        </div>

      </form>

    </div>

  );
}
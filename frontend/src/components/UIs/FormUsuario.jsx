import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function FormUsuarioModal({ roles = [], onClose, onSuccess }) {

  const [form, setForm] = useState({
    user: "",
    ci: "",
    name: "",
    mail: "",
    number: "",
    birth: "",
    dir: "",
    password: "",
    id_rol: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al crear usuario");
      }

      onSuccess?.();
      onClose?.();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const input =
    "w-full p-3 bg-gray-50 rounded-xl border outline-none focus:ring-2 focus:ring-[#148F77]";

  return (
    
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative animate-fadeIn">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-2xl font-bold"
        >
          ✕
        </button>

        {/* TITLE */}
        <h2 className="text-xl font-black mb-4 text-[#2A5C4D]">
          Nuevo Usuario
        </h2>

        {/* ERROR */}
        {error && (
          <div className="mb-3 text-red-600 font-bold text-sm">
            {error}
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >

          <input name="user" placeholder="Usuario" onChange={handleChange} className={input} />
          <input name="ci" placeholder="CI" onChange={handleChange} className={input} />
          <input name="name" placeholder="Nombre completo" onChange={handleChange} className={input} />
          <input name="mail" placeholder="Correo" onChange={handleChange} className={input} />

          {/* FECHA NACIMIENTO */}
          <input type="date" name="birth" onChange={handleChange} className={input} />

          <input name="number" placeholder="Teléfono" onChange={handleChange} className={input} />
          <input name="dir" placeholder="Dirección" onChange={handleChange} className={input} />
          <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} className={input} />

          <select name="id_rol" onChange={handleChange} className={input}>
            <option value="">Seleccionar rol</option>
            {roles.map(r => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.rol}
              </option>
            ))}
          </select>

          {/* BUTTONS */}
          <div className="md:col-span-2 flex gap-2 mt-2">

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#148F77] text-white py-3 rounded-xl font-bold hover:bg-[#0f6b59]"
            >
              {loading ? "Creando..." : "Crear Usuario"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 py-3 rounded-xl font-bold"
            >
              Cancelar
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function FormEditUsuarioModal({ user, onClose, onSuccess }) {

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const [form, setForm] = useState({
    user: "",
    correo: "",
    id_rol: ""
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState(false);

  // =========================
  // CARGAR USUARIO
  // =========================
  useEffect(() => {
    if (user) {
      setForm({
        user: user.usuario || "",
        correo: user.correo || "",
        id_rol: user.id_rol || ""
      });
    }
  }, [user]);

  // =========================
  // ROLES
  // =========================
  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/roles`, { headers });
      const data = await res.json();
      setRoles(data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // =========================
  // INPUTS
  // =========================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleRolChange = (e) => {
    setWarning(true);
    setForm({
      ...form,
      id_rol: e.target.value
    });
  };

  // =========================
  // GUARDAR (IMPORTANTE: ASIGNAR ROL REAL)
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      // 🔥 SOLO CAMBIO DE ROL (usa tu backend correcto)
      const resRol = await fetch(`${API_URL}/usuarios/asignar-rol`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id_usuario: user.id_usuario,
          id_rol: form.id_rol
        })
      });

      const dataRol = await resRol.json();

      if (!resRol.ok || !dataRol.success) {
        throw new Error(dataRol.message || "Error al asignar rol");
      }

      onSuccess?.();
      onClose?.();

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 z-50">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">

          <h2 className="text-lg font-black text-[#2A5C4D]">
            Editar Usuario
          </h2>

          <button
            onClick={onClose}
            className="text-xl hover:text-red-500"
          >
            ✕
          </button>

        </div>

        {/* WARNING */}
        {warning && (
          <div className="mb-3 p-2 bg-yellow-100 text-yellow-800 text-xs rounded">
            ⚠ Al cambiar el rol, los permisos del usuario se reiniciarán y sincronizarán automáticamente.
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            name="user"
            value={form.user}
            disabled
            className="w-full p-3 border rounded-xl bg-gray-100"
          />

          <input
            name="correo"
            value={form.correo}
            disabled
            className="w-full p-3 border rounded-xl bg-gray-100"
          />

          {/* ROLES */}
          <select
            value={form.id_rol}
            onChange={handleRolChange}
            className="w-full p-3 border rounded-xl"
          >
            <option value="">Seleccionar rol</option>

            {roles.map(r => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.rol}
              </option>
            ))}

          </select>

          {/* BUTTON */}
          <button
            disabled={loading}
            className="w-full bg-[#148F77] text-white py-3 rounded-xl font-bold"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>

        </form>

      </div>
    </div>
  );
}
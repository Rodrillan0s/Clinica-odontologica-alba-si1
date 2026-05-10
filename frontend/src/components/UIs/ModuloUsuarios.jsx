import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function ModuloUsuarios() {

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  const [showForm, setShowForm] = useState(false);

  // =========================
  // TOKEN
  // =========================
  const token = localStorage.getItem("token");

  // =========================
  // HEADERS AUTH
  // =========================
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  // =========================
  // FETCH USUARIOS
  // =========================
  const fetchUsuarios = async () => {

    try {

      setLoading(true);

      const res = await fetch(`${API_URL}/usuarios`, {
        headers: authHeaders
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Error usuarios");
      }

      setUsuarios(data.data || []);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  };

  // =========================
  // FETCH ROLES
  // =========================
  const fetchRoles = async () => {

    try {

      const res = await fetch(`${API_URL}/roles`, {
        headers: authHeaders
      });

      const data = await res.json();

      if (data.success) {
        setRoles(data.data);
      }

    } catch (err) {

      console.log(err);

    }
  };

  useEffect(() => {

    fetchUsuarios();
    fetchRoles();

  }, []);

  // =========================
  // ASIGNAR ROL
  // =========================
  const asignarRol = async () => {

    try {

      await fetch(`${API_URL}/usuarios/asignar-rol`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          id_usuario: selectedUser,
          id_rol: selectedRole
        })
      });

      setSelectedUser(null);
      setSelectedRole("");

      fetchUsuarios();

    } catch (err) {

      console.log(err);

    }
  };

  return (
    <div className="p-4 md:p-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

        <h2 className="text-2xl md:text-3xl font-black text-[#2A5C4D]">
          Usuarios
        </h2>

        <button
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto bg-[#148F77] text-white px-5 py-3 rounded-xl font-bold hover:bg-[#0f6b59] transition"
        >
          + Nuevo Usuario
        </button>

      </div>

      {/* LOADING / ERROR */}
      {loading && (
        <p className="text-gray-500">
          Cargando usuarios...
        </p>
      )}

      {error && (
        <p className="text-red-500 font-bold">
          {error}
        </p>
      )}

      {/* LISTA */}
      <div className="space-y-3">

        {!loading && usuarios.map(u => (

          <div
            key={u.id_usuario}
            className="
              p-4
              bg-white
              rounded-2xl
              shadow-sm
              border
              border-gray-100
              flex
              flex-col
              md:flex-row
              md:justify-between
              md:items-center
              gap-4
            "
          >

            {/* INFO */}
            <div className="min-w-0">

              <p className="font-bold text-[#2A5C4D] break-words">
                {u.usuario}
              </p>

              <p className="text-sm text-gray-500 break-all">
                {u.correo}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                {u.rol}
              </p>

            </div>

            {/* BUTTON */}
            <button
              onClick={() => setSelectedUser(u.id_usuario)}
              className="
                w-full
                md:w-auto
                text-sm
                bg-blue-500
                hover:bg-blue-600
                transition
                text-white
                px-4
                py-2
                rounded-xl
                font-semibold
              "
            >
              Cambiar rol
            </button>

          </div>

        ))}

      </div>

      {/* PANEL ASIGNAR ROL */}
      {selectedUser && (

        <div className="mt-6 p-4 md:p-6 bg-gray-100 rounded-2xl">

          <h3 className="font-bold mb-4 text-[#2A5C4D] text-lg">
            Asignar Rol
          </h3>

          <div className="flex flex-col md:flex-row gap-3">

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="
                w-full
                md:w-72
                p-3
                rounded-xl
                border
                bg-white
              "
            >
              <option value="">
                Seleccione rol
              </option>

              {roles.map(r => (
                <option key={r.id_rol} value={r.id_rol}>
                  {r.rol}
                </option>
              ))}
            </select>

            <button
              onClick={asignarRol}
              className="
                w-full
                md:w-auto
                bg-green-600
                hover:bg-green-700
                transition
                text-white
                px-5
                py-3
                rounded-xl
                font-bold
              "
            >
              Guardar
            </button>

          </div>

        </div>

      )}

    </div>
  );
}
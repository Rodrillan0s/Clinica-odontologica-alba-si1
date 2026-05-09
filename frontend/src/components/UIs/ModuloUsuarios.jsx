import { useEffect, useState } from "react";

import FormUsuarioModal from "./FormUsuario";
import FormPermisosUsuarioModal from "./FormPermisos";
import FormEditUsuarioModal from "./FormEditUsuario";

const API_URL = import.meta.env.VITE_API_URL;

export default function ModuloUsuarios() {

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // MODALES
  // =========================
  const [showCreate, setShowCreate] = useState(false);
  const [userPermisos, setUserPermisos] = useState(null);
  const [userEdit, setUserEdit] = useState(null);

  const [roles, setRoles] = useState([]);

  // =========================
  // FILTROS
  // =========================
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // =========================
  // FETCH USUARIOS
  // =========================
  const fetchUsuarios = async () => {

    try {
      const res = await fetch(`${API_URL}/usuarios`, { headers });
      const data = await res.json();

      setUsuarios(data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // ROLES
  // =========================
  const fetchRoles = async () => {

    const res = await fetch(`${API_URL}/roles`, { headers });
    const data = await res.json();

    setRoles(data.data || []);
  };

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  // =========================
  // DESHABILITAR / HABILITAR
  // =========================
  const toggleEstado = async (u) => {

    await fetch(`${API_URL}/usuarios/${u.id_usuario}`, {
      method: "DELETE",
      headers
    });

    fetchUsuarios();
  };

  // =========================
  // FILTROS
  // =========================
  const filtered = usuarios.filter(u => {

    const matchSearch =
      (u.nombre_usuario || u.usuario || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.correo || "").toLowerCase().includes(search.toLowerCase());

    const matchRol = filterRol ? u.rol === filterRol : true;

    const matchEstado =
      filterEstado === ""
        ? true
        : filterEstado === "activo"
          ? u.estado !== false
          : u.estado === false;

    return matchSearch && matchRol && matchEstado;
  });

  return (

    <div className="p-4 md:p-6">

      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">

        <h2 className="text-2xl md:text-3xl font-black text-[#2A5C4D]">
          Usuarios
        </h2>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#148F77] text-white px-4 py-3 rounded-xl font-bold"
        >
          + Nuevo Usuario
        </button>

      </div>

      {/* =========================
          FILTROS
      ========================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-5">

        <input
          placeholder="Buscar usuario o correo"
          className="border p-3 rounded-xl"
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-3 rounded-xl"
          onChange={(e) => setFilterRol(e.target.value)}
        >
          <option value="">Todos los roles</option>
          {roles.map(r => (
            <option key={r.id_rol} value={r.rol}>
              {r.rol}
            </option>
          ))}
        </select>

        <select
          className="border p-3 rounded-xl"
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>

      </div>

      {/* =========================
          LISTA
      ========================= */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (

        <div className="space-y-3">

          {filtered.map(u => (

            <div
              key={u.id_usuario}
              className={`
                p-4 rounded-xl shadow-sm
                flex flex-col md:flex-row
                md:justify-between md:items-center
                gap-3
                ${u.estado === false ? "bg-gray-100 opacity-60" : "bg-white"}
              `}
            >

              {/* INFO */}
              <div className="min-w-0">

                <p className="font-bold text-[#2A5C4D] truncate">
                  {u.usuario}
                </p>

                <p className="text-sm text-gray-500 truncate">
                  {u.correo}
                </p>

                <p className="text-xs text-gray-400">
                  {u.rol}
                </p>

              </div>

              {/* BOTONES */}
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">

                <button
                  onClick={() => setUserPermisos(u)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Permisos
                </button>

                <button
                  onClick={() => setUserEdit(u)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm"
                >
                  Editar
                </button>

                <button
                  onClick={() => toggleEstado(u)}
                  className={`
                    px-4 py-2 rounded-xl text-sm text-white
                    ${u.estado === false ? "bg-green-500" : "bg-red-500"}
                  `}
                >
                  {u.estado === false ? "Habilitar" : "Deshabilitar"}
                </button>

              </div>

            </div>

          ))}

        </div>

      )}

      {/* =========================
          MODALES
      ========================= */}
      {showCreate && (
        <FormUsuarioModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchUsuarios();
          }}
        />
      )}

      {userPermisos && (
        <FormPermisosUsuarioModal
          user={userPermisos}
          onClose={() => setUserPermisos(null)}
        />
      )}

      {userEdit && (
        <FormEditUsuarioModal
          user={userEdit}
          roles={roles}
          onClose={() => setUserEdit(null)}
          onSuccess={() => {
            setUserEdit(null);
            fetchUsuarios();
          }}
        />
      )}

    </div>
  );
}
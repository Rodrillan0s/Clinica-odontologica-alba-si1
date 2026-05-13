import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function FormPermisosUsuarioModal({ user, onClose }) {

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("activos"); // activos | add
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);

  // =========================
  // FETCH
  // =========================
  const fetchPermisos = async () => {

    setLoading(true);

    const res = await fetch(
      `${API_URL}/usuarios/${user.id_usuario}/permisos`,
      { headers }
    );

    const data = await res.json();
    setPermisos(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchPermisos();
  }, [user]);

  // =========================
  // ACTIONS
  // =========================
  const activar = async (p) => {

    await fetch(`${API_URL}/usuarios/permisos`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id_usuario: user.id_usuario,
        id_permiso: p.id_permiso
      })
    });

    fetchPermisos();
  };

  const quitar = async (p) => {

    await fetch(`${API_URL}/usuarios/permisos`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        id_usuario: user.id_usuario,
        id_permiso: p.id_permiso
      })
    });

    setConfirm(null);
    fetchPermisos();
  };

  // =========================
  // FILTROS BASE
  // =========================
  const activos = permisos.filter(p => p.habilitado);
  const disponibles = permisos.filter(p => !p.habilitado);

  // =========================
  // SEARCH (solo add tab)
  // =========================
  const disponiblesFiltrados = useMemo(() => {
    return disponibles.filter(p =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.modulo || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [search, disponibles]);

  // =========================
  // GROUP BY MODULO
  // =========================
  const groupByModulo = (list) => {
    return list.reduce((acc, p) => {
      const key = p.modulo || "SIN MÓDULO";
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});
  };

  const activosGroup = groupByModulo(activos);
  const disponiblesGroup = groupByModulo(disponiblesFiltrados);

  // =========================
  // UI CARD
  // =========================
  const Card = ({ p, action, label, color }) => (
    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">

      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{p.nombre}</p>
        <p className="text-xs text-gray-400 truncate">{p.modulo}</p>
      </div>

      <button
        onClick={() => action(p)}
        className={`px-3 py-1 rounded-lg text-xs text-white ${color}`}
      >
        {label}
      </button>

    </div>
  );

  return (

    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 z-50">

      <div className="
        w-full max-w-4xl
        bg-white
        rounded-2xl
        shadow-2xl
        flex flex-col
        max-h-[90vh]
      ">

        {/* HEADER */}
        <div className="p-4 border-b flex justify-between">

          <div>
            <h2 className="font-black text-[#2A5C4D]">
              {user.usuario}
            </h2>
            <p className="text-xs text-gray-500">
              Rol: {user.rol}
            </p>
          </div>

          <button onClick={onClose} className="text-xl">✕</button>

        </div>

        {/* TABS */}
        <div className="flex border-b">

          <button
            onClick={() => setTab("activos")}
            className={`flex-1 py-2 font-bold text-sm ${
              tab === "activos" ? "bg-[#148F77] text-white" : "bg-gray-100"
            }`}
          >
            Activos ({activos.length})
          </button>

          <button
            onClick={() => setTab("add")}
            className={`flex-1 py-2 font-bold text-sm ${
              tab === "add" ? "bg-[#148F77] text-white" : "bg-gray-100"
            }`}
          >
            Añadir ({disponibles.length})
          </button>

        </div>

        {/* SEARCH */}
        {tab === "add" && (
          <div className="p-3 border-b">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar permiso o módulo..."
              className="w-full p-2 border rounded-xl text-sm"
            />
          </div>
        )}

        {/* BODY */}
        <div className="p-4 overflow-y-auto flex-1 space-y-6">

          {loading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : tab === "activos" ? (

            Object.keys(activosGroup).map(mod => (

              <div key={mod}>

                <h3 className="font-bold text-[#2A5C4D] mb-2 text-sm">
                  {mod}
                </h3>

                <div className="space-y-2">

                  {activosGroup[mod].map(p => (

                    <Card
                      key={p.id_permiso}
                      p={p}
                      label="Quitar"
                      color="bg-red-500"
                      action={(p) => setConfirm(p)}
                    />

                  ))}

                </div>

              </div>

            ))

          ) : (

            Object.keys(disponiblesGroup).length === 0 ? (
              <p className="text-gray-400 text-sm">Sin permisos disponibles</p>
            ) : (

              Object.keys(disponiblesGroup).map(mod => (

                <div key={mod}>

                  <h3 className="font-bold text-[#2A5C4D] mb-2 text-sm">
                    {mod}
                  </h3>

                  <div className="space-y-2">

                    {disponiblesGroup[mod].map(p => (

                      <Card
                        key={p.id_permiso}
                        p={p}
                        label="Activar"
                        color="bg-green-600"
                        action={activar}
                      />

                    ))}

                  </div>

                </div>

              ))

            )

          )}

        </div>

        {/* FOOTER */}
        <div className="p-3 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 py-2 rounded-xl font-bold"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* CONFIRM MODAL */}
      {confirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

          <div className="bg-white p-5 rounded-xl w-[300px] text-center">

            <p className="mb-4 text-sm">
              ¿Quitar <b>{confirm.nombre}</b>?
            </p>

            <div className="flex gap-2">

              <button
                onClick={() => quitar(confirm)}
                className="flex-1 bg-red-500 text-white py-2 rounded"
              >
                Sí
              </button>

              <button
                onClick={() => setConfirm(null)}
                className="flex-1 bg-gray-200 py-2 rounded"
              >
                No
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
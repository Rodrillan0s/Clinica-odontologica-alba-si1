export default function ModuloCitas({ openModal, openAgendaModal }) {
  const actions = [
    {
      title: "Registrar Cita",
      description: "Programar una nueva cita para un paciente.",
      action: "registrar",
    },
    {
      title: "Modificar Cita",
      description: "Reprogramar o cambiar detalles de una cita.",
      action: "modificar",
    },
    {
      title: "Consultar Cita",
      description: "Ver el calendario y buscar citas existentes.",
      action: "consultar",
    },
    {
      title: "Eliminar Cita",
      description: "Cancelar y eliminar una cita del sistema.",
      action: "eliminar",
    },
  ];

  return (
    <div className="animate-fade-in-up w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#2A5C4D] tracking-tight italic">
          Gestor de Citas
        </h2>
        <p className="text-[#148F77] text-xs font-bold uppercase tracking-widest mt-1">
          Seleccione una operación a realizar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              if (item.action === 'registrar' && openModal) {
                openModal();
              } else if (item.action === 'consultar' && openAgendaModal) {
                openAgendaModal();
              } else {
                console.log("Acción seleccionada:", item.action);
              }
            }}
            className="bg-[#148F77] text-white p-12 rounded-[3rem] shadow-xl cursor-pointer hover:bg-[#0f6b59] transition-all flex justify-between items-center w-full focus:outline-none transform hover:-translate-y-1 group"
          >
            <div className="text-left">
              <h3 className="text-2xl font-black italic mb-2">{item.title}</h3>
              <p className="opacity-70 text-sm font-medium">
                {item.description}
              </p>
            </div>
            <span className="text-5xl font-light opacity-80 group-hover:scale-110 transition-transform">
              {item.symbol}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

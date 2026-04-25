export default function DashboardAdmin() {
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-[#2A5C4D] text-white p-12 rounded-[3rem] shadow-xl">
              <h2 className="text-3xl font-black mb-2 italic">Estado del Sistema</h2>
              <p className="opacity-70 text-xs uppercase tracking-widest mb-8">Administración</p>
              <div className="flex gap-4">
                  <div className="bg-white/10 p-4 rounded-2xl text-center flex-1">
                      <p className="text-2xl font-black">100%</p>
                      <p className="text-[8px] uppercase font-bold opacity-50 mt-1">DISPONIBILIDAD</p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-2xl text-center flex-1">
                      <p className="text-2xl font-black">ONLINE</p>
                      <p className="text-[8px] uppercase font-bold opacity-50 mt-1">CLÍNICA ALBA</p>
                  </div>
              </div>
          </div>
          <div className="bg-orange-500 text-white p-12 rounded-[3rem] shadow-xl flex flex-col justify-center">
              <h3 className="text-xl font-black italic mb-2">AUDITORÍA</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-6">Registro de actividades y eventos importantes. Control de acceso y modificaciones.</p>
          </div>
      </div>
  );
}
import { useParams, Link } from 'react-router-dom';
import logoAgro from '../assets/LOGO.png'; 

// Base de datos local con la info de cada tratamiento
const infoTratamientos = {
  'exodoncia': {
    titulo: 'Exodoncia',
    descripcion: 'Procedimientos especializados para la extracción segura de piezas dentales, incluyendo muelas del juicio. Nos enfocamos en una técnica de mínima invasión para garantizar una recuperación rápida y sin dolor.',
    imagen: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  'endodoncia': {
    titulo: 'Endodoncia',
    descripcion: 'Tratamiento de conductos diseñado para salvar piezas dentales dañadas o profundamente infectadas. Eliminamos el dolor desde la raíz preservando la estructura natural de tu sonrisa.',
    imagen: 'https://images.unsplash.com/photo-1598256989800-efa4ecef9b0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  'protesis-fija': {
    titulo: 'Prótesis Fija',
    descripcion: 'Restauración estética mediante coronas, puentes o carillas fijas de alta resistencia. Devolvemos la funcionalidad y la belleza total a tu boca con materiales biocompatibles de primera calidad.',
    imagen: 'https://images.unsplash.com/photo-1606214582650-6a75f1593dfa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  'protesis-removible': {
    titulo: 'Prótesis Removible',
    descripcion: 'Soluciones personalizadas y cómodas para la reposición de piezas faltantes. Diseñadas a medida para ajustarse perfectamente, devolviéndote la confianza al hablar y comer.',
    imagen: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  'periodoncia': {
    titulo: 'Periodoncia',
    descripcion: 'Especialidad dedicada a la salud de las encías y los tejidos que soportan tus dientes. Prevenimos y tratamos la inflamación o infección para evitar la pérdida de piezas dentales.',
    imagen: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  'odontopediatria': {
    titulo: 'Odontopediatría',
    descripcion: 'Cuidado dental integral especializado para los más pequeños de la casa. Creamos un ambiente amigable, seguro y libre de estrés para que su primera visita sea una experiencia positiva.',
    imagen: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  }
};

export default function Especialidad() {
  const { id } = useParams(); // Esto atrapa el nombre de la URL (ej. 'exodoncia')
  const especialidad = infoTratamientos[id];

  // Si alguien pone una URL rara, le mostramos error
  if (!especialidad) {
    return <div className="min-h-screen flex items-center justify-center text-2xl font-bold text-[#2A5C4D]">Especialidad no encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* NAVBAR SIMPLE PARA VOLVER */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoAgro} alt="Clínica Alba" className="h-10 object-contain" />
            <div className="flex flex-col text-[#2A5C4D]">
              <span className="text-xl font-black tracking-tight leading-none">Clínica Alba</span>
            </div>
          </Link>
          <Link to="/" className="text-gray-500 font-bold hover:text-[#148F77]">Volver al Inicio</Link>
        </div>
      </nav>

      {/* CONTENIDO DEL TRATAMIENTO */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Imagen representativa (Usando placeholder de Unsplash para que se vea pro) */}
        <div className="rounded-2xl overflow-hidden shadow-2xl h-[400px]">
          <img src={especialidad.imagen} alt={especialidad.titulo} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
        </div>

        {/* Info y Botón */}
        <div>
          <span className="text-[#148F77] font-bold tracking-widest uppercase text-sm">Tratamiento Especializado</span>
          <h1 className="text-5xl font-black text-[#2A5C4D] mt-2 mb-6">{especialidad.titulo}</h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-10">
            {especialidad.descripcion}
          </p>
          
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 bg-[#148F77] hover:bg-[#0f6b59] text-white text-lg font-bold py-4 px-10 rounded-full shadow-lg transition-all hover:-translate-y-1 active:scale-95"
          >
            Agendar cita para este tratamiento
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
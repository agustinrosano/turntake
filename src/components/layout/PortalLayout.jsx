import { Outlet, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Share2 } from 'lucide-react';

const PortalLayout = () => {
  const { businessSlug } = useParams();
  const business = useSelector(state => state.business.activeBusiness);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <header className="w-full bg-primary-600 text-white p-6 md:p-8 flex flex-col items-center gap-4 relative">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full border-4 border-white shadow-lg -mb-14 md:-mb-16 z-10 transition-transform hover:scale-105 duration-300 overflow-hidden flex items-center justify-center text-primary-700 font-bold text-2xl md:text-3xl">
           {business?.avatarUrl ? (
             <img src={business.avatarUrl} alt={business?.name || 'Negocio'} className="w-full h-full object-cover" />
           ) : (
             business?.name?.[0] || 'T'
           )}
        </div>
        <button className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
          <Share2 size={20} />
        </button>
      </header>

      <main className="w-full max-w-lg mt-10 md:mt-12 px-4 pb-12">
        <div className="text-center mb-6 md:mb-8">
           <h1 className="text-xl md:text-2xl font-bold text-slate-900">{business?.name || 'Cargando...'}</h1>
           <p className="text-sm text-slate-500 mt-1">{business?.description || 'Reserva tu turno de forma rápida y sencilla'}</p>
        </div>
        <Outlet />
      </main>

      <footer className="mt-auto py-6 text-slate-400 text-xs">
        Powered by <span className="font-semibold text-primary-600">Taketurn</span>
      </footer>
    </div>
  );
};

export default PortalLayout;


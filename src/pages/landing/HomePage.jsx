import { Link } from 'react-router-dom';
import { Calendar, ShieldCheck, Zap, Smartphone as MobileScreen, MessageSquare, BarChart3 } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left z-10">
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider rounded-full mb-6">Nuevo: Reserva ahora</span>
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight">
              Gestiona tus turnos de forma <span className="text-primary-600">profesional</span> y automática.
            </h1>
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0">
              Simplifica la agenda de tu negocio. Una página personalizada para tus clientes, control total para ti. Empieza hoy mismo sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
               <Link to="/register" className="btn-primary py-3 px-8 text-lg">Empezar ahora</Link>
               <Link to="/login" className="bg-white border text-slate-700 hover:bg-slate-50 font-semibold py-3 px-8 rounded-lg transition-colors border-slate-200 shadow-sm">Ver una demo</Link>
            </div>
          </div>
          <div className="flex-1 relative">
             <div className="w-full aspect-square bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-3xl rotate-3 shadow-2xl overflow-hidden flex items-center justify-center p-8">
               <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 flex flex-col gap-4">
                  <div className="h-8 w-1/3 bg-white/20 rounded-md"></div>
                  <div className="space-y-3">
                    <div className="h-12 w-full bg-white/20 rounded-md flex items-center px-4 justify-between">
                       <div className="w-1/2 h-4 bg-white/30 rounded"></div>
                       <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                    </div>
                    <div className="h-12 w-full bg-white/20 rounded-md"></div>
                    <div className="h-12 w-full bg-white/20 rounded-md"></div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Todo lo que necesitas para crecer</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Nuestra plataforma está diseñada para que puedas centrarte en lo que realmente importa: tus clientes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { icon: <Zap />, title: "Reserva instantánea", desc: "Tus clientes reservan en segundos desde cualquier dispositivo." },
               { icon: <ShieldCheck />, title: "Control total", desc: "Gestiona horarios, cancelaciones y disponibilidad de un solo vistazo." },
               { icon: <MessageSquare />, title: "Recordatorios", desc: "Avisos automáticos por WhatsApp y Email para reducir inasistencias." },
               { icon: <Calendar />, title: "Google Calendar", desc: "Sincroniza todos tus turnos con tu calendario favorito." },
               { icon: <BarChart3 />, title: "Dashboard / Caja", desc: "Controla tus ingresos y el historial de tus clientes en un solo lugar." },
               { icon: <MobileScreen />, title: "Página pública", desc: "Tu negocio con una URL personalizada que luce increíble." },
             ].map((feat, i) => (
                <div key={i} className="p-8 border rounded-2xl hover:border-primary-200 hover:shadow-lg hover:shadow-primary-100/50 transition-all group">
                   <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      {feat.icon}
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                   <p className="text-slate-500 leading-relaxed text-sm">{feat.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

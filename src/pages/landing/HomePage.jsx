import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ShieldCheck, Zap, Smartphone as MobileScreen, MessageSquare, BarChart3, Star, Send, Loader2 } from 'lucide-react';
import { dbService } from '../../services/db.service';
import { useNotify } from '../../components/ui/NotificationProvider';

const HomePage = () => {
  const notify = useNotify();
  const [submittingDemo, setSubmittingDemo] = useState(false);
  const [demoForm, setDemoForm] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleDemoSubmit = async (e) => {
    e.preventDefault();
    if (!demoForm.fullName || !demoForm.businessName || !demoForm.email) {
      notify.error('Completa nombre, negocio y email para continuar.', { title: 'Formulario incompleto' });
      return;
    }

    setSubmittingDemo(true);
    try {
      await dbService.createMailingLead({
        fullName: demoForm.fullName.trim(),
        businessName: demoForm.businessName.trim(),
        email: demoForm.email.trim().toLowerCase(),
        phone: demoForm.phone.trim(),
        message: demoForm.message.trim(),
        source: 'landing_demo_form',
        status: 'new'
      });

      setDemoForm({
        fullName: '',
        businessName: '',
        email: '',
        phone: '',
        message: ''
      });
      notify.success('Recibimos tu solicitud. Te contactaremos pronto para la demo.', { title: 'Demo solicitada' });
    } catch (error) {
      notify.error('No pudimos guardar tu solicitud. Intenta nuevamente.', { title: 'Error' });
    } finally {
      setSubmittingDemo(false);
    }
  };

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

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Lo que dicen nuestros usuarios</h2>
            <p className="text-slate-500">Opiniones reales de negocios que ya digitalizaron su agenda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sofia Martinez',
                role: 'Estudio de Pilates',
                text: 'Pasamos de agendar por WhatsApp a tener todo ordenado. Nos ahorro horas por semana.'
              },
              {
                name: 'Diego Rivas',
                role: 'Barberia Premium',
                text: 'La tasa de ausencias bajo muchisimo con los recordatorios automaticos. Excelente.'
              },
              {
                name: 'Camila Torres',
                role: 'Centro de Estetica',
                text: 'La pagina publica se ve profesional y los clientes reservan solos. Super recomendable.'
              }
            ].map((review, i) => (
              <article key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{review.text}"</p>
                <div>
                  <p className="font-bold text-slate-900">{review.name}</p>
                  <p className="text-xs text-slate-500">{review.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-2xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-3">Agenda una demo personalizada</h2>
              <p className="text-slate-300 text-sm sm:text-base">
                Cuentanos sobre tu negocio y te mostramos como implementar Taketurn en minutos.
              </p>
            </div>

            <form onSubmit={handleDemoSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre y apellido"
                value={demoForm.fullName}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary-400"
                required
              />
              <input
                type="text"
                placeholder="Nombre del negocio"
                value={demoForm.businessName}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary-400"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={demoForm.email}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary-400"
                required
              />
              <input
                type="tel"
                placeholder="WhatsApp"
                value={demoForm.phone}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-primary-400"
              />
              <textarea
                placeholder="Contanos que necesitas optimizar"
                rows={4}
                value={demoForm.message}
                onChange={(e) => setDemoForm((prev) => ({ ...prev, message: e.target.value }))}
                className="sm:col-span-2 w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300 outline-none resize-none focus:ring-2 focus:ring-primary-400"
              />
              <button
                type="submit"
                disabled={submittingDemo}
                className="sm:col-span-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submittingDemo ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submittingDemo ? 'Enviando...' : 'Solicitar demo'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Zap, 
  MessageSquare,
  Loader2,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';
import { dbService } from '../../services/db.service';
import { toLocalDateString } from '../../utils/time';

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.businessId) return;
      try {
        const data = await dbService.getBusinessAppointments(user.businessId);
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.businessId]);

  // Calculamos estadísticas reales
  const today = toLocalDateString(new Date());
  const appointmentsToday = appointments.filter(a => a.date === today && a.status !== 'cancelled');
  const uniqueCustomers = new Set(appointments.map(a => a.customerPhone)).size;

  const stats = [
    { label: 'Turnos Hoy', value: appointmentsToday.length.toString(), icon: <Calendar size={24} />, color: 'bg-indigo-500', trend: 'Agenda' },
    { label: 'Total Clientes', value: uniqueCustomers.toString(), icon: <Users size={24} />, color: 'bg-emerald-500', trend: 'Fieles' },
    { label: 'Ingresos Est.', value: `$${appointmentsToday.length * 1500}`, icon: <TrendingUp size={24} />, color: 'bg-amber-500', trend: 'Proyectado' },
  ];

  const recentAppointments = appointments
    .sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`))
    .slice(0, 5);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full animate-pulse"></div>
      </div>
      <p className="text-slate-500 font-bold animate-pulse">Sincronizando tu base de datos...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold uppercase rounded-md tracking-wider">Dashboard Real-time</span>
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">¡Hola, {user?.name?.split(' ')[0] || 'Admin'}! 👋</h1>
           <p className="text-slate-500 font-medium">Tienes <span className="text-primary-600 font-bold">{appointmentsToday.length} turnos</span> programados para hoy.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/appointments')}
          className="bg-slate-900 text-white py-3.5 px-8 rounded-2xl flex items-center gap-3 self-start hover:bg-slate-800 hover:-translate-y-1 active:translate-y-0 transition-all shadow-xl shadow-slate-200 group"
        >
           <Calendar size={18} className="group-hover:rotate-12 transition-transform" />
           <span className="font-bold text-sm">Ver agenda completa</span>
           <ArrowUpRight size={16} className="opacity-50" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary-100 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500">
             <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-4xl font-black text-slate-900 leading-none">{stat.value}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-black uppercase tracking-tighter transition-colors group-hover:bg-primary-50 group-hover:text-primary-600">{stat.trend}</span>
                  <div className="flex -space-x-1 grayscale group-hover:grayscale-0 transition-all">
                     {[1,2,3].map(x => <div key={x} className="w-4 h-4 rounded-full border-2 border-white bg-slate-200"></div>)}
                  </div>
                </div>
             </div>
             <div className={`w-16 h-16 ${stat.color} text-white rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                {stat.icon}
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Appointments */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
           <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-primary-500">
                  <Clock size={20} />
                </div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Próximos Turnos</h3>
              </div>
              <button 
                onClick={() => navigate('/admin/appointments')}
                className="text-primary-600 text-[11px] font-black uppercase tracking-widest hover:text-primary-700 flex items-center gap-2 group bg-primary-50 px-4 py-2 rounded-xl transition-all active:scale-95"
              >
                Ver todos
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
           
           <div className="flex-1 divide-y divide-slate-50">
              {recentAppointments.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center text-center">
                   <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-200">
                      <Calendar className="text-slate-300" size={32} />
                   </div>
                   <p className="text-slate-400 font-bold italic tracking-tight">Tu agenda está lista esperando reservas.</p>
                </div>
              ) : recentAppointments.map((appt) => (
                <div key={appt.id} className="p-6 md:p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-center gap-5">
                     <div className="relative">
                        <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-105">
                           {appt.customerName?.[0] || 'C'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                           <div className={`w-2 h-2 rounded-full ${appt.status === 'confirmed' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                        </div>
                     </div>
                     <div>
                        <p className="font-black text-slate-900 text-lg leading-tight mb-0.5">{appt.customerName}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{appt.serviceName || appt.service}</span>
                           <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                           <span className="text-[10px] font-bold text-slate-400">{appt.date}</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <div className="flex items-center gap-1.5 mb-1.5">
                        <Clock size={14} className="text-primary-500" />
                        <p className="font-black text-slate-900 text-xl tracking-tighter leading-none">{appt.time}</p>
                     </div>
                     <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                        appt.status === 'confirmed' 
                          ? 'text-green-600 bg-green-50 border-green-100' 
                          : 'text-amber-600 bg-amber-50 border-amber-100'
                     }`}>
                        {appt.status}
                     </span>
                  </div>
                </div>
              ))}
           </div>
           
           <div className="p-6 bg-slate-50/30 border-t border-slate-50">
              <button 
                onClick={() => navigate('/admin/appointments')}
                className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-all shadow-sm"
              >
                Explorar Agenda Completa
              </button>
           </div>
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
              <div className="relative z-10 h-full flex flex-col justify-between">
                 <div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                       <ExternalLink size={24} />
                    </div>
                    <h3 className="text-2xl font-black mb-3 leading-tight tracking-tight">Tu Portal Público<br/>está Online</h3>
                    <p className="text-indigo-100 text-sm mb-10 max-w-[200px] font-medium leading-relaxed">Comparte tu link único y permite que tus clientes reserven 24/7.</p>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-3">
                    <button className="bg-white text-indigo-600 font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] shadow-xl">
                       Copiar URL
                    </button>
                    <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                       Previsualizar
                    </button>
                 </div>
              </div>
              
              <div className="absolute right-[-10%] top-[-10%] opacity-[0.07] rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-all duration-1000 pointer-events-none">
                 <Zap size={300} strokeWidth={1} />
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="flex items-center gap-6 mb-6">
                 <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
                    <MessageSquare size={32} />
                 </div>
                 <div>
                    <h4 className="font-black text-slate-900 text-xl tracking-tight leading-none mb-1">WhatsApp Activo</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">IA Notifications v2.0</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">Estado del servicio</span>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-emerald-600 uppercase">Saludable</span>
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                 </div>
                 <p className="text-sm text-slate-500 font-medium leading-relaxed px-1">Se están enviando recordatorios automáticos 1 hora antes de cada turno.</p>
              </div>
              
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">Premium</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

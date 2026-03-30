import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  ChevronRight,
  ChevronLeft,
  Filter,
  MoreVertical,
  CalendarDays,
  MessageCircle,
  CalendarPlus,
  LayoutGrid,
  List
} from 'lucide-react';
import { dbService } from '../../services/db.service';

// --- Date Utilities ---
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  return new Date(d.setDate(diff));
};

const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date);
  return new Date(new Date(start).setDate(start.getDate() + 6));
};

const getStartOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getEndOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const formatDateToISO = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const getDaysArray = (start, end) => {
  const arr = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  return arr;
};

const AppointmentsPage = () => {
  const user = useSelector(state => state.auth.user);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled
  const [searchTerm, setSearchTerm] = useState('');
  
  // New States for Weekly/Monthly View
  const [viewType, setViewType] = useState('week'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Interactivity: Selected specific dates
  const [selectedDates, setSelectedDates] = useState([]); // array of 'YYYY-MM-DD' strings

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await dbService.getBusinessAppointments(user.businessId);
        // Sort by date and time
        const sorted = data.sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));
        setAppointments(sorted);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.businessId) fetchAppointments();
  }, [user?.businessId]);

  // Derived Values
  const range = useMemo(() => {
    if (viewType === 'week') {
      return { start: getStartOfWeek(currentDate), end: getEndOfWeek(currentDate) };
    } else {
      return { start: getStartOfMonth(currentDate), end: getEndOfMonth(currentDate) };
    }
  }, [viewType, currentDate]);

  const daysInRange = useMemo(() => getDaysArray(range.start, range.end), [range]);

  const filteredAppointments = useMemo(() => {
    const startISO = formatDateToISO(range.start);
    const endISO = formatDateToISO(range.end);

    return appointments.filter(app => {
      // 1. Date Range or Selected Dates filter
      const isWithinDateRange = app.date >= startISO && app.date <= endISO;
      const matchesSelectedDates = selectedDates.length === 0 || selectedDates.includes(app.date);

      if (!isWithinDateRange) return false;
      if (!matchesSelectedDates) return false;

      // 2. Status filter
      const matchesFilter = filter === 'all' || app.status === filter;
      
      // 3. Search filter
      const matchesSearch = app.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           app.service?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [appointments, range, filter, searchTerm, selectedDates]);

  // Occupancy Map
  const occupancyMap = useMemo(() => {
    const map = {};
    appointments.forEach(app => {
      if (app.status !== 'cancelled') {
         map[app.date] = (map[app.date] || 0) + 1;
      }
    });
    return map;
  }, [appointments]);

  const toggleDate = (isoDate) => {
    setSelectedDates(prev => 
      prev.includes(isoDate) ? prev.filter(d => d !== isoDate) : [...prev, isoDate]
    );
  };

  const sendWhatsAppReminder = (appt) => {
    const message = encodeURIComponent(`Hola ${appt.customerName}, te recordamos tu turno en ${user.businessName || 'nuestro negocio'} para ${appt.serviceName || appt.service} el día ${appt.date} a las ${appt.time} hs. ¡Te esperamos!`);
    window.open(`https://wa.me/${appt.customerPhone}?text=${message}`, '_blank');
  };

  const getGoogleCalendarUrl = (appt) => {
    const title = encodeURIComponent(`Turno: ${appt.serviceName || appt.service} - ${appt.customerName}`);
    const details = encodeURIComponent(`Cliente: ${appt.customerName}\nTel: ${appt.customerPhone}\nServicio: ${appt.serviceName || appt.service}`);
    
    const startDate = new Date(`${appt.date}T${appt.time}:00`);
    const endDate = new Date(startDate.getTime() + (appt.duration || 30) * 60000);
    
    const formatCalendarDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const dates = `${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}`;
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    setSelectedDates([]); // Clear selection when navigating
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setSelectedDates([]); // Clear selection when navigating
  };

  const handleViewChange = (type) => {
    setViewType(type);
    setSelectedDates([]); // Clear selection when changing view
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={12} /> Confirmado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
            <Clock size={12} /> Pendiente
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
            <XCircle size={12} /> Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-1">Gestión de Turnos</h1>
           <p className="text-slate-500 font-medium">Administra las reservas y el estado de tu agenda.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="relative group min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por cliente o servicio..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm w-full"
              />
           </div>
           
           <div className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pending', label: 'Pendientes' },
                { id: 'confirmed', label: 'Confirmados' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === btn.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* View Toggle and Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => handleViewChange('week')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewType === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <CalendarDays size={14} /> Semana
            </button>
            <button
              onClick={() => handleViewChange('month')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewType === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <LayoutGrid size={14} /> Mes
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-black text-slate-700 min-w-[120px] text-center capitalize">
              {viewType === 'week' 
                ? `Semana ${currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                : currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              }
            </span>
            <button 
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selectedDates.length > 0 && (
            <button 
              onClick={() => setSelectedDates([])}
              className="text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg uppercase tracking-wider hover:bg-primary-100 transition-colors"
            >
              Ver Todos
            </button>
          )}
          <div className="text-xs text-slate-400 font-bold uppercase tracking-tight italic">
            {filteredAppointments.length} turnos
          </div>
        </div>
      </div>

      {/* Occupancy Grid (Mini Calendar) */}
      <div className="grid grid-cols-7 md:grid-cols-7 lg:grid-cols-7 xl:grid-cols-14 gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {daysInRange.map((date, idx) => {
          const isoDate = formatDateToISO(date);
          const count = occupancyMap[isoDate] || 0;
          const isToday = isoDate === formatDateToISO(new Date());
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isSelected = selectedDates.includes(isoDate);

          return (
            <button 
              key={idx}
              onClick={() => toggleDate(isoDate)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all min-w-[70px] relative group overflow-hidden ${
                isSelected ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-200' :
                isToday ? 'bg-primary-50 border-primary-200' : 
                count > 0 ? 'bg-white border-slate-200 shadow-sm hover:border-primary-300' : 'bg-slate-50/50 border-slate-100 opacity-60'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-primary-100' : isWeekend ? 'text-slate-400' : 'text-slate-500'}`}>
                {date.toLocaleDateString('es-ES', { weekday: 'short' })}
              </span>
              <span className={`text-lg font-black ${isSelected ? 'text-white' : isToday ? 'text-primary-600' : 'text-slate-900'}`}>
                {date.getDate()}
              </span>
              
              <div className="mt-1 flex items-center justify-center">
                 {count > 0 ? (
                   <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                     isSelected ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
                   }`}>
                     {count}
                   </span>
                 ) : (
                   <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/30' : 'bg-slate-200'}`}></div>
                 )}
              </div>
              
              {isSelected && (
                <div className="absolute top-0 right-0 p-1">
                   <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Appointments Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[300px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5 text-center">Servicio</th>
                <th className="px-8 py-5">Fecha y Hora</th>
                <th className="px-8 py-5 text-center">Estado</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-5 h-20 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 grayscale opacity-40">
                       <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                          <Calendar size={40} className="text-slate-300" />
                       </div>
                       <p className="text-slate-500 font-black italic tracking-tight">
                         {selectedDates.length > 0 
                           ? "No hay turnos para los días seleccionados." 
                           : "No se encontraron turnos en este periodo."}
                       </p>
                       {selectedDates.length > 0 && (
                         <button onClick={() => setSelectedDates([])} className="text-primary-600 font-bold text-sm hover:underline">
                           Ver todos los días
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110">
                           {appt.customerName?.[0] || <User size={18} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight mb-0.5">{appt.customerName || 'Cliente Anónimo'}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                            <Phone size={12} /> {appt.customerPhone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-3 py-1.5 bg-slate-100 rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-tight">
                        {appt.serviceName || appt.service || 'Servicio'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-900 tracking-tight">{appt.date}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 font-bold">
                          <Clock size={12} className="text-primary-500" /> {appt.time} hs
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {getStatusBadge(appt.status)}
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => sendWhatsAppReminder(appt)}
                            className="w-10 h-10 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all flex items-center justify-center shadow-sm" 
                            title="Enviar Recordatorio WhatsApp"
                          >
                             <MessageCircle size={18} />
                          </button>
                          <a 
                            href={getGoogleCalendarUrl(appt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm" 
                            title="Agendar en mi Calendario"
                          >
                             <CalendarPlus size={18} />
                          </a>
                          {appt.status === 'pending' && (
                            <button className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="Confirmar">
                               <CheckCircle2 size={18} />
                            </button>
                          )}
                          <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center shadow-sm">
                             <MoreVertical size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;

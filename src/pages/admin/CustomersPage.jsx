import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, Search, Phone, Mail, Calendar, TrendingUp, X, Clock, Check, Loader2, CalendarPlus, ArrowUpRight, ChevronRight
} from 'lucide-react';
import { dbService } from '../../services/db.service';
import { isSlotOccupied, toLocalDateString } from '../../utils/time';
import { cn } from '../../utils/cn';

const CustomersPage = () => {
  const user = useSelector(state => state.auth.user);
  
  // List States
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Business Data for Appointment Creation
  const [businessData, setBusinessData] = useState(null);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'booking'
  
  // Customer Edit/Notes States
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Create Customer Form State
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', city: '' });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  // Booking States (Inside Modal)
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.businessId) return;
      try {
        const [customerData, bizData, apptsData] = await Promise.all([
          dbService.getBusinessCustomers(user.businessId),
          dbService.getBusinessById(user.businessId),
          dbService.getBusinessAppointments(user.businessId)
        ]);
        setCustomers(customerData);
        setBusinessData(bizData);
        setAppointments(apptsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.businessId]);

  // Enrich customers with REAL stats
  const enrichedCustomers = useMemo(() => {
    return customers.map(customer => {
      const customerAppts = appointments.filter(a => 
        (customer.phone && a.customerPhone === customer.phone) || 
        (customer.email && a.customerEmail === customer.email)
      );
      const sortedAppts = [...customerAppts].sort((a, b) => 
        new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time)
      );
      return {
        ...customer,
        totalAppointments: customerAppts.length,
        lastBooking: sortedAppts[0]?.date || 'Sin turnos previos'
      };
    });
  }, [customers, appointments]);

  // Update notes state when customer selection changes
  useEffect(() => {
    if (selectedCustomer) setCustomerNotes(selectedCustomer.notes || '');
  }, [selectedCustomer]);

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setIsSavingNotes(true);
    try {
      await dbService.updateCustomer(user.businessId, selectedCustomer.id, { notes: customerNotes });
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, notes: customerNotes } : c));
      alert('¡Notas guardadas!');
    } catch (error) {
      alert('Error al guardar.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    setIsCreatingCustomer(true);
    let cleanedPhone = newCustomer.phone.replace(/\D/g, '');
    if (!cleanedPhone.startsWith('549')) cleanedPhone = '549' + cleanedPhone;
    try {
      const added = await dbService.createCustomer(user.businessId, { ...newCustomer, phone: cleanedPhone });
      setCustomers(prev => [added, ...prev]);
      setShowCreateModal(false);
      setNewCustomer({ name: '', phone: '', email: '', city: '' });
      alert('¡Cliente creado!');
    } catch (error) {
      alert('Error al crear.');
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Generate Slots logic (Updated to check overlaps)
  useEffect(() => {
    const updateSlots = async () => {
      if (selectedDates.length > 0 && selectedService && businessData?.schedule) {
        // Para simplificar, generamos slots basados en el PRIMER día seleccionado
        // pero verificamos contra las citas de ese día específico.
        try {
          const appts = await dbService.getAppointmentsByDate(user.businessId, selectedDates[0]);
          generateSlots(selectedDates[0], appts);
        } catch (error) {
          console.error("Error fetching appts for slots:", error);
        }
      }
    };
    updateSlots();
  }, [selectedDates, selectedService, businessData, user.businessId]);

  const generateSlots = (dateString, appts = []) => {
    const date = new Date(dateString + 'T12:00:00');
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = dayNames[date.getDay()];
    
    const defaultSchedule = {
      mon: { active: true, start: '09:00', end: '18:00' },
      tue: { active: true, start: '09:00', end: '18:00' },
      wed: { active: true, start: '09:00', end: '18:00' },
      thu: { active: true, start: '09:00', end: '18:00' },
      fri: { active: true, start: '09:00', end: '18:00' },
      sat: { active: false, start: '09:00', end: '13:00' },
      sun: { active: false, start: '09:00', end: '12:00' }
    };

    const schedule = businessData?.schedule || defaultSchedule;
    const dayConfig = schedule[dayKey];

    if (!dayConfig || !dayConfig.active) {
      setAvailableSlots([]);
      return;
    }
    const slots = [];
    let current = dayConfig.start;
    const duration = selectedService.duration || 30;
    while (current < dayConfig.end) {
      const isOccupied = isSlotOccupied(current, duration, appts, 0);
      if (!isOccupied) {
        slots.push(current);
      }
      const [h, m] = current.split(':').map(Number);
      const interval = businessData?.interval || 30; // Usar intervalo de empresa o 30
      const mins = h * 60 + m + interval; 
      current = `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
      if (current >= dayConfig.end) break;
    }
    setAvailableSlots(slots);
  };

  const handleBulkCreateAppointments = async () => {
    if (!selectedService || selectedDates.length === 0 || !selectedTime) return;
    setIsCreating(true);
    let successCount = 0;
    let skippedDates = [];

    try {
      const newAppts = [];
      for (const date of selectedDates) {
        // Verificar ocupación real justo antes de crear (para cada día del lote)
        const dayAppts = await dbService.getAppointmentsByDate(user.businessId, date);
        if (isSlotOccupied(selectedTime, selectedService.duration, dayAppts, 0)) {
          skippedDates.push(date);
          continue;
        }

        const appt = await dbService.createAppointment({
          businessId: user.businessId, businessName: businessData.name,
          serviceId: selectedService.id, serviceName: selectedService.name,
          duration: selectedService.duration, customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email || '', customerPhone: selectedCustomer.phone,
          date, time: selectedTime, status: 'confirmed'
        });
        newAppts.push(appt);
        successCount++;
      }
      
      setAppointments(prev => [...prev, ...newAppts]);
      setShowModal(false);
      
      if (skippedDates.length > 0) {
        alert(`¡Completado! Se agendaron ${successCount} turnos. ${skippedDates.length} fecha(s) fueron saltadas por estar ya ocupadas: ${skippedDates.join(', ')}`);
      } else {
        alert(`¡${successCount} turnos agendados con éxito!`);
      }
    } catch (err) {
      alert("Error al agendar algunos turnos.");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleDateSelection = (dateString) => {
    setSelectedDates(prev => prev.includes(dateString) ? prev.filter(d => d !== dateString) : [...prev, dateString].sort());
  };

  const openModal = (customer, tab = 'details') => {
    const enriched = enrichedCustomers.find(c => c.id === customer.id) || customer;
    setSelectedCustomer(enriched);
    setModalTab(tab);
    setShowModal(true);
    setSelectedService(null);
    setSelectedDates([]);
    setSelectedTime('');
  };

  const filteredCustomers = enrichedCustomers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-1">Gestión de Clientes</h1>
           <p className="text-slate-500 font-medium">Administra tu base de datos y agenda turnos para ellos.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Buscar..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm w-full md:w-64 font-medium"
              />
           </div>
           <button 
             onClick={() => setShowCreateModal(true)}
             className="bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2"
           >
              <Users size={18} /> <span className="hidden sm:inline">Nuevo Cliente</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Users size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-2">Total Clientes</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{customers.length}</h4>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-2">Recurrencia</p>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">64%</h4>
         </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Contacto</th>
                <th className="px-8 py-5">Última Reserva</th>
                <th className="px-8 py-5 text-center">Fidelidad</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan="5" className="px-8 py-5 h-20 bg-slate-50/20 animate-pulse"></td></tr>
              )) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-32 text-center text-slate-500 font-black italic">No hay clientes registrados aún.</td></tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">{customer.name?.[0] || 'C'}</div>
                      <div>
                        <p onClick={() => openModal(customer)} className="font-black text-slate-900 leading-tight mb-0.5 cursor-pointer hover:text-primary-600">{customer.name || 'Sin nombre'}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{customer.city || 'S/D'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-slate-700 flex items-center gap-1.5"><Phone size={12} className="text-primary-500" /> {customer.phone}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium"><Mail size={12} /> {customer.email || 'Sin email'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5"><span className="text-sm font-bold text-slate-700">{customer.lastBooking}</span></td>
                  <td className="px-8 py-5 text-center text-[10px] font-black text-slate-900">{customer.totalAppointments} turnos</td>
                  <td className="px-8 py-5 text-right">
                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => openModal(customer, 'booking')} className="bg-primary-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-primary-700 shadow-lg shadow-primary-200"><CalendarPlus size={20} /></button>
                        <button onClick={() => openModal(customer)} className="bg-white text-slate-400 border border-slate-200 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm"><ArrowUpRight size={20} /></button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-8 pb-4 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl">{selectedCustomer.name?.[0] || 'C'}</div>
                    <div><h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">{selectedCustomer.name}</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ficha de Cliente</p></div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"><X size={20} /></button>
              </div>

              <div className="px-8 flex gap-6 border-b border-slate-100">
                 <button onClick={() => setModalTab('details')} className={cn("pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all", modalTab === 'details' ? "border-primary-600 text-primary-600" : "border-transparent text-slate-400")}>Información</button>
                 <button onClick={() => setModalTab('booking')} className={cn("pb-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all", modalTab === 'booking' ? "border-primary-600 text-primary-600" : "border-transparent text-slate-400")}>Nuevo Turno Admin</button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {modalTab === 'details' ? (
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</p><div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100"><Phone size={16} className="text-emerald-500" /><span className="font-bold text-slate-900">{selectedCustomer.phone}</span></div></div>
                        <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p><div className="flex items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100"><Mail size={16} className="text-primary-500" /><span className="font-bold text-slate-900 truncate">{selectedCustomer.email || 'No registrado'}</span></div></div>
                      </div>
                      <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                         <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14} /> Resumen de Actividad</h4>
                         <div className="grid grid-cols-3 gap-4">
                            <div className="text-center"><p className="text-2xl font-black text-slate-900">{selectedCustomer.totalAppointments}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Turnos</p></div>
                            <div className="text-center"><p className="text-2xl font-black text-slate-900">0</p><p className="text-[9px] font-bold text-slate-400 uppercase">Faltas</p></div>
                            <div className="text-center"><p className="text-lg font-black text-slate-900">{selectedCustomer.lastBooking !== 'Sin turnos previos' ? `${selectedCustomer.lastBooking.split('-')[2]}/${selectedCustomer.lastBooking.split('-')[1]}` : '--/--'}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Última Vez</p></div>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between ml-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notas y Preferencias</label>{isSavingNotes && <Loader2 size={14} className="animate-spin text-primary-500" />}</div>
                         <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm text-slate-700 font-medium h-32 resize-none outline-none" placeholder="Añade detalles sobre este cliente..." />
                         <button onClick={handleSaveNotes} disabled={isSavingNotes || customerNotes === (selectedCustomer.notes || '')} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30">Guardar Notas</button>
                      </div>
                    </div>
                 ) : (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">1. Elije el Servicio</label>
                         <div className="grid grid-cols-2 gap-3">
                            {businessData?.services?.map(service => (
                               <button key={service.id} onClick={() => setSelectedService(service)} className={cn("p-4 rounded-3xl border-2 transition-all text-left", selectedService?.id === service.id ? "border-primary-500 bg-primary-50/50 shadow-md" : "border-slate-100 bg-slate-50/50")}>
                                  <div className="flex items-center justify-between mb-1"><span className={cn("text-sm font-black", selectedService?.id === service.id ? "text-primary-700" : "text-slate-700")}>{service.name}</span>{selectedService?.id === service.id && <Check size={16} className="text-primary-500" />}</div>
                                  <div className="flex items-center gap-1.5 opacity-60"><Clock size={12} /><span className="text-[10px] font-bold uppercase">{service.duration} min</span></div>
                               </button>
                            ))}
                         </div>
                      </div>
                      {selectedService && (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">2. Selecciona los Días</label>
                           <div className="bg-slate-50/80 border border-slate-100 rounded-[2rem] p-6">
                              <div className="flex items-center justify-between mb-4">
                                 <h4 className="text-sm font-black text-slate-800 capitalize">{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h4>
                                 <div className="flex gap-1">
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1.5 hover:bg-white rounded-full"><ChevronRight size={16} className="rotate-180" /></button>
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1.5 hover:bg-white rounded-full"><ChevronRight size={16} /></button>
                                 </div>
                              </div>
                              <div className="grid grid-cols-7 gap-1 text-center mb-2">{['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => <span key={d} className="text-[10px] font-black text-slate-400">{d}</span>)}</div>
                              <div className="grid grid-cols-7 gap-1">
                                 {Array.from({ length: 42 }).map((_, i) => {
                                    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                                    const day = i - firstDayOfMonth + 1;
                                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                    if (date.getMonth() !== currentMonth.getMonth()) return <div key={i} />;
                                    const dateString = toLocalDateString(date);
                                    const isSelected = selectedDates.includes(dateString);
                                    const isPast = date < new Date(new Date().setHours(0,0,0,0));
                                    return (
                                      <button key={i} type="button" disabled={isPast} onClick={() => toggleDateSelection(dateString)} className={cn("aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all", isSelected ? "bg-primary-600 text-white shadow-md scale-110 z-10" : "hover:bg-white text-slate-700", isPast && "opacity-20 cursor-not-allowed")}>{day}</button>
                                    );
                                 })}
                              </div>
                           </div>
                           {selectedDates.length > 0 && (
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">3. Horario Fijo</label>
                                <div className="grid grid-cols-4 gap-2">
                                   {availableSlots.map(slot => (
                                     <button key={slot} onClick={() => setSelectedTime(slot)} className={cn("py-3 rounded-xl border-2 font-bold text-xs transition-all", selectedTime === slot ? "border-primary-500 bg-primary-50 text-primary-700" : "border-slate-100 bg-slate-50 text-slate-600")}>{slot}</button>
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                      )}
                      <div className={cn("p-6 rounded-[2rem] border transition-all duration-500", selectedDates.length > 0 && selectedTime ? "bg-slate-900 border-slate-900 shadow-xl" : "bg-slate-50 border-slate-100 opacity-50")}>
                         <div className="flex items-center justify-between mb-6 text-white text-right">
                            <div className="text-left"><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Confirmación de Lote</p><h4 className="text-xl font-black">{selectedDates.length} {selectedDates.length === 1 ? 'Turno' : 'Turnos'}</h4></div>
                            <div><p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Horario</p><p className="text-lg font-black">{selectedTime || '--:--'}</p></div>
                         </div>
                         <button onClick={handleBulkCreateAppointments} disabled={!selectedTime || selectedDates.length === 0 || isCreating} className="w-full py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-500 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-3">{isCreating ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} /> Agendar {selectedDates.length > 1 ? 'Turnos' : 'Turno'}</>}</button>
                      </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-8 pb-4 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center"><Users size={24} /></div>
                    <div><h2 className="text-xl font-black text-slate-900 leading-tight">Nuevo Cliente</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Añadir a la base de datos</p></div>
                 </div>
                 <button onClick={() => setShowCreateModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateCustomer} className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo *</label><input type="text" required value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Juan Pérez" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp *</label><input type="tel" required value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="+54 9..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" /></div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label><input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="email@ejemplo.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" /></div>
                       <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación</label><input type="text" value={newCustomer.city} onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})} placeholder="Ciudad" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" /></div>
                    </div>
                 </div>
                 <button type="submit" disabled={isCreatingCustomer} className="w-full bg-slate-900 text-white py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50">{isCreatingCustomer ? <Loader2 className="animate-spin" /> : 'Crear Registro de Cliente'}</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

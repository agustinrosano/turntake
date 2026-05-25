import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  MessageCircle,
  Briefcase,
  Users
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { dbService } from '../../services/db.service';
import { setActiveBusiness, setLoading, setError } from '../../features/business/businessSlice';
import { useNotify } from '../../components/ui/NotificationProvider';

const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const toMinutes = (time = '00:00') => {
  const [h = 0, m = 0] = String(time).split(':').map(Number);
  return h * 60 + m;
};

const toTime = (minutes) => {
  const safe = Math.max(0, minutes);
  const h = String(Math.floor(safe / 60)).padStart(2, '0');
  const m = String(safe % 60).padStart(2, '0');
  return `${h}:${m}`;
};

const overlaps = (startA, endA, startB, endB) => startA < endB && startB < endA;

const BookingPage = () => {
  const { businessSlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const notify = useNotify();
  const { activeBusiness, loading, error } = useSelector((state) => state.business);

  const [step, setStep] = useState(0); // 0: Service, 1: Teacher/Date/Time, 2: Details, 3: Success
  const [selectedService, setSelectedService] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const teachers = activeBusiness?.teachers || [];
  const hasTeachers = teachers.length > 0;

  const availableTeachers = useMemo(() => {
    if (!hasTeachers || !selectedService) return [];
    return teachers.filter((teacher) => (teacher.serviceIds || []).includes(selectedService.id));
  }, [hasTeachers, selectedService, teachers]);

  const selectedTeacher = useMemo(
    () => availableTeachers.find((teacher) => teacher.id === selectedTeacherId) || null,
    [availableTeachers, selectedTeacherId]
  );

  useEffect(() => {
    const fetchBusiness = async () => {
      dispatch(setLoading(true));
      try {
        const business = await dbService.getBusinessBySlug(businessSlug);
        if (business) {
          dispatch(setActiveBusiness(business));
        } else {
          dispatch(setError('El negocio solicitado no existe.'));
        }
      } catch (err) {
        dispatch(setError('Hubo un error al cargar la pagina.'));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchBusiness();
  }, [businessSlug, dispatch]);

  useEffect(() => {
    if (!hasTeachers || !selectedService) {
      setSelectedTeacherId(null);
      return;
    }

    const stillExists = availableTeachers.some((teacher) => teacher.id === selectedTeacherId);
    if (!stillExists) {
      setSelectedTeacherId(availableTeachers[0]?.id || null);
    }
  }, [hasTeachers, selectedService, availableTeachers, selectedTeacherId]);

  useEffect(() => {
    if (!selectedDate || !activeBusiness?.id) {
      setDayAppointments([]);
      return;
    }

    let cancelled = false;

    const fetchAppointmentsByDate = async () => {
      try {
        const data = await dbService.getAppointmentsByDate(activeBusiness.id, selectedDate);
        if (!cancelled) {
          setDayAppointments(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setDayAppointments([]);
        }
      }
    };

    fetchAppointmentsByDate();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, activeBusiness?.id]);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate, selectedService, selectedTeacherId]);

  useEffect(() => {
    if (!selectedDate || !selectedService || !activeBusiness?.schedule) {
      setAvailableSlots([]);
      return;
    }

    const date = new Date(`${selectedDate}T12:00:00`);
    const dayKey = dayNames[date.getDay()];
    const businessDay = activeBusiness.schedule[dayKey];

    if (!businessDay?.active) {
      setAvailableSlots([]);
      return;
    }

    let startMinutes = toMinutes(businessDay.start);
    let endMinutes = toMinutes(businessDay.end);

    if (hasTeachers) {
      if (!selectedTeacher) {
        setAvailableSlots([]);
        return;
      }

      const teacherDay = selectedTeacher.schedule?.[dayKey];
      if (!teacherDay?.active) {
        setAvailableSlots([]);
        return;
      }

      startMinutes = Math.max(startMinutes, toMinutes(teacherDay.start));
      endMinutes = Math.min(endMinutes, toMinutes(teacherDay.end));
    }

    const duration = Number(selectedService.duration || 30);
    if (endMinutes <= startMinutes || duration <= 0) {
      setAvailableSlots([]);
      return;
    }

    const relevantAppointments = (dayAppointments || []).filter((appt) => {
      if (appt.status === 'cancelled') return false;
      if (!hasTeachers) return true;
      return appt.teacherId === selectedTeacher?.id || !appt.teacherId;
    });

    const freeSlots = [];
    for (let slotStart = startMinutes; slotStart + duration <= endMinutes; slotStart += duration) {
      const slotEnd = slotStart + duration;
      const isTaken = relevantAppointments.some((appt) => {
        const apptStart = toMinutes(appt.time || '00:00');
        const apptDuration = Number(appt.duration || 30);
        const apptEnd = apptStart + apptDuration;
        return overlaps(slotStart, slotEnd, apptStart, apptEnd);
      });

      if (!isTaken) {
        freeSlots.push(toTime(slotStart));
      }
    }

    setAvailableSlots(freeSlots);
  }, [selectedDate, selectedService, selectedTeacher, activeBusiness, dayAppointments, hasTeachers]);

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingLoading(true);

    let cleanedPhone = formData.phone.replace(/\D/g, '');
    if (!cleanedPhone.startsWith('549')) {
      cleanedPhone = `549${cleanedPhone}`;
    }

    try {
      await dbService.createAppointment({
        businessId: activeBusiness.id,
        businessName: activeBusiness.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        teacherId: selectedTeacher?.id || null,
        teacherName: selectedTeacher?.name || null,
        duration: selectedService.duration,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: cleanedPhone,
        date: selectedDate,
        time: selectedTime,
        status: 'pending'
      });
      setStep(3);
    } catch (err) {
      console.error('Error in handleBooking:', err);
      
      await dbService.logError({
        zone: 'Portal - BookingPage',
        fnName: 'handleBooking',
        error: err,
        userId: null,
        userEmail: formData.email,
        businessId: activeBusiness?.id || null,
        metadata: {
          serviceId: selectedService?.id,
          date: selectedDate,
          time: selectedTime
        }
      });

      notify.error('Error al confirmar la reserva. Intentalo de nuevo.', { title: 'Error' });
    } finally {
      setBookingLoading(false);
    }
  };

  const getGoogleCalendarUrl = () => {
    if (!selectedService || !selectedDate || !selectedTime) return '';

    const title = encodeURIComponent(`Turno: ${selectedService.name} - ${activeBusiness.name}`);
    const details = encodeURIComponent(
      `Reserva para ${selectedService.name} en ${activeBusiness.name}.\nProfesor: ${selectedTeacher?.name || 'Sin asignar'}`
    );

    const startDate = new Date(`${selectedDate}T${selectedTime}:00`);
    const endDate = new Date(startDate.getTime() + (selectedService.duration || 30) * 60000);
    const formatCalendarDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const dates = `${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}`;

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
  };

  const getNextDays = () => {
    const days = [];
    const names = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    for (let i = 0; i < 14; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        name: names[d.getDay()],
        label: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        value: dateStr
      });
    }
    return days;
  };

  if (loading || !activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">Cargando agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 px-8 bg-white rounded-3xl border border-red-100 shadow-xl">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Vaya</h2>
        <p className="text-slate-500 mb-8">{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary py-3 px-8">Volver al inicio</button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Check size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4">Reserva Exitosa</h2>
        <p className="text-slate-600 text-lg mb-8">Gracias por elegir {activeBusiness?.name}.</p>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <Briefcase className="text-primary-500" size={20} />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Servicio</p>
              <p className="font-bold text-slate-900">{selectedService?.name} ({selectedService?.duration} min)</p>
            </div>
          </div>
          {hasTeachers && (
            <div className="flex items-center gap-3">
              <Users className="text-primary-500" size={20} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Profesor</p>
                <p className="font-bold text-slate-900">{selectedTeacher?.name || 'Sin asignar'}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-primary-500" size={20} />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Dia y Hora</p>
              <p className="font-bold text-slate-900">{selectedDate} - {selectedTime} hs</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <CalendarIcon size={20} className="text-primary-500" />
            Agendar en mi Google Calendar
          </a>
          <button
            disabled
            className="flex items-center justify-center gap-3 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-bold opacity-50 cursor-not-allowed"
          >
            <MessageCircle size={20} />
            Notificacion confirmada
          </button>
        </div>

        <button onClick={() => window.location.reload()} className="w-full btn-primary py-4 text-lg">Hacer otra reserva</button>
      </div>
    );
  }

  const days = getNextDays();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-slate-900 mb-2">{activeBusiness?.name}</h1>
        <p className="text-slate-500 font-medium">{activeBusiness?.description}</p>
      </div>

      {step === 0 ? (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 text-center">Que servicio necesitas hoy?</h3>
          <div className="grid grid-cols-1 gap-4">
            {(activeBusiness.services || []).map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setStep(1);
                }}
                className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-primary-500 hover:shadow-xl hover:shadow-primary-100 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">{service.name}</h4>
                    <p className="text-sm text-slate-500">{service.description || 'Sin descripcion'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="bg-slate-100 px-3 py-1.5 rounded-full text-xs font-black text-slate-600 uppercase tracking-tighter">
                    {service.duration} min
                  </span>
                  <ChevronRight size={20} className="text-slate-300 mt-2 ml-auto" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : step === 1 ? (
        <div className="space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setStep(0)} className="text-primary-600 font-bold text-sm hover:underline">Cambiar servicio</button>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-sm font-bold">{selectedService?.name}</span>
          </div>

          {hasTeachers && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                <Users size={14} /> Selecciona profesor
              </h3>

              {availableTeachers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                  <AlertCircle size={32} className="mb-2 text-amber-500" />
                  <p className="text-sm font-bold text-slate-900">No hay profesores para este servicio</p>
                  <p className="text-xs text-slate-500">Prueba otro servicio o asigna profesores desde el panel admin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableTeachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => setSelectedTeacherId(teacher.id)}
                      className={cn(
                        'py-3 px-4 rounded-xl border text-sm font-bold transition-all text-left',
                        selectedTeacherId === teacher.id
                          ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-900 hover:border-primary-400 hover:bg-primary-50'
                      )}
                    >
                      {teacher.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
              <CalendarIcon size={14} /> Selecciona el dia
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {days.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDate(day.value)}
                  className={cn(
                    'flex-1 min-w-[75px] flex flex-col items-center p-4 rounded-2xl border transition-all duration-300',
                    selectedDate === day.value
                      ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 scale-105'
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-primary-200'
                  )}
                >
                  <span className="text-[10px] uppercase font-bold opacity-70 mb-1">{day.name}</span>
                  <span className="text-sm font-black whitespace-nowrap">{day.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm min-h-[200px]">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
              <Clock size={14} /> Horarios disponibles para {selectedService?.duration} min
            </h3>

            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center text-center py-10 opacity-30">
                <CalendarIcon size={40} className="mb-2" />
                <p className="text-sm font-bold">Selecciona un dia primero</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10">
                <AlertCircle size={40} className="mb-2 text-amber-500" />
                <p className="text-sm font-bold text-slate-900">
                  {hasTeachers && !selectedTeacher ? 'Selecciona un profesor para ver horarios' : 'Sin disponibilidad este dia'}
                </p>
                <p className="text-xs text-slate-500">Prueba con otra fecha</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      'py-3 rounded-xl border text-sm font-bold transition-all duration-200',
                      selectedTime === time
                        ? 'bg-primary-600 border-primary-600 text-white shadow-md scale-105'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-primary-400 hover:bg-primary-50'
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={!selectedDate || !selectedTime || (hasTeachers && !selectedTeacher) || (hasTeachers && availableTeachers.length === 0)}
            onClick={() => setStep(2)}
            className={cn(
              'w-full py-4.5 rounded-2xl text-lg font-bold transition-all shadow-xl flex items-center justify-center gap-2',
              selectedDate && selectedTime && (!hasTeachers || !!selectedTeacher) && (!hasTeachers || availableTeachers.length > 0)
                ? 'btn-primary shadow-primary-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
            )}
          >
            Continuar
            <ChevronRight size={20} />
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl animate-in slide-in-from-right-8 duration-300">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronRight className="rotate-180" size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-900">Completa tu reserva</h2>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl mb-8 space-y-3 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="text-primary-500" size={18} />
                <p className="text-sm font-bold text-slate-900">{selectedService?.name}</p>
              </div>
              <span className="text-xs font-black bg-white px-2 py-1 rounded-lg border border-slate-200">{selectedService?.duration} min</span>
            </div>
            {hasTeachers && (
              <div className="flex items-center gap-3">
                <Users className="text-primary-500" size={18} />
                <p className="text-sm font-bold text-slate-900">Profesor: {selectedTeacher?.name || 'Sin asignar'}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <CalendarIcon className="text-primary-500" size={18} />
              <p className="text-sm font-bold text-slate-900">{selectedDate} a las {selectedTime} hs</p>
            </div>
          </div>

          <form onSubmit={handleBooking} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700 ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium"
                  placeholder="Juan Perez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium"
                    placeholder="+54 9..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium"
                    placeholder="juan@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={bookingLoading}
              className="w-full btn-primary py-4 text-lg mt-4 shadow-lg shadow-primary-200 flex items-center justify-center gap-2 group disabled:bg-slate-400"
            >
              {bookingLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Confirmar Reserva
                  <Check size={20} className="group-hover:scale-125 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookingPage;

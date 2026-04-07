import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Save,
  Clock,
  Calendar,
  Link as LinkIcon,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Info,
  Users
} from 'lucide-react';
import { dbService } from '../../services/db.service';
import { setActiveBusiness } from '../../features/business/businessSlice';

const DAYS_OF_WEEK = [
  { id: 'mon', name: 'Lunes' },
  { id: 'tue', name: 'Martes' },
  { id: 'wed', name: 'Miercoles' },
  { id: 'thu', name: 'Jueves' },
  { id: 'fri', name: 'Viernes' },
  { id: 'sat', name: 'Sabado' },
  { id: 'sun', name: 'Domingo' }
];

const INTERVAL_OPTIONS = [
  { value: 15, label: '15 Minutos' },
  { value: 30, label: '30 Minutos' },
  { value: 45, label: '45 Minutos' },
  { value: 60, label: '1 Hora' },
  { value: 90, label: '1.5 Horas' },
  { value: 120, label: '2 Horas' }
];

const createDefaultSchedule = () => ({
  mon: { active: true, start: '09:00', end: '18:00' },
  tue: { active: true, start: '09:00', end: '18:00' },
  wed: { active: true, start: '09:00', end: '18:00' },
  thu: { active: true, start: '09:00', end: '18:00' },
  fri: { active: true, start: '09:00', end: '18:00' },
  sat: { active: false, start: '09:00', end: '13:00' },
  sun: { active: false, start: '09:00', end: '12:00' }
});

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

const normalizeTeacherSchedule = (teacherSchedule = {}, businessSchedule = {}) => {
  const normalized = {};

  DAYS_OF_WEEK.forEach(({ id }) => {
    const businessDay = businessSchedule[id];
    const teacherDay = teacherSchedule[id] || { active: false, start: '09:00', end: '18:00' };

    if (!businessDay?.active || !teacherDay?.active) {
      normalized[id] = {
        active: false,
        start: teacherDay.start || businessDay?.start || '09:00',
        end: teacherDay.end || businessDay?.end || '18:00'
      };
      return;
    }

    const start = Math.max(toMinutes(teacherDay.start), toMinutes(businessDay.start));
    const end = Math.min(toMinutes(teacherDay.end), toMinutes(businessDay.end));

    if (end <= start) {
      normalized[id] = {
        active: false,
        start: toTime(start),
        end: toTime(end)
      };
      return;
    }

    normalized[id] = {
      active: true,
      start: toTime(start),
      end: toTime(end)
    };
  });

  return normalized;
};

const BusinessSettingsPage = () => {
  const user = useSelector((state) => state.auth.user);
  const activeBusiness = useSelector((state) => state.business.activeBusiness);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    address: '',
    phone: '',
    interval: 30,
    schedule: createDefaultSchedule(),
    services: [],
    teachers: []
  });

  useEffect(() => {
    if (activeBusiness) {
      setFormData((prev) => ({
        ...prev,
        ...activeBusiness,
        schedule: activeBusiness.schedule || prev.schedule,
        services: activeBusiness.services || [],
        teachers: (activeBusiness.teachers || []).map((teacher) => ({
          ...teacher,
          serviceIds: teacher.serviceIds || [],
          schedule: teacher.schedule || createDefaultSchedule()
        }))
      }));
    }
  }, [activeBusiness]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const businessId = user?.businessId;
      if (!businessId) {
        throw new Error('No se encontro un negocio vinculado a tu cuenta.');
      }

      const sanitizedTeachers = (formData.teachers || []).map((teacher) => ({
        ...teacher,
        name: teacher.name?.trim() || 'Profesor',
        serviceIds: (teacher.serviceIds || []).filter(Boolean),
        schedule: normalizeTeacherSchedule(teacher.schedule, formData.schedule)
      }));

      const payload = {
        ...formData,
        teachers: sanitizedTeachers
      };

      await dbService.updateBusinessProfile(businessId, payload);
      dispatch(setActiveBusiness({ id: businessId, ...payload }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('No se pudo guardar la configuracion. Verifica tu conexion.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayId]: {
          ...prev.schedule[dayId],
          active: !prev.schedule[dayId].active
        }
      }
    }));
  };

  const updateDayTime = (dayId, type, value) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [dayId]: {
          ...prev.schedule[dayId],
          [type]: value
        }
      }
    }));
  };

  const addTeacher = () => {
    const newTeacher = {
      id: `tch_${Date.now()}`,
      name: 'Nuevo profesor',
      serviceIds: [],
      schedule: createDefaultSchedule()
    };

    setFormData((prev) => ({
      ...prev,
      teachers: [...(prev.teachers || []), newTeacher]
    }));
  };

  const removeTeacher = (teacherId) => {
    setFormData((prev) => ({
      ...prev,
      teachers: (prev.teachers || []).filter((teacher) => teacher.id !== teacherId)
    }));
  };

  const updateTeacher = (teacherId, patch) => {
    setFormData((prev) => ({
      ...prev,
      teachers: (prev.teachers || []).map((teacher) =>
        teacher.id === teacherId ? { ...teacher, ...patch } : teacher
      )
    }));
  };

  const toggleTeacherService = (teacherId, serviceId) => {
    const teacher = (formData.teachers || []).find((t) => t.id === teacherId);
    if (!teacher) return;

    const exists = (teacher.serviceIds || []).includes(serviceId);
    const nextServiceIds = exists
      ? teacher.serviceIds.filter((id) => id !== serviceId)
      : [...(teacher.serviceIds || []), serviceId];

    updateTeacher(teacherId, { serviceIds: nextServiceIds });
  };

  const toggleTeacherDay = (teacherId, dayId) => {
    const teacher = (formData.teachers || []).find((t) => t.id === teacherId);
    if (!teacher) return;

    updateTeacher(teacherId, {
      schedule: {
        ...teacher.schedule,
        [dayId]: {
          ...teacher.schedule[dayId],
          active: !teacher.schedule[dayId]?.active
        }
      }
    });
  };

  const updateTeacherDayTime = (teacherId, dayId, type, value) => {
    const teacher = (formData.teachers || []).find((t) => t.id === teacherId);
    if (!teacher) return;

    updateTeacher(teacherId, {
      schedule: {
        ...teacher.schedule,
        [dayId]: {
          ...teacher.schedule[dayId],
          [type]: value
        }
      }
    });
  };

  return (
    <div className="w-full max-w-none space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuracion del Negocio</h1>
          <p className="text-slate-500">Gestiona tu perfil publico y horarios de atencion.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary py-3 px-8 flex items-center gap-2 shadow-lg shadow-primary-200 disabled:bg-slate-400"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-3 text-green-700 animate-in slide-in-from-top-2">
          <CheckCircle2 size={22} className="text-green-500" />
          <span className="font-medium text-sm">Cambios guardados correctamente. Tu perfil publico ya esta actualizado.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle size={22} className="text-red-500" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Info className="text-primary-500" size={20} />
              Perfil Publico
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Negocio</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="Ej: Taketurn Studio"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descripcion Corta</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all h-24 resize-none"
                  placeholder="Una breve descripcion de lo que ofreces..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <LinkIcon size={14} /> Slug Publico URL
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-400 text-xs font-mono">
                      taketurn.com/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all font-mono text-sm"
                      placeholder="mi-negocio"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Smartphone size={14} /> WhatsApp de Contacto
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="+54 9..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-primary-500" size={20} />
                Servicios / Clases
              </h3>
              <button
                onClick={() => {
                  const newService = {
                    id: `srv_${Date.now()}`,
                    name: 'Nuevo Servicio',
                    duration: 30,
                    description: ''
                  };
                  setFormData((prev) => ({
                    ...prev,
                    services: [...(prev.services || []), newService]
                  }));
                }}
                className="text-primary-600 text-sm font-bold hover:bg-primary-50 py-2 px-4 rounded-xl transition-all"
              >
                + Anadir Servicio
              </button>
            </div>

            <div className="space-y-4">
              {(formData.services || []).map((service, index) => (
                <div key={service.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 group relative">
                  <button
                    onClick={() => {
                      const nextServices = (formData.services || []).filter((s) => s.id !== service.id);
                      const nextTeachers = (formData.teachers || []).map((teacher) => ({
                        ...teacher,
                        serviceIds: (teacher.serviceIds || []).filter((id) => id !== service.id)
                      }));
                      setFormData((prev) => ({ ...prev, services: nextServices, teachers: nextTeachers }));
                    }}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <AlertCircle size={18} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Servicio</label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => {
                          const updatedServices = [...(formData.services || [])];
                          updatedServices[index] = { ...service, name: e.target.value };
                          setFormData((prev) => ({ ...prev, services: updatedServices }));
                        }}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Duracion (minutos)</label>
                      <select
                        value={service.duration}
                        onChange={(e) => {
                          const updatedServices = [...(formData.services || [])];
                          updatedServices[index] = { ...service, duration: parseInt(e.target.value, 10) };
                          setFormData((prev) => ({ ...prev, services: updatedServices }));
                        }}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      >
                        {[15, 20, 30, 45, 60, 90, 120].map((d) => (
                          <option key={d} value={d}>{d} minutos</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Breve descripcion..."
                    value={service.description}
                    onChange={(e) => {
                      const updatedServices = [...(formData.services || [])];
                      updatedServices[index] = { ...service, description: e.target.value };
                      setFormData((prev) => ({ ...prev, services: updatedServices }));
                    }}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="text-primary-500" size={20} />
                Profesores
              </h3>
              <button
                onClick={addTeacher}
                className="text-primary-600 text-sm font-bold hover:bg-primary-50 py-2 px-4 rounded-xl transition-all"
              >
                + Anadir Profesor
              </button>
            </div>

            <div className="space-y-5">
              {(formData.teachers || []).length === 0 ? (
                <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  Si no agregas profesores, la agenda funciona en modo general (un solo cupo por horario).
                </p>
              ) : (
                (formData.teachers || []).map((teacher) => (
                  <div key={teacher.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <input
                        type="text"
                        value={teacher.name || ''}
                        onChange={(e) => updateTeacher(teacher.id, { name: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="Nombre del profesor"
                      />
                      <button
                        onClick={() => removeTeacher(teacher.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        title="Eliminar profesor"
                      >
                        <AlertCircle size={18} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Servicios asignados</p>
                      <div className="flex flex-wrap gap-2">
                        {(formData.services || []).map((service) => {
                          const selected = (teacher.serviceIds || []).includes(service.id);
                          return (
                            <button
                              key={service.id}
                              onClick={() => toggleTeacherService(teacher.id, service.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                selected
                                  ? 'bg-primary-600 border-primary-600 text-white'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
                              }`}
                            >
                              {service.name}
                            </button>
                          );
                        })}
                        {(formData.services || []).length === 0 && (
                          <span className="text-xs text-slate-400">Primero agrega al menos un servicio.</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disponibilidad del profesor</p>
                      <p className="text-[11px] text-slate-500">Se guarda respetando el horario global del negocio.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {DAYS_OF_WEEK.map((day) => {
                          const teacherDay = teacher.schedule?.[day.id] || { active: false, start: '09:00', end: '18:00' };
                          const businessDay = formData.schedule?.[day.id];
                          const isBusinessActive = !!businessDay?.active;
                          return (
                            <div key={`${teacher.id}_${day.id}`} className={`p-3 rounded-xl border ${isBusinessActive ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-slate-700">{day.name}</span>
                                <button
                                  onClick={() => toggleTeacherDay(teacher.id, day.id)}
                                  disabled={!isBusinessActive}
                                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-1 disabled:opacity-50 ${
                                    teacherDay.active && isBusinessActive ? 'bg-primary-600' : 'bg-slate-300'
                                  }`}
                                >
                                  <div className={`w-3 h-3 bg-white rounded-full transition-transform ${teacherDay.active && isBusinessActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={teacherDay.start}
                                  disabled={!teacherDay.active || !isBusinessActive}
                                  onChange={(e) => updateTeacherDayTime(teacher.id, day.id, 'start', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                                />
                                <span className="text-slate-400 text-xs">-</span>
                                <input
                                  type="time"
                                  value={teacherDay.end}
                                  disabled={!teacherDay.active || !isBusinessActive}
                                  onChange={(e) => updateTeacherDayTime(teacher.id, day.id, 'end', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-primary-500" size={20} />
              Configuracion Global
            </h3>

            <div className="p-6 bg-primary-50 border border-primary-100 rounded-2xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary-700 uppercase tracking-widest mb-3">Intervalo Minimo entre Turnos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INTERVAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData((prev) => ({ ...prev, interval: opt.value }))}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        formData.interval === opt.value
                          ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                          : 'bg-white border-primary-200 text-primary-700 hover:bg-primary-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm xl:sticky xl:top-24">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-5">
              <Calendar className="text-primary-500" size={20} />
              Horarios
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const dayConfig = formData.schedule[day.id];
                return (
                  <div key={day.id} className={`p-3 rounded-2xl border transition-all ${dayConfig.active ? 'border-primary-100 bg-slate-50/50 shadow-sm' : 'border-slate-100 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-700 text-sm">{day.name}</span>
                      <button
                        onClick={() => toggleDay(day.id)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${dayConfig.active ? 'bg-primary-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${dayConfig.active ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {dayConfig.active ? (
                      <div className="flex items-center gap-2 animate-in fade-in duration-300">
                        <input
                          type="time"
                          value={dayConfig.start}
                          onChange={(e) => updateDayTime(day.id, 'start', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                        <span className="text-slate-400 text-xs">-</span>
                        <input
                          type="time"
                          value={dayConfig.end}
                          onChange={(e) => updateDayTime(day.id, 'end', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2">Cerrado</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettingsPage;

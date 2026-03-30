import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Save, 
  MapPin, 
  Clock, 
  Calendar, 
  Link as LinkIcon, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight,
  Info,
  Users
} from 'lucide-react';
import { dbService } from '../../services/db.service';
import { setActiveBusiness } from '../../features/business/businessSlice';

const DAYS_OF_WEEK = [
  { id: 'mon', name: 'Lunes' },
  { id: 'tue', name: 'Martes' },
  { id: 'wed', name: 'Miércoles' },
  { id: 'thu', name: 'Jueves' },
  { id: 'fri', name: 'Viernes' },
  { id: 'sat', name: 'Sábado' },
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

const BusinessSettingsPage = () => {
  const user = useSelector(state => state.auth.user);
  const activeBusiness = useSelector(state => state.business.activeBusiness);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    address: '',
    phone: '',
    interval: 30,
    schedule: {
      mon: { active: true, start: '09:00', end: '18:00' },
      tue: { active: true, start: '09:00', end: '18:00' },
      wed: { active: true, start: '09:00', end: '18:00' },
      thu: { active: true, start: '09:00', end: '18:00' },
      fri: { active: true, start: '09:00', end: '18:00' },
      sat: { active: false, start: '09:00', end: '13:00' },
      sun: { active: false, start: '09:00', end: '12:00' }
    }
  });

  // Sync with activeBusiness
  useEffect(() => {
    if (activeBusiness) {
      setFormData({
        ...formData,
        ...activeBusiness,
        schedule: activeBusiness.schedule || formData.schedule
      });
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
        throw new Error("No se encontró un negocio vinculado a tu cuenta.");
      }
      
      await dbService.updateBusinessProfile(businessId, formData);
      
      dispatch(setActiveBusiness({ id: businessId, ...formData }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error al guardar:", err);
      setError("No se pudo guardar la configuración. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [dayId]: {
          ...formData.schedule[dayId],
          active: !formData.schedule[dayId].active
        }
      }
    });
  };

  const updateDayTime = (dayId, type, value) => {
    setFormData({
      ...formData,
      schedule: {
        ...formData.schedule,
        [dayId]: {
          ...formData.schedule[dayId],
          [type]: value
        }
      }
    });
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configuración del Negocio</h1>
           <p className="text-slate-500">Gestiona tu perfil público y horarios de atención.</p>
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
          <span className="font-medium text-sm">Cambios guardados correctamente. Tu perfil público ya está actualizado.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle size={22} className="text-red-500" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile & Info */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Info className="text-primary-500" size={20} />
              Perfil Público
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Negocio</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="Ej: Taketurn Studio"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción Corta</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all h-24 resize-none"
                  placeholder="Una breve descripción de lo que ofreces..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <LinkIcon size={14} /> Slug Público URL
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-400 text-xs font-mono">
                      taketurn.com/
                    </span>
                    <input 
                      type="text" 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
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
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="+54 9..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
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
                  setFormData({
                    ...formData,
                    services: [...(formData.services || []), newService]
                  });
                }}
                className="text-primary-600 text-sm font-bold hover:bg-primary-50 py-2 px-4 rounded-xl transition-all"
              >
                + Añadir Servicio
              </button>
            </div>

            <div className="space-y-4">
              {(formData.services || []).map((service, index) => (
                <div key={service.id} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 group relative">
                   <button 
                    onClick={() => {
                      const updatedServices = formData.services.filter(s => s.id !== service.id);
                      setFormData({ ...formData, services: updatedServices });
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
                            const updatedServices = [...formData.services];
                            updatedServices[index] = { ...service, name: e.target.value };
                            setFormData({ ...formData, services: updatedServices });
                          }}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Duración (minutos)</label>
                        <select 
                          value={service.duration}
                          onChange={(e) => {
                            const updatedServices = [...formData.services];
                            updatedServices[index] = { ...service, duration: parseInt(e.target.value) };
                            setFormData({ ...formData, services: updatedServices });
                          }}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                          {[15, 20, 30, 45, 60, 90, 120].map(d => (
                            <option key={d} value={d}>{d} minutos</option>
                          ))}
                        </select>
                      </div>
                   </div>
                   <input 
                      type="text" 
                      placeholder="Breve descripción..."
                      value={service.description}
                      onChange={(e) => {
                        const updatedServices = [...formData.services];
                        updatedServices[index] = { ...service, description: e.target.value };
                        setFormData({ ...formData, services: updatedServices });
                      }}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-primary-500" size={20} />
              Configuración Global
            </h3>
            
            <div className="p-6 bg-primary-50 border border-primary-100 rounded-2xl space-y-4">
               <div>
                  <label className="block text-xs font-bold text-primary-700 uppercase tracking-widest mb-3">Intervalo Mínimo entre Turnos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INTERVAL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormData({...formData, interval: opt.value})}
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

        {/* Right Column: Schedule */}
        <div className="space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-8">
              <Calendar className="text-primary-500" size={20} />
              Horarios
            </h3>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayConfig = formData.schedule[day.id];
                return (
                  <div key={day.id} className={`p-4 rounded-2xl border transition-all ${dayConfig.active ? 'border-primary-100 bg-slate-50/50 shadow-sm' : 'border-slate-100 opacity-60'}`}>
                    <div className="flex items-center justify-between mb-3">
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
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                        <span className="text-slate-400 text-xs">-</span>
                        <input 
                          type="time" 
                          value={dayConfig.end}
                          onChange={(e) => updateDayTime(day.id, 'end', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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

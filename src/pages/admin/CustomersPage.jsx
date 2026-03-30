import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  Calendar, 
  TrendingUp, 
  MoreVertical,
  ArrowUpRight,
  UserCheck,
  UserMinus
} from 'lucide-react';
import { dbService } from '../../services/db.service';

const CustomersPage = () => {
  const user = useSelector(state => state.auth.user);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await dbService.getBusinessCustomers(user.businessId);
        // Mocking some stats for the demo if not present
        const enhancedData = data.map(c => ({
          ...c,
          totalAppointments: c.totalAppointments || Math.floor(Math.random() * 10) + 1,
          lastBooking: c.lastBooking || '2026-03-25'
        }));
        setCustomers(enhancedData);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };
 
    if (user?.businessId) fetchCustomers();
  }, [user?.businessId]);

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Clientes</h1>
           <p className="text-slate-500">Listado completo de personas que han reservado en tu negocio.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre, email o tel..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all text-sm w-full md:w-64"
              />
           </div>
           <button className="bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95">
              <Users size={18} />
              Nuevo Cliente
           </button>
        </div>
      </div>

      {/* Stats Summary Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Clientes</p>
            <div className="flex items-end justify-between">
               <h4 className="text-3xl font-black text-slate-900">{customers.length}</h4>
               <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12% este mes</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recurrencia</p>
            <div className="flex items-end justify-between">
               <h4 className="text-3xl font-black text-slate-900">64%</h4>
               <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Alta</span>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Última Reserva</th>
                <th className="px-6 py-4">Total Turnos</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-4 h-16 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 grayscale opacity-50">
                       <Users size={48} className="text-slate-300" />
                       <p className="text-slate-500 font-bold italic">No hay clientes registrados aún.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm">
                           {customer.name?.[0] || <Users size={16} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{customer.name || 'Cliente sin nombre'}</p>
                          <p className="text-xs text-slate-400">ID: {customer.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors group-hover:text-primary-600">
                          <Phone size={12} /> {customer.phone}
                        </p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          <Mail size={12} /> {customer.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-300" />
                        {customer.lastBooking}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-0.5 bg-slate-100 rounded-lg text-xs font-black text-slate-600">
                           {customer.totalAppointments}
                        </div>
                        {customer.totalAppointments > 5 && (
                          <span className="text-[10px] text-green-600 font-bold flex items-center gap-0.5">
                            <TrendingUp size={10} /> VIP
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                          <MoreVertical size={20} />
                       </button>
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

export default CustomersPage;

import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { LayoutDashboard, Calendar, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
    { icon: <Calendar size={20} />, label: 'Turnos', path: '/admin/appointments' },
    { icon: <Users size={20} />, label: 'Clientes', path: '/admin/customers' },
    { icon: <Settings size={20} />, label: 'Configuracion', path: '/admin/settings' }
  ];

  const isActive = (path) => (path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`hidden lg:flex bg-slate-900 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex-col`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            {isSidebarOpen && <span className="text-xl font-bold tracking-tight">Taketurn</span>}
          </div>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                isActive(item.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="shrink-0 group-hover:text-primary-200">{item.icon}</div>
              {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-medium">Cerrar sesion</span>}
          </button>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menu"
          />
          <aside className="absolute left-0 top-0 h-full w-[82vw] max-w-xs bg-slate-900 text-white p-4 flex flex-col">
            <div className="h-14 flex items-center justify-between border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <span className="text-lg font-bold tracking-tight">Taketurn</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(item.path)
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-3 w-full px-3 py-3 rounded-xl text-slate-300 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={20} />
              <span className="text-sm font-semibold">Cerrar sesion</span>
            </button>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) setIsMobileMenuOpen(true);
              else setIsSidebarOpen(!isSidebarOpen);
            }}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-slate-500">{user?.businessName || 'Mi Negocio'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-primary-200">
              {user?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 overflow-auto pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-2">
        <div className="grid grid-cols-4 gap-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-bold transition-all ${
                isActive(item.path)
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span className="leading-none">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;

import { Outlet, Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const LandingLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Taketurn</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Pricing</a>
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Login</Link>
            <Link to="/register" className="btn-primary py-2 px-5 text-sm">Empieza gratis</Link>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <Link to="/login" className="text-xs font-semibold text-slate-600 px-3 py-2">Login</Link>
            <Link to="/register" className="btn-primary py-2 px-3 text-xs">Empezar</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-200 border-t border-slate-800 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">Taketurn</span>
              </div>
              <p className="text-sm text-slate-400 max-w-md">
                Plataforma para negocios que quieren profesionalizar su agenda y mejorar la experiencia de sus clientes.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-3">Producto</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Empieza gratis</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Acceder</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white mb-3">Contacto</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-primary-400" />
                  <a href="mailto:hola@taketurn.com" className="hover:text-white transition-colors">hola@taketurn.com</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-primary-400" />
                  <span>+54 9 11 5555-1234</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary-400" />
                  <span>Buenos Aires, Argentina</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 text-center text-xs text-slate-500">
            2026 Taketurn. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingLayout;

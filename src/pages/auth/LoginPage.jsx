import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, setError } from '../../features/auth/authSlice';
import { authService } from '../../services/auth.service';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle, Loader2, Briefcase } from 'lucide-react';
import loginBg from '../../assets/login-bg.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(setError(null));
  }, [isRegister, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      let user;
      if (isRegister) {
        user = await authService.register(email, password, businessName);
        console.log("✅ Registro exitoso");
      } else {
        user = await authService.login(email, password);
        console.log("✅ Login exitoso");
      }

      const userData = await authService.getUserData(user.uid);
      
      dispatch(setUser({
        uid: user.uid,
        email: user.email,
        ...userData
      }));

      navigate('/admin');
    } catch (err) {
      console.error("Auth Error:", err);
      dispatch(setError(err.message || "Error al autenticar"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Columna Izquierda: Branding (Visible en LG+) */}
      <div className="hidden lg:flex relative flex-col justify-between p-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={loginBg} 
            className="w-full h-full object-cover filter brightness-50 contrast-125" 
            alt="Taketurn Pro Experience" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/80" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-wider uppercase">SaaS Enterprise</span>
          </div>
          <h1 className="text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Gestiona tu éxito <br /> 
            <span className="text-primary-400">con inteligencia.</span>
          </h1>
          <p className="text-slate-200 text-xl max-w-lg leading-relaxed">
            La plataforma líder para profesionales que buscan automatizar sus turnos y fidelizar a sus clientes.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <p className="text-white/60 text-sm">
            <span className="text-white font-bold">+2,000</span> profesionales ya confían en Taketurn
          </p>
        </div>
      </div>

      {/* Columna Derecha: Formulario */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50/50 overflow-y-auto">
        <div className="w-full max-w-md my-8">
          <div className="text-center lg:text-left mb-10">
             <div className="lg:hidden mb-8">
               <h1 className="text-3xl font-bold text-slate-900">Taketurn</h1>
             </div>
             <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
               {isRegister ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
             </h2>
             <p className="text-slate-500 text-lg">
               {isRegister ? 'Empieza a gestionar tus turnos hoy' : 'Ingresa a tu cuenta dedicada de Taketurn'}
             </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
               <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
               <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="bg-white border border-slate-200/60 p-8 sm:p-10 rounded-3xl shadow-2xl shadow-slate-200/50">
            <form onSubmit={handleSubmit} className="space-y-5">
               {isRegister && (
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Negocio</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
                        placeholder="Ej: Belleza Natural"
                        required={isRegister}
                      />
                    </div>
                 </div>
               )}

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Profesional</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
                      placeholder="nombre@empresa.com"
                      required
                    />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
                      placeholder="••••••••"
                      required
                    />
                  </div>
               </div>

               {!isRegister && (
                 <div className="flex items-center justify-between py-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer" />
                      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors font-medium">Recuérdame</span>
                    </label>
                    <a href="#" className="text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors">¿Olvidaste tu contraseña?</a>
                 </div>
               )}

               <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4.5 rounded-2xl shadow-lg shadow-slate-200 flex items-center justify-center gap-3 group transition-all transform active:scale-95"
               >
                  {loading ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <>
                      <LogIn size={22} className="group-hover:-translate-x-1 transition-transform" />
                      <span className="text-lg">{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                      <ArrowRight size={20} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
               </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
               <p className="text-slate-500 font-medium">
                 {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta corporativa?'} <br />
                 <Link 
                  to={isRegister ? "/login" : "/register"} 
                  className="text-primary-600 font-bold hover:text-primary-700 transition-colors mt-2 inline-block"
                 >
                   {isRegister ? 'Inicia sesión aquí' : 'Regístrate ahora gratis'}
                 </Link>
               </p>
            </div>
          </div>
          
          <p className="mt-10 text-center text-slate-400 text-sm">
            Al continuar aceptas nuestros <a href="#" className="underline">Términos de Servicio</a> y <a href="#" className="underline">Políticas de Privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

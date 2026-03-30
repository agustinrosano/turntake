import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authService } from '../../services/auth.service';
import { dbService } from '../../services/db.service';
import { setUser, setLoading } from '../../features/auth/authSlice';
import { setActiveBusiness } from '../../features/business/businessSlice';

const AuthListener = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      dispatch(setLoading(true));
      
      if (firebaseUser) {
        try {
          // 1. Obtener datos del perfil (con auto-provisión si no existe)
          const userData = await authService.getUserData(firebaseUser.uid);
          
          if (userData) {
            // 2. Si tiene una empresa vinculada, cargar los detalles de la empresa
            if (userData.businessId) {
              const businessData = await dbService.getBusinessById(userData.businessId);
              if (businessData) {
                dispatch(setActiveBusiness(businessData));
              }
            }
            
            dispatch(setUser(userData));
          }
        } catch (error) {
          console.error("Error in AuthListener:", error);
        }
      } else {
        dispatch(setUser(null));
        dispatch(setActiveBusiness(null));
      }
      
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthListener;

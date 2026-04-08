import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { router } from './routes';
import './index.css';

import AuthListener from './components/auth/AuthListener';
import { NotificationProvider } from './components/ui/NotificationProvider';

function App() {
  return (
    <Provider store={store}>
      <NotificationProvider>
        <AuthListener>
          <RouterProvider router={router} />
        </AuthListener>
      </NotificationProvider>
    </Provider>
  );
}

export default App;

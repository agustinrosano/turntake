import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { router } from './routes';
import './index.css';

import AuthListener from './components/auth/AuthListener';

function App() {
  return (
    <Provider store={store}>
      <AuthListener>
        <RouterProvider router={router} />
      </AuthListener>
    </Provider>
  );
}

export default App;

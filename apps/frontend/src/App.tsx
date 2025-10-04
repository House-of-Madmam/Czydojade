import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StrictMode } from 'react';
import { AuthContextProvider } from './context/AuthContextProvider.tsx';

import Root from './pages/Root';
import { CookiesProvider } from 'react-cookie';
import HomePage from './pages/HomePage.tsx';
import { TooltipProvider } from './components/ui/Tooltip.tsx';
import PrivateRoute from './auth/privateRoute.tsx';
import LogoutPage from './pages/LogoutPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store/store.ts';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/logout',
        element: (
          <PrivateRoute>
            <LogoutPage />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

function App() {
  return (
    <StrictMode>
      <ReduxProvider store={store}>
        <CookiesProvider>
          <AuthContextProvider>
            <TooltipProvider>
              <RouterProvider router={router} />
            </TooltipProvider>
          </AuthContextProvider>
        </CookiesProvider>
      </ReduxProvider>
    </StrictMode>
  );
}

export default App;

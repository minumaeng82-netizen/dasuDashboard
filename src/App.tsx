import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TrainingBoard } from './pages/TrainingBoard';
import { Calendar } from './pages/Calendar';
import { Login } from './pages/Login';
import { AdminSettings } from './pages/AdminSettings';
import { ShortcutManagement } from './pages/ShortcutManagement';
import { PasswordSettings } from './pages/Settings';
import { User } from './types';
import { DeviceProvider } from './context/DeviceContext';

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Failed to parse user from localStorage:', err);
      localStorage.removeItem('user');
    }
  }, []);


  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setCurrentPath('/');
  };


  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentPath('/');
  };

  const renderPage = () => {
    if (currentPath === '/login') {
      return <Login onLogin={handleLogin} />;
    }

    switch (currentPath) {
      case '/':
        return <Dashboard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
      case '/training':
        return <TrainingBoard user={user} />;

      case '/calendar':
        return <Calendar user={user} />;
      case '/admin-settings':
        return user?.role === 'admin' ? <AdminSettings user={user} /> : <Dashboard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
      case '/users':
        return user?.role === 'admin' ? <AdminSettings user={user} /> : <Dashboard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
      case '/shortcuts':
        return user?.role === 'admin' ? <ShortcutManagement user={user} /> : <Dashboard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
      case '/settings':
        return <PasswordSettings user={user} onUserUpdate={(updated) => {
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        }} />;
      default:
        return <Dashboard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
    }
  };

  return (
    <DeviceProvider>
      <Layout
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        user={user}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
    </DeviceProvider>
  );
}


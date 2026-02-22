import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TrainingBoard } from './pages/TrainingBoard';
import { Calendar } from './pages/Calendar';
import { Login } from './pages/Login';
import { UserManagement } from './pages/UserManagement';
import { User } from './types';

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (email: string, role: 'admin' | 'user') => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      role
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
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
        return <TrainingBoard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
      case '/calendar':
        return <Calendar isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
      case '/users':
        return user?.role === 'admin' ? <UserManagement /> : <Dashboard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
      default:
        return <Dashboard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
    }
  };

  return (
    <Layout
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      user={user}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}


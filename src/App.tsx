import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TrainingBoard } from './pages/TrainingBoard';
import { Calendar } from './pages/Calendar';
import { Login } from './pages/Login';
import { UserManagement } from './pages/UserManagement';
import { PasswordSettings } from './pages/Settings';
import { User } from './types';

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


  const handleLogin = (email: string, role: 'admin' | 'user') => {
    // Check if we have additional user info in registered_users
    const saved = localStorage.getItem('registered_users');
    let existingPassword = '123456';
    if (saved) {
      const users: User[] = JSON.parse(saved);
      const matched = users.find(u => u.email === email);
      if (matched?.password) existingPassword = matched.password;
    }

    const newUser: User = {
      id: email,
      email,
      name: email.split('@')[0],
      role,
      password: existingPassword
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
        return <TrainingBoard user={user} />;

      case '/calendar':
        return <Calendar user={user} />;
      case '/users':
        return user?.role === 'admin' ? <UserManagement /> : <Dashboard isAuthenticated={!!user} isAdmin={user?.role === 'admin'} />;
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


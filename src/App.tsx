import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { TrainingBoard } from './pages/TrainingBoard';
import { Calendar } from './pages/Calendar';

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');

  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <Dashboard />;
      case '/training':
        return <TrainingBoard />;
      case '/calendar':
        return <Calendar />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={setCurrentPath}>
      {renderPage()}
    </Layout>
  );
}

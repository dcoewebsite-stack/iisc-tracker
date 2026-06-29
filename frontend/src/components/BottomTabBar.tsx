import { useNavigate, useLocation } from 'react-router-dom';

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/colleges', label: 'Colleges', icon: '🎓' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors
              ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <span className="text-2xl mb-1">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default BottomTabBar;
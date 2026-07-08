import { useNavigate, useLocation } from 'react-router-dom';

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/colleges', label: 'Colleges', icon: '🎓' },
    { path: '/log', label: 'Log', icon: '📋' },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white z-50"
      style={{ boxShadow: '0 -1px 0 0 #E5DFD3, 0 -4px 16px rgba(0,0,0,0.06)' }}
    >
      <div className="flex">
        {tabs.map((tab, index) => {
          const isActive = location.pathname === tab.path;
          return (
            <div
              key={tab.path}
              className={`flex-1 flex ${index !== 0 ? 'border-l border-warmgray' : ''}`}
            >
              <button
                onClick={() => navigate(tab.path)}
                className="flex-1 flex flex-col items-center justify-center pt-3 pb-4 gap-1 transition-colors"
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className={`text-[11px] font-medium tracking-wide transition-colors
                  ${isActive ? 'text-forest font-semibold' : 'text-sage'}`}>
                  {tab.label}
                </span>
                <div className={`h-0.5 w-6 rounded-full transition-all
                  ${isActive ? 'bg-forest' : 'bg-transparent'}`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabBar;
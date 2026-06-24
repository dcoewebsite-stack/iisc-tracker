import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const employeeName = localStorage.getItem('employeeName');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('employeeName');
    navigate('/login');
  };

  return (
    <div className="p-8">
      <p className="text-xl mb-4">Dashboard — coming Day 11</p>
      <p className="text-gray-600 mb-6">Logged in as: {employeeName}</p>
      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded-lg"
      >
        Logout
      </button>
    </div>
  );
};

export default DashboardPage;
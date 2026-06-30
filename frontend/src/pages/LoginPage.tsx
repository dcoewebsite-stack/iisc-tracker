import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

const EMPLOYEE_NAMES = [
  'Pravar',
  'Riya',
  'Amit',
  'Neha',
];

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeName || !password.trim()) {
      setError('Please select your name and enter password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        employeeName,
        password,
      });

      const { token, employeeName: name } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('employeeName', name);
      onLoginSuccess(token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-warmgray p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-ink">Outreach CRM</h1>
          <p className="text-sm text-sage mt-1">College Outreach Management</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Your Name
            </label>
            <select
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest text-ink text-base bg-white"
            >
              <option value="">Select your name</option>
              {EMPLOYEE_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter shared password"
              className="w-full px-4 py-3 rounded-xl border border-warmgray focus:outline-none focus:ring-2 focus:ring-forest text-ink text-base"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-forest hover:bg-forest-dark disabled:bg-forest/40 text-white font-semibold py-3 rounded-xl transition-colors text-base"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
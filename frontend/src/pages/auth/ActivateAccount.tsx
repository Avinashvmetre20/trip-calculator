import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle, XCircle, Loader, KeyRound } from 'lucide-react';

const ActivateAccount = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'otp-input'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    if (token) {
      activateWithLink();
    } else {
      setStatus('otp-input');
    }
  }, [token]);

  const activateWithLink = async () => {
    if (!token) return;

    try {
      const response = await api.get(`/auth/activate/${token}`);
      setStatus('success');
      setMessage(response.data.message || 'Account activated successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Activation failed. Please try again.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);

    try {
      const response = await api.post('/auth/activate-otp', { email, otp });
      setStatus('success');
      setMessage(response.data.message || 'Account activated successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Invalid OTP or email.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader className="mx-auto mb-4 animate-spin text-blue-600" size={48} />
            <h2 className="text-2xl font-bold mb-2">Activating Account...</h2>
            <p className="text-gray-600">Please wait while we activate your account.</p>
          </div>
        )}

        {status === 'otp-input' && (
          <div>
            <KeyRound className="mx-auto mb-4 text-blue-600" size={48} />
            <h2 className="text-2xl font-bold text-center mb-2">Enter Activation Code</h2>
            <p className="text-gray-600 text-center mb-6">Enter the 6-digit code sent to your email</p>
            
            <form onSubmit={handleOtpSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Activation Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full p-3 border rounded text-center text-2xl font-bold tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {otpLoading ? 'Activating...' : 'Activate Account'}
              </button>
            </form>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              Or check your email for the activation link
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
            <p className="text-gray-700 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
            <Link 
              to="/login" 
              className="inline-block mt-4 text-blue-600 hover:underline"
            >
              Click here if not redirected
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="mx-auto mb-4 text-red-600" size={48} />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Activation Failed</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="space-y-2">
              <Link 
                to="/activate"
                className="block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Try with OTP
              </Link>
              <Link 
                to="/login" 
                className="block text-blue-600 hover:underline"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivateAccount;


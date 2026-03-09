import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/courses');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    } catch (err: any) {
      setError('فشل تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">
      <div className=" islamic2-bg hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-50 to-stone-100 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <div className="mb-8">
            <img
              src="/image.png"
              alt="المركز العالمي"
              className="w-64 h-64 mx-auto object-contain rounded-md"
            />
          </div>
          <h1 className="text-4xl font-bold text-stone-800 mb-4">المركز العالمي</h1>
          <p className="text-xl text-stone-600">لتعليم اللغة العربية</p>
          <div className="mt-12 space-y-4 text-stone-700">
            <p className="text-lg">نبني جسوراً من المعرفة</p>
            <p className="text-lg">ونضيء طريق العلم والثقافة</p>
          </div>
        </div>
      </div>

      <div className=" flex-1 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          <div className="lg:hidden mb-8 text-center">
            <img
              src="/image.png"
              alt="المركز العالمي"
              className="w-32 h-32 mx-auto object-contain mb-4 rounded-md" 
            />
            <h1 className="text-3xl font-bold text-stone-800">المركز العالمي</h1>
          </div>

          <div className="bg-white border-2 border-stone-200 rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-stone-800 mb-2">تسجيل الدخول</h2>
            <p className="text-stone-600 mb-8">مرحباً بك في نظام إدارة المركز</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  placeholder="أدخل بريدك الإلكتروني"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                  كلمة المرور
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                  placeholder="أدخل كلمة المرور"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-800 text-white py-3 rounded-lg hover:bg-stone-900 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-stone-600">
            نظام إدارة المركز العالمي لتعليم اللغة العربية
          </p>
        </div>
      </div>
    </div>
  );
}

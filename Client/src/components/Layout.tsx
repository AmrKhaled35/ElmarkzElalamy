import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  BookOpen,
  Users,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { usersAPI } from "../services/api";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setToastType("error");
      setToastMessage("يرجى ملء جميع الحقول");
      return;
    }

    try {
      await usersAPI.setPassword(currentPassword, newPassword);
      setToastType("success");
      setToastMessage("تم تغيير كلمة المرور بنجاح!");
      setCurrentPassword("");
      setNewPassword("");
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error(error);
      setToastType("error");
      setToastMessage(
        "حدث خطأ أثناء تغيير كلمة المرور. تحقق من البيانات وحاول مرة أخرى."
      );
    }
  };
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [toastMessage]);
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col " dir="rtl">
      <header className=" bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm  top-0  ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-10">
              <Link
                to="/courses"
                className="flex items-center gap-3 group transition-transform hover:scale-105"
              >
                <div className="p-1.5 bg-amber-50 rounded-xl border border-amber-100 shadow-sm group-hover:bg-amber-100 transition-colors">
                  <img
                    src="/image.png"
                    alt="المركز العالمي"
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-black text-stone-800 tracking-tight leading-none">
                    المركز العالمي
                  </h1>
                  <span className="text-[10px] text-amber-600 font-bold tracking-widest uppercase mt-1">
                    للعلوم والتدريب
                  </span>
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/courses"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                    location.pathname === "/courses"
                      ? "bg-stone-800 text-white shadow-md shadow-stone-200"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>الدورات</span>
                </Link>

                {user?.role === "admin" && (
                  <Link
                    to="/teachers"
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                      location.pathname === "/teachers"
                        ? "bg-stone-800 text-white shadow-md shadow-stone-200"
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>المعلمون</span>
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div
                className="hidden cursor-pointer sm:flex items-center gap-3 px-4 py-2 bg-stone-50 border border-stone-100 rounded-2xl"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-800 leading-none">
                    {user?.full_name}
                  </p>
                  <p className="text-[10px] font-medium text-amber-700 mt-1 bg-amber-50 px-1.5 py-0.5 rounded inline-block">
                    {user?.role === "admin" ? "مدير النظام" : "معلم"}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 shadow-sm">
                  <UserIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="hidden md:block w-px h-8 bg-stone-200 mx-2"></div>
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-bold text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors border border-stone-200"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div
            className="md:hidden cursor-pointer bg-white border-t border-stone-100 shadow-2xl animate-in slide-in-from-top-4 duration-300"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 sm:hidden">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shadow-inner">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-black text-stone-800">
                    {user?.full_name}
                  </p>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-tighter">
                    {user?.role === "admin" ? "مدير النظام" : "معلم"}
                  </p>
                </div>
              </div>

              <nav className="space-y-2">
                <Link
                  to="/courses"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${
                    location.pathname === "/courses"
                      ? "bg-stone-800 text-white shadow-lg"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span>الكورسات</span>
                </Link>

                {user?.role === "admin" && (
                  <Link
                    to="/teachers"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all ${
                      location.pathname === "/teachers"
                        ? "bg-stone-800 text-white shadow-lg"
                        : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>المعلمون</span>
                  </Link>
                )}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-5 py-4 text-red-600 bg-red-50/50 hover:bg-red-50 rounded-xl transition-all font-bold"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}
      </header>
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-lg relative">
            <h2 className="text-lg font-bold mb-4">تغيير كلمة المرور</h2>

            <div className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="كلمة المرور الحالية"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border border-stone-200 rounded-lg px-4 py-2 w-full"
              />
              <input
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border border-stone-200 rounded-lg px-4 py-2 w-full"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100"
              >
                إلغاء
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
      {toastMessage && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg text-white font-bold transition-all duration-300 ${
            toastType === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toastMessage}
        </div>
      )}
      <main className="islamic-bg flex-grow relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

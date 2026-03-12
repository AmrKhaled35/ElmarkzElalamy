import { useState, useEffect } from "react";
import { Plus, User, Mail, Trash2 } from "lucide-react";
import Layout from "../components/Layout";
import { usersAPI } from "../services/api";

interface Teacher {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}
const translateError = (message: string) => {

  if (message.includes("password is too short")) {
    return "كلمة المرور قصيرة جداً، يجب أن تحتوي على 8 أحرف على الأقل";
  }

  if (message.includes("user with this email already exists")) {
    return "هذا البريد الإلكتروني مستخدم بالفعل";
  }

  if (message.includes("This field is required")) {
    return "هذا الحقل مطلوب";
  }

  return message;
};

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "teacher",
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const response = await usersAPI.getAll();
      const teachersList = response.data.results.filter(
        (u: Teacher) => u.role !== "admin"
      );
      setTeachers(teachersList);
    } catch (error) {
      console.error("Failed to load teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setErrors({});

      await usersAPI.create(formData);

      setShowModal(false);
      setFormData({ full_name: "", email: "", password: "", role: "teacher" });
      loadTeachers();
    } catch (error: any) {
      if (error.response && error.response.data) {
        setErrors(error.response.data);
      }

      console.error("Failed to create teacher:", error);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await usersAPI.delete(deleteId, deletePassword);
      loadTeachers();
    } catch (error) {
      console.error("Failed to delete teacher:", error);
    }

    setShowDeleteModal(false);
    setDeletePassword("");
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const openDetailModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-stone-600">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header Section - Responsive Flex */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-2">
            المعلمون
          </h1>
          <p className="text-sm md:text-base text-stone-600">
            إدارة جميع المعلمين والمدربين
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة معلم</span>
        </button>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-stone-300 px-4">
          <User className="w-16 h-16 mx-auto text-stone-400 mb-4" />
          <h3 className="text-xl font-medium text-stone-800 mb-2">
            لا يوجد معلمون حتى الآن
          </h3>
          <p className="text-stone-600 mb-6">ابدأ بإضافة أول معلم</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة معلم جديد</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
          {/* Desktop Table View - Visible on MD and up */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    الاسم
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    البريد الإلكتروني
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    الدور
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-stone-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-amber-700" />
                        </div>
                        <span className="font-medium text-stone-800">
                          {teacher.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{teacher.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        معلم
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetailModal(teacher)}
                          className="px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition"
                        >
                          عرض التفاصيل
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Visible only on Small screens */}
          <div className="grid grid-cols-1 divide-y divide-stone-200 md:hidden">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-800">
                        {teacher.full_name}
                      </h4>
                      <p className="text-xs text-stone-500">معلم</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-stone-600 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{teacher.email}</span>
                </div>
                <button
                  onClick={() => openDetailModal(teacher)}
                  className="w-full mt-2 py-2 text-center text-sm font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200"
                >
                  عرض التفاصيل
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal - Improved for mobile with 'inset-0' and padding */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">
              إضافة معلم جديد
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-4 py-3 md:py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="أدخل الاسم الكامل"
                />
                {errors.full_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {translateError (errors.full_name[0])}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 md:py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="example@mail.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {translateError(errors.email[0])}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 md:py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="أدخل كلمة المرور"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {translateError(errors.password[0])}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-stone-800 text-white py-3 md:py-2 rounded-lg hover:bg-stone-900 transition font-medium order-1 sm:order-2"
                >
                  إضافة المعلم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      full_name: "",
                      email: "",
                      password: "",
                      role: "teacher",
                    });
                  }}
                  className="flex-1 bg-stone-200 text-stone-700 py-3 md:py-2 rounded-lg hover:bg-stone-300 transition order-2 sm:order-1"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal - Improved for mobile */}
      {showDetailModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-stone-800 mb-6 border-b pb-2">
              تفاصيل المعلم
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-amber-700" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-lg font-bold text-stone-800 truncate">
                    {selectedTeacher.full_name}
                  </h3>
                  <p className="text-sm text-stone-600 truncate">
                    {selectedTeacher.email}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-xs text-stone-600 mb-1">الدور</p>
                  <p className="font-medium text-stone-800">معلم</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-xs text-stone-600 mb-1">تاريخ الإضافة</p>
                  <p className="font-medium text-stone-800">
                    {new Date(selectedTeacher.created_at).toLocaleDateString(
                      "ar-EG"
                    )}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 bg-stone-800 text-white py-3 rounded-lg hover:bg-stone-900 transition font-medium"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-stone-800 mb-4">
              تأكيد حذف المعلم
            </h2>

            <p className="text-stone-600 mb-4">
              يرجى إدخال كلمة المرور للمتابعة
            </p>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              className="w-full px-4 py-3 border border-stone-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 outline-none"
            />

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                تأكيد الحذف
              </button>

              <button
                onClick={cancelDelete}
                className="flex-1 bg-stone-200 text-stone-700 py-2 rounded-lg hover:bg-stone-300"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, CreditCard as Edit2, Trash2, BookOpen } from "lucide-react";
import Layout from "../components/Layout";
import { coursesAPI } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../contexts/AuthContext";

interface Course {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await coursesAPI.getAll();
      setCourses(response.data.results || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await coursesAPI.update(editingCourse.id, formData);
      } else {
        await coursesAPI.create(formData);
      }
      setShowModal(false);
      setFormData({ name: "", description: "" });
      setEditingCourse(null);
      loadCourses();
    } catch (error) {
      console.error("Failed to save course:", error);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await coursesAPI.delete(deleteId);
      loadCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({ name: course.name, description: course.description });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-stone-600 text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">الدورات</h1>
          <p className="text-stone-600">إدارة جميع الدورات الدراسية</p>
        </div>
        {user?.role === "admin" ? (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة دورة</span>
          </button>
        ) : (
          <div className="px-6 py-3 rounded-lg border border-stone-200 text-stone-700 flex items-center gap-2 bg-stone-100">
            <BookOpen className="w-5 h-5 opacity-100" />
            <span>عرض الدورات المتاحة</span>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-stone-300">
          <BookOpen
            className={`w-16 h-16 mx-auto mb-4 ${
              user?.role === "admin" ? "text-stone-400" : "text-amber-500"
            }`}
          />
          <h3
            className={`text-xl font-medium mb-2 ${
              user?.role === "admin" ? "text-stone-800" : "text-stone-800"
            }`}
          >
            {user?.role === "admin"
              ? "لا توجد دورات حتى الآن"
              : "عرض الدورات المتاحة فقط"}
          </h3>
          <p
            className={`mb-6 ${
              user?.role === "admin" ? "text-stone-600" : "text-stone-700"
            }`}
          >
            {user?.role === "admin"
              ? "ابدأ بإضافة أول دورة دراسية"
              : "يمكنك مشاهدة الدورات المتاحة فقط"}
          </p>

          {user?.role === "admin" ? (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة دورة جديدة</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-stone-200 text-stone-700 bg-stone-100">
              <BookOpen className="w-5 h-5 opacity-100" />
              <span>عرض الدورات المتاحة</span>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-stone-200 rounded-lg p-6 hover:shadow-xl transition group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-12 h-12 opacity-10 pointer-events-none">
                <svg viewBox="0 0 48 48" fill="none">
                  <path
                    d="M0 0 L48 0 L48 48 L0 0Z"
                    fill="currentColor"
                    className="text-amber-700"
                  />
                  <path
                    d="M0 0 L24 12 L12 24 L0 0Z"
                    fill="currentColor"
                    className="text-amber-700"
                  />
                </svg>
              </div>

              <Link to={`/courses/${course.id}/levels`} className="block">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-amber-700 transition">
                      {course.name}
                    </h3>
                    <p className="text-stone-600 text-sm line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>
              </Link>
              {user?.role === "admin" ? (
                <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
                  <button
                    onClick={() => openEditModal(course)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm">تعديل</span>
                  </button>

                  <button
                    onClick={() => handleDelete(course.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">حذف</span>
                  </button>
                </div>
              ) : (
                <Link
                  to={`/courses/${course.id}/levels`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50 rounded-lg transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">عرض الدورة</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          dir="rtl"
        >
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-stone-200 shadow-xl">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">
              {editingCourse ? "تعديل دورة" : "إضافة دورة جديدة"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  اسم الدورة
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="أدخل اسم الدورة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  الوصف
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="أدخل وصف الدورة"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-900 transition"
                >
                  {editingCourse ? "حفظ التعديلات" : "إضافة الدورة"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCourse(null);
                    setFormData({ name: "", description: "" });
                  }}
                  className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-lg hover:bg-stone-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="حذف الدورة"
        message="هل أنت متأكد أنك تريد حذف هذه الدورة؟"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Layout>
  );
}

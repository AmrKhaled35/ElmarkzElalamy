import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, CreditCard as Edit2, Trash2, ArrowRight, Layers } from 'lucide-react';
import Layout from '../components/Layout';
import { levelsAPI, coursesAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';


interface Level {
  id: number;
  name: string;
  description?: string;
}

interface Teacher {
  id: number;
  full_name: string;
  email: string;
}

export default function Levels() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadLevels();
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      if (courseId) {
        const response = await coursesAPI.getById(parseInt(courseId));
        setCourseName(response.data.name);
      }
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  const loadLevels = async () => {
    try {
      if (courseId) {
        const response = await levelsAPI.getAll(parseInt(courseId));
        setLevels(response.data.results || []);
      }
    } catch (error) {
      console.error('Failed to load levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await usersAPI.getAll();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teachersList = response.data.results.filter((u: any) => u.role !== 'admin');
      setTeachers(teachersList);
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const levelData = {
        ...formData,
        course: parseInt(courseId!),
        user: selectedTeacher || user!.id,
      };

      if (editingLevel) {
        await levelsAPI.update(editingLevel.id, levelData);
      } else {
        await levelsAPI.create(levelData);
      }
      setShowModal(false);
      setShowTeacherModal(false);
      setFormData({ name: '', description: '' });
      setEditingLevel(null);
      setSelectedTeacher(null);
      loadLevels();
    } catch (error) {
      console.error('Failed to save level:', error);
    }
  };

  // const handleDelete = async (id: number) => {
  //   if (window.confirm('هل أنت متأكد من حذف هذا المستوى؟')) {
  //     try {
  //       await levelsAPI.delete(id);
  //       loadLevels();
  //     } catch (error) {
  //       console.error('Failed to delete level:', error);
  //     }
  //   }
  // };
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
  
    try {
      await levelsAPI.delete(deleteId);
      loadLevels();
    } catch (error) {
      console.error('Failed to delete level:', error);
    }
  
    setShowDeleteModal(false);
    setDeleteId(null);
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };
  

  const openEditModal = (level: Level) => {
    setEditingLevel(level);
    setFormData({ name: level.name, description: level.description || '' });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingLevel(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const continueToTeacherSelection = () => {
    setShowModal(false);
    loadTeachers();
    setShowTeacherModal(true);
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
      <div className="mb-8">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-800 mb-4"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة إلى الكورسات</span>
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 mb-2">{courseName}</h1>
            <p className="text-stone-600">المستويات الدراسية</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة مستوى</span>
          </button>
        </div>
      </div>

      {levels.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-stone-300">
          <Layers className="w-16 h-16 mx-auto text-stone-400 mb-4" />
          <h3 className="text-xl font-medium text-stone-800 mb-2">لا توجد مستويات حتى الآن</h3>
          <p className="text-stone-600 mb-6">ابدأ بإضافة أول مستوى دراسي</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة مستوى جديد</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((level, index) => (
            <Link
              key={level.id}
              to={`/levels/${level.id}/students`}
              className="bg-gradient-to-br from-white to-amber-50 border-2 border-stone-200 rounded-lg p-6 hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-full opacity-50" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-stone-800 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-amber-700 transition">
                  {level.name}
                </h3>
                {level.description && (
                  <p className="text-stone-600 text-sm line-clamp-2">{level.description}</p>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-stone-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      openEditModal(level);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-stone-600 hover:bg-white rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm">تعديل</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(level.id);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">حذف</span>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">
              {editingLevel ? 'تعديل المستوى' : 'إضافة مستوى جديد'}
            </h2>

            <form onSubmit={editingLevel ? handleSubmit : (e) => { e.preventDefault(); continueToTeacherSelection(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  اسم المستوى
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="مثال: المستوى الأول"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="وصف مختصر للمستوى (اختياري)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-900 transition"
                >
                  {editingLevel ? 'حفظ التعديلات' : 'التالي'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingLevel(null);
                    setFormData({ name: '', description: '' });
                  }}
                  className="flex-1 bg-stone-200 text-stone-700 py-2 rounded-lg hover:bg-stone-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeacherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">اختر المعلم</h2>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher.id)}
                  className={`w-full text-right p-4 rounded-lg border-2 transition ${
                    selectedTeacher === teacher.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <p className="font-medium text-stone-800">{teacher.full_name}</p>
                  <p className="text-sm text-stone-600">{teacher.email}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <button
                type="submit"
                disabled={!selectedTeacher}
                className="flex-1 bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                تكليف بالمستوى
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTeacherModal(false);
                  setShowModal(true);
                }}
                className="flex-1 bg-stone-200 text-stone-700 py-2 rounded-lg hover:bg-stone-300 transition"
              >
                رجوع
              </button>
            </form>
          </div>
        </div>
      )}
        <ConfirmModal
        isOpen={showDeleteModal}
        title="حذف المستوى"
        message="هل أنت متأكد أنك تريد حذف هذا المستوى؟"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Layout>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  CreditCard as Edit2,
  Trash2,
  ArrowRight,
  GraduationCap,
  Users,
} from "lucide-react";
import Layout from "../components/Layout";
import { studentsAPI, levelsAPI } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import amiriRegular from "../fonts/AmiriRegularnormal.js";
import amiriBold from "../fonts/AmiriBoldnormal.js";
import { useRef } from "react";
import autoTable from "jspdf-autotable";

interface Student {
  id: number;
  full_name: string;
  level_name: string;
  activity?: number;
  oral?: number;
  written?: number;
  total: number;
  grade: string;
  result: string;
}

export default function Students() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentPDF, setStudentPDF] = useState<Student[] | null>(null);
  const [levelName, setLevelName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    activity: 0,
    oral: 0,
    written: 0,
  });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadStudents();
    loadLevel();
    loadStudentsPDF();
  }, [levelId]);

  const loadLevel = async () => {
    try {
      if (levelId) {
        const response = await levelsAPI.getById(parseInt(levelId));
        setLevelName(response.data.name);
      }
    } catch (error) {
      console.error("Failed to load level:", error);
    }
  };

  const loadStudents = async () => {
    try {
      if (levelId) {
        const response = await studentsAPI.getByLevel(parseInt(levelId));
        setStudents(response.data.results || []);
      }
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsPDF = async () => {
    if (!levelId) return;
  
    setLoading(true);
    try {
      const response = await studentsAPI.getPDF(parseInt(levelId));
      setStudentPDF(response.data.results || []); 
    } catch (error) {
      console.error("Failed to load PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent.id, formData);
      } else {
        await studentsAPI.create(parseInt(levelId!), formData);
      }
      setShowModal(false);
      setFormData({ full_name: "", activity: 0, oral: 0, written: 0 });
      setEditingStudent(null);
      loadStudents();
      loadStudentsPDF();
    } catch (error) {
      console.error("Failed to save student:", error);
    }
  };


  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await studentsAPI.delete(deleteId);
      loadStudents();
    } catch (error) {
      console.error("Failed to delete level:", error);
    }

    setShowDeleteModal(false);
    setDeleteId(null);
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const openEditModal = async (student: Student) => {
    try {
      const response = await studentsAPI.getById(student.id);
      const fullStudent = response.data;
      setEditingStudent(fullStudent);
      setFormData({
        full_name: fullStudent.full_name,
        activity: fullStudent.activity || 0,
        oral: fullStudent.oral || 0,
        written: fullStudent.written || 0,
      });
      setShowModal(true);
    } catch (error) {
      console.error("Failed to load student details:", error);
    }
  };

  const openDetailModal = async (student: Student) => {
    try {
      const response = await studentsAPI.getById(student.id);
      setSelectedStudent(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Failed to load student details:", error);
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({ full_name: "", activity: 0, oral: 0, written: 0 });
    setShowModal(true);
  };

  const getResultColor = (result: string) => {
    if (result === "ناجح") return "bg-green-100 text-green-800";
    if (result === "راسب") return "bg-red-100 text-red-800";
    return "bg-stone-100 text-stone-800";
  };



  const exportToPDF = async () => {
    if (!levelId) return;
  
    setExporting(true);
    try {
  
      if (studentPDF && studentPDF.length > 0) {
        const pdf = new jsPDF("l", "mm", "a4");
        pdf.addFileToVFS("Amiri-Regular.ttf", amiriRegular);
        pdf.addFont("Amiri-Regular.ttf", "Amiri", "normal");
  
        if (typeof amiriBold !== "undefined") {
          pdf.addFileToVFS("Amiri-Bold.ttf", amiriBold);
          pdf.addFont("Amiri-Bold.ttf", "Amiri", "bold");
        }
  
        pdf.setFont("Amiri", "normal");
        pdf.setFontSize(18);
        pdf.text(levelName, pdf.internal.pageSize.getWidth() / 2, 15, {
          align: "center",
        });
  
        pdf.setFontSize(11);
        autoTable(pdf, {
          startY: 30,
          head: [["النتيجة", "التقدير", "المجموع", "التحريري", "الشفوي", "النشاط", "المستوى", "الاسم"]],
          body: studentPDF.map((s) => [
            s.result,
            s.grade,
            s.total,
            s.written || 0,
            s.oral || 0,
            s.activity || 0,
            s.level_name,
            s.full_name,
          ]),
          theme: "grid",
          styles: {
            font: "Amiri",
            fontSize: 10,
            halign: "right",
            valign: "middle",
            cellPadding: 4,
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [50, 50, 50],
            fontStyle: "bold",
            halign: "center",
          },
        });
  
        pdf.save(`${levelName}_تقرير.pdf`);
      } else {
        console.warn("No PDF data available!");
      }
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setExporting(false);
    }
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
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-800 mb-4"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة</span>
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 mb-2">
              {levelName}
            </h1>
            <p className="text-stone-600">قائمة الطلاب والدرجات</p>
          </div>

          <div className="flex gap-3">
            {students.length > 0 && (
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <FileDown className="w-5 h-5" />
                <span>{exporting ? "جاري التصدير..." : "تصدير PDF"}</span>
              </button>
            )}

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">إضافة طالب</span>
            </button>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-stone-300">
          <Users className="w-16 h-16 mx-auto text-stone-400 mb-4" />
          <h3 className="text-xl font-medium text-stone-800 mb-2">
            لا يوجد طلاب حتى الآن
          </h3>
          <p className="text-stone-600 mb-6">
            ابدأ بإضافة أول طالب في هذا المستوى
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-stone-800 text-white px-6 py-3 rounded-lg hover:bg-stone-900 transition"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => openDetailModal(student)}
                className="bg-white rounded-lg border border-stone-200 p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 text-lg leading-tight">
                        {student.full_name}
                      </h3>
                      <p className="text-sm text-stone-500 mt-1">
                        {student.level_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-stone-50 rounded-lg p-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(student);
                      }}
                      className="p-2 text-stone-600 hover:text-amber-600 hover:bg-stone-200 rounded-md transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(student.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-md transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                    <p className="text-xs text-stone-500 mb-1">الدرجة الكلية</p>
                    <p className="font-bold text-stone-800">{student.total}</p>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                    <p className="text-xs text-stone-500 mb-1">التقدير</p>
                    <p className="font-medium text-stone-800">
                      {student.grade}
                    </p>
                  </div>
                  <div className="flex items-center justify-center p-2">
                    <span
                      className={`w-full text-center px-2 py-1.5 rounded-lg text-xs font-bold ${getResultColor(
                        student.result
                      )}`}
                    >
                      {student.result}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block bg-white rounded-lg border border-stone-200 overflow-hidden">
            <table  ref={tableRef} className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    الاسم
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    المستوى
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    الدرجة الكلية
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    التقدير
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    النتيجة
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-stone-50 transition cursor-pointer"
                    onClick={() => openDetailModal(student)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-amber-700" />
                        </div>
                        <span className="font-medium text-stone-800">
                          {student.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {student.level_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-stone-800">
                        {student.total}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-stone-700">
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getResultColor(
                          student.result
                        )}`}
                      >
                        {student.result}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(student);
                          }}
                          className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(student.id);
                          }}
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
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">
              {editingStudent ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
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
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="أدخل اسم الطالب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  درجة النشاط (من 40)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="40"
                  value={formData.activity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activity: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  درجة الشفوي (من 80)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="80"
                  value={formData.oral}
                  onChange={(e) =>
                    setFormData({ ...formData, oral: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  درجة التحريري (من 120)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={formData.written}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      written: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-900 transition"
                >
                  {editingStudent ? "حفظ التعديلات" : "إضافة الطالب"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStudent(null);
                    setFormData({
                      full_name: "",
                      activity: 0,
                      oral: 0,
                      written: 0,
                    });
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

      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-stone-800 mb-6">
              تفاصيل الطالب
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-800">
                    {selectedStudent.full_name}
                  </h3>
                  <p className="text-stone-600">{selectedStudent.level_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-sm text-stone-600 mb-1">النشاط</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {selectedStudent.activity}
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-sm text-stone-600 mb-1">الشفوي</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {selectedStudent.oral}
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-sm text-stone-600 mb-1">التحريري</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {selectedStudent.written}
                  </p>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                  <p className="text-sm text-amber-700 mb-1">المجموع الكلي</p>
                  <p className="text-2xl font-bold text-amber-800">
                    {selectedStudent.total}
                  </p>
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-lg">
                <p className="text-sm text-stone-600 mb-1">التقدير</p>
                <p className="text-xl font-bold text-stone-800">
                  {selectedStudent.grade}
                </p>
              </div>

              <div className="bg-stone-50 p-4 rounded-lg">
                <p className="text-sm text-stone-600 mb-1">النتيجة</p>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold ${getResultColor(
                    selectedStudent.result
                  )}`}
                >
                  {selectedStudent.result}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 bg-stone-200 text-stone-700 py-2 rounded-lg hover:bg-stone-300 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="حذف الطالب؟"
        message="هل أنت متأكد أنك تريد حذف هذا الطالب؟"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </Layout>
  );
}

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
import { useAuth } from "../contexts/AuthContext";
import ExcelJS from "exceljs";
import Pagination from "../components/Pagination";
import { fetchAllPaginatedResults } from "../services/api";
interface Student {
  id: number;
  full_name: string;
  level_name: string;
  serial_number?: string | number;
  expenses?: number | null;
  books?: string | number | null;
  book_price?: number | null;
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
  const [formData, setFormData] = useState<{
    full_name: string;
    serial_number: string;
    expenses: number | string;
    books: string;
    book_price: number | string;
    activity: number | string;
    oral: number | string;
    written: number | string;
  }>({
    full_name: "",
    serial_number: "",
    expenses: 0,
    books: "",
    book_price: 0,
    activity: 0,
    oral: 0,
    written: 0,
  });

  const handleFocus = (field: "expenses" | "book_price" | "activity" | "oral" | "written") => {
    if (formData[field] === 0 || formData[field] === "0") {
      setFormData((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field: "expenses" | "book_price" | "activity" | "oral" | "written") => {
    if (formData[field] === "") {
      setFormData((prev) => ({ ...prev, [field]: 0 }));
    }
  };
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setCurrentPage(1);
    loadLevel();
    loadStudentsPDF();
  }, [levelId]);

  useEffect(() => {
    loadStudents(currentPage);
  }, [currentPage, levelId]);
  
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

  const loadStudents = async (page = 1) => {
    setLoading(true);
    try {
      if (levelId) {
        const response = await studentsAPI.getByLevel(parseInt(levelId), page);
        setStudents(response.data.results || []);
        setTotalCount(response.data.count || 0);
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
      const allStudents = await fetchAllPaginatedResults<Student>((page) =>
        studentsAPI.getByLevel(parseInt(levelId), page)
      );
      setStudentPDF(allStudents);
    } catch (error) {
      console.error("Failed to load PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serialNumber = formData.serial_number.trim();
    const booksValue = String(formData.books).trim();
    const payload = {
      full_name: formData.full_name,
      activity: Number(formData.activity) || 0,
      oral: Number(formData.oral) || 0,
      written: Number(formData.written) || 0,
      expenses: Number(formData.expenses) || 0,
      book_price: Number(formData.book_price) || 0,
      ...(serialNumber ? { serial_number: serialNumber } : {}),
      ...(booksValue ? { books: booksValue } : {}),
    };
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent.id, payload);
      } else {
        await studentsAPI.create(parseInt(levelId!), payload);
      }
      setShowModal(false);
      setFormData({ full_name: "", serial_number: "", expenses: 0, books: "", book_price: 0, activity: 0, oral: 0, written: 0 });
      setEditingStudent(null);
      loadStudents(currentPage);
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
      loadStudents(currentPage);
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
        serial_number: String(fullStudent.serial_number ?? ""),
        expenses: fullStudent.expenses ?? 0,
        books: String(fullStudent.books ?? ""),
        book_price: fullStudent.book_price ?? 0,
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
    setFormData({ full_name: "", serial_number: "", expenses: 0, books: "", book_price: 0, activity: 0, oral: 0, written: 0 });
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
    if (!studentPDF || studentPDF.length === 0) {
      console.warn("No PDF data available!");
      return;
    }

    const pdf = new jsPDF("l", "mm", "a4");
    const W = pdf.internal.pageSize.getWidth();   // 297mm
    const H = pdf.internal.pageSize.getHeight();  // 210mm

    // ── Fonts ────────────────────────────────────────
    pdf.addFileToVFS("Amiri-Regular.ttf", amiriRegular);
    pdf.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    if (amiriBold) {
      pdf.addFileToVFS("Amiri-Bold.ttf", amiriBold);
      pdf.addFont("Amiri-Bold.ttf", "Amiri", "bold");
    }

    // ── Background ───────────────────────────────────
    pdf.setFillColor(250, 247, 240);
    pdf.rect(0, 0, W, H, "F");

    // ── Border: single elegant frame ─────────────────
    pdf.setDrawColor(139, 90, 43);
    pdf.setLineWidth(0.8);
    pdf.rect(6, 6, W - 12, H - 12);

    // ── Header bar ───────────────────────────────────
    pdf.setFillColor(101, 62, 22);
    pdf.rect(6, 6, W - 12, 18, "F");

    pdf.setFont("Amiri", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(253, 245, 228);
    pdf.text("كشف درجات الطلاب", W / 2, 17, { align: "center" });

    // ── Level name ───────────────────────────────────
    pdf.setFont("Amiri", "bold");
    pdf.setFontSize(26);
    pdf.setTextColor(80, 45, 10);
    pdf.text(levelName, W / 2, 33, { align: "center" });


    // // ── Decorative line under level name ─────────────
    // const lineW = 80;
    // pdf.setDrawColor(180, 130, 60);
    // pdf.setLineWidth(0.4);
    // pdf.line(W / 2 - lineW, 37, W / 2 + lineW, 37);


    // ── Stats summary row ────────────────────────────
    const passed  = studentPDF.filter(s => s.result === "ناجح").length;
    const failed  = studentPDF.filter(s => s.result === "راسب").length;
    const total   = studentPDF.length;
    const avgScore = total > 0
      ? (studentPDF.reduce((a, s) => a + s.total, 0) / total).toFixed(1)
      : "0";

    const stats = [
      { label: "إجمالي الطلاب", value: String(total) },
      { label: "الناجحون",       value: String(passed), color: [30, 130, 60] },
      { label: "الراسبون",       value: String(failed), color: [200, 30, 30] },
      { label: "متوسط الدرجات", value: avgScore },
    ];

    const cardW = (270 - 8 * 3) / 4;
    const cardX0 = (W - 270) / 2;
    const cardY = 41;


    stats.forEach((s, i) => {
      const cx = cardX0 + i * (cardW + 8);
      pdf.setFillColor(244, 234, 210);
      pdf.roundedRect(cx, cardY, cardW, 16, 2, 2, "F");
      pdf.setDrawColor(200, 165, 100);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(cx, cardY, cardW, 16, 2, 2, "D");

      const [r, g, b] = s.color ?? [80, 45, 10];
      pdf.setFont("Amiri", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(r, g, b);
      pdf.text(s.value, cx + cardW / 2, cardY + 6.5, { align: "center" });

      pdf.setFont("Amiri", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(120, 90, 50);
      pdf.text(s.label, cx + cardW / 2, cardY + 12.5, { align: "center" });
    });

    // ── Main table ───────────────────────────────────
    autoTable(pdf, {
      startY: 62,
      head: [[
        "النتيجة", "التقدير", "المجموع",
        "التحريري", "الشفوي", "النشاط",
         "الاسم الكامل",
      ]],
      body: studentPDF.map(s => [
        s.result,
        s.grade,
        s.total,
        s.written  ?? 0,
        s.oral     ?? 0,
        s.activity ?? 0,
        s.full_name,
      ]),
      theme: "grid",
      styles: {
        font:        "Amiri",
        fontSize:    20,
        halign:      "center",
        valign:      "middle",
        cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
        lineColor:   [210, 175, 115],
        lineWidth:   0.25,
        textColor:   [55, 35, 12],
        fillColor:   [253, 249, 240],
        minCellHeight: 10,
      },
      headStyles: {
        fillColor:   [101, 62, 22],
        textColor:   [253, 245, 228],
        fontStyle:   "bold",
        halign:      "center",
        fontSize:    13,
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
        cellWidth: "wrap",
        overflow: "linebreak",
      },
      alternateRowStyles: {
        fillColor: [245, 234, 210],
      },
      columnStyles: {
        7: { halign: "right", fontStyle: "bold" }, // الاسم بس محاذاة يمين
        2: { fontStyle: "bold" }, // المجموع بولد بس
      },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 0) {
          const val = String(data.cell.raw ?? "").trim();
          if (val === "راسب" || val === "غائب") {
            data.cell.styles.textColor  = [185, 25, 25];
            data.cell.styles.fontStyle  = "bold";
            data.cell.styles.fillColor  = [255, 235, 235];
          } else if (val === "ناجح") {
            data.cell.styles.textColor  = [25, 120, 55];
            data.cell.styles.fontStyle  = "bold";
            data.cell.styles.fillColor  = [230, 250, 235];
          }
        }
      },
      didDrawPage(data) {
        // Re-draw border on every page
        pdf.setDrawColor(139, 90, 43);
        pdf.setLineWidth(0.8);
        pdf.rect(6, 6, W - 12, H - 12);

        // Footer
        pdf.setFont("Amiri", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(160, 120, 70);
        pdf.text(
          `صفحة ${data.pageNumber}`,
          W / 2, H - 9,
          { align: "center" }
        );
        // Footer line
        pdf.setDrawColor(200, 165, 100);
        pdf.setLineWidth(0.3);
        pdf.line(12, H - 13, W - 12, H - 13);
      },
      margin: { top: 62, left: 8, right: 8, bottom: 15 },
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    pdf.save(`${levelName}_تقرير_${dateStr.replace(/\//g, "-")}.pdf`);

  } catch (error) {
    console.error("Failed to export PDF:", error);
  } finally {
    setExporting(false);
  }
};

  const exportToExcel = async () => {
    if (!levelId) return;

    setExporting(true);
    try {
      if (studentPDF && studentPDF.length > 0) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("كشف الدرجات", {
          views: [{ rightToLeft: true }],
        });
        worksheet.columns = [
          { key: "full_name", width: 45 },
          { key: "level_name", width: 27 },
          { key: "serial_number", width: 20 },
          { key: "expenses", width: 18 },
          { key: "books", width: 18 },
          { key: "book_price", width: 18 },
          { key: "activity", width: 18 },
          { key: "oral", width: 18 },
          { key: "written", width: 18 },
          { key: "total", width: 18 },
          { key: "grade", width: 22 },
          { key: "result", width: 18 },
        ];

        const thinBorder = {
          top: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FFC8A564" } },
          bottom: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FFC8A564" } },
          left: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FFC8A564" } },
          right: { style: "thin" as ExcelJS.BorderStyle, color: { argb: "FFC8A564" } },
        };
        worksheet.mergeCells("A1:L1");
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "كشف درجات الطلاب";
        titleCell.font = {
          name: "Times New Roman",
          bold: true,
          size: 32,
          color: { argb: "FFFDF8EB" },
        };
        titleCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF8B5A2B" },
        };
        titleCell.alignment = {
          horizontal: "center",
          vertical: "middle",
          readingOrder: "rtl",
        };
        worksheet.getRow(1).height = 50;
        worksheet.mergeCells("A2:L2");
        const levelCell = worksheet.getCell("A2");
        levelCell.value = levelName;
        levelCell.font = {
          name: "Times New Roman",
          bold: true,
          size: 27,
          color: { argb: "FF8B5A2B" },
        };
        levelCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0E0B8" },
        };
        levelCell.alignment = {
          horizontal: "center",
          vertical: "middle",
          readingOrder: "rtl",
        };
        worksheet.getRow(2).height = 40;
        const headers = [
          "الاسم",
          "المستوى",
          "رقم الايصال",
          "المصروفات",
          "الكتب",
          "سعر الكتب",
          "النشاط",
          "الشفوي",
          "التحريري",
          "المجموع",
          "التقدير",
          "النتيجة",
        ];
        const headerRow = worksheet.addRow(headers);
        headerRow.height = 38;
        headerRow.eachCell((cell) => {
          cell.font = {
            name: "Times New Roman",
            bold: true,
            size: 22,
            color: { argb: "FFFDF8EB" },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF8B5A2B" },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            readingOrder: "rtl",
          };
          cell.border = thinBorder;
        });

        studentPDF.forEach((s, index) => {
          const rowData = [
            s.full_name,
            s.level_name,
            s.serial_number ?? "-",
            s.expenses ?? "-",
            s.books ?? "-",
            s.book_price ?? "-",
            s.activity || 0,
            s.oral || 0,
            s.written || 0,
            s.total,
            s.grade,
            s.result,
          ];

          const row = worksheet.addRow(rowData);
          row.height = 32;
          const fillColor = index % 2 === 0 ? "FFFDF8EB" : "FFF5EBD2";

          row.eachCell((cell, colNumber) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: fillColor },
            };
            cell.alignment = {
              horizontal: "center",
              vertical: "middle",
              readingOrder: "rtl",
            };
            cell.font = { name: "Times New Roman", size: 18, bold: true };
            cell.border = thinBorder;
            if (colNumber === 1) {
              cell.alignment = {
                horizontal: "right",
                vertical: "middle",
                readingOrder: "rtl",
              };
              cell.font = { name: "Times New Roman", bold: true, size: 18 };
            }

            if (colNumber === 12) {
              const val = String(s.result).trim();
              if (val === "راسب" || val === "غائب") {
                cell.font = {
                  name: "Times New Roman",
                  bold: true,
                  size: 18,
                  color: { argb: "FFC81E1E" },
                };
              } else if (val === "ناجح") {
                cell.font = {
                  name: "Times New Roman",
                  bold: true,
                  size: 18,
                  color: { argb: "FF1E8240" },
                };
              }
            }
          });
        });

        const totalExpenses = studentPDF.reduce(
          (sum, student) => sum + (Number(student.expenses) || 0),
          0
        );
        const totalBooksPrice = studentPDF.reduce(
          (sum, student) => sum + (Number(student.book_price) || 0),
          0
        );

        const summaryRow = worksheet.addRow([
          "الإجمالي",
          "",
          "",
          totalExpenses,
          "",
          totalBooksPrice,
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
        summaryRow.height = 34;
        summaryRow.eachCell((cell, colNumber) => {
          cell.border = thinBorder;
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEBD8B1" },
          };
          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            readingOrder: "rtl",
          };
          cell.font = {
            name: "Times New Roman",
            size: 19,
            bold: true,
            color: { argb: "FF4A2A0B" },
          };

          if (colNumber === 1) {
            cell.alignment = {
              horizontal: "right",
              vertical: "middle",
              readingOrder: "rtl",
            };
          }
        });
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${levelName}_تقرير.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        console.warn("No data available!");
      }
    } catch (error) {
      console.error("Failed to export Excel:", error);
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

  const isAdmin = true;
  const ExportisAdmin = user?.role === "admin";
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
            <div className="relative">
              {ExportisAdmin && students.length > 0 && (
                <>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={exporting}
                    className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <FileDown className="w-5 h-5" />
                    <span>{exporting ? "جاري التصدير..." : "تصدير"}</span>
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-lg shadow-lg z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          exportToPDF();
                        }}
                        disabled={exporting}
                        className="w-full text-right px-4 py-3 hover:bg-stone-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        📄 تصدير PDF
                      </button>

                      <button
                        onClick={() => {
                          setShowExportMenu(false);
                          exportToExcel();
                        }}
                        disabled={exporting}
                        className="w-full text-right px-4 py-3 hover:bg-stone-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        📊 تصدير Excel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

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
                      <p className="text-xs text-stone-500 mt-1">
                        رقم الايصال: {student.serial_number ?? "-"}
                      </p>
                      <p className="text-xs text-stone-500">
                        المصروفات: {student.expenses ?? "-"}
                      </p>
                      <p className="text-xs text-stone-500">
                        الكتب: {student.books ?? "-"}
                      </p>
                      <p className="text-xs text-stone-500">
                        سعر الكتب: {student.book_price ?? "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 bg-stone-50 rounded-lg p-1">
                    {isAdmin && (
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
                    )}
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
            <table ref={tableRef} className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    الاسم
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    المستوى
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    رقم الايصال
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    المصروفات
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    الكتب
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-stone-700">
                    سعر الكتب
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
                    <td className="px-6 py-4 text-stone-600">
                      {student.serial_number ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {student.expenses ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {student.books ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {student.book_price ?? "-"}
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
                      {isAdmin && (
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-stone-800 mb-4 sm:mb-6">
              {editingStudent ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  رقم الايصال
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="أدخل رقم الايصال"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  المصروفات
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.expenses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expenses: e.target.value,
                    })
                  }
                  onFocus={() => handleFocus("expenses")}
                  onBlur={() => handleBlur("expenses")}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="أدخل المصروفات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  الكتب
                </label>
                <input
                  type="text"
                  value={formData.books}
                  onChange={(e) =>
                    setFormData({ ...formData, books: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="أدخل الكتب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  سعر الكتب
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.book_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      book_price: e.target.value,
                    })
                  }
                  onFocus={() => handleFocus("book_price")}
                  onBlur={() => handleBlur("book_price")}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="أدخل سعر الكتب"
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
                      activity: e.target.value,
                    })
                  }
                  onFocus={() => handleFocus("activity")}
                  onBlur={() => handleBlur("activity")}
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
                    setFormData({ ...formData, oral: e.target.value })
                  }
                  onFocus={() => handleFocus("oral")}
                  onBlur={() => handleBlur("oral")}
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
                      written: e.target.value,
                    })
                  }
                  onFocus={() => handleFocus("written")}
                  onBlur={() => handleBlur("written")}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 sticky bottom-0 bg-white pt-4 pb-1 border-t border-stone-100 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-stone-800 text-white py-2.5 rounded-lg hover:bg-stone-900 transition"
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
                      serial_number: "",
                      expenses: 0,
                      books: "",
                      book_price: 0,
                      activity: 0,
                      oral: 0,
                      written: 0,
                    });
                  }}
                  className="flex-1 bg-stone-200 text-stone-700 py-2.5 rounded-lg hover:bg-stone-300 transition"
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
                  <p className="text-sm text-stone-600 mb-1">رقم الايصال</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {selectedStudent.serial_number ?? "-"}
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-sm text-stone-600 mb-1">المصروفات</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {selectedStudent.expenses ?? "-"}
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-sm text-stone-600 mb-1">الكتب</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {selectedStudent.books ?? "-"}
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-sm text-stone-600 mb-1">سعر الكتب</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {selectedStudent.book_price ?? "-"}
                  </p>
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

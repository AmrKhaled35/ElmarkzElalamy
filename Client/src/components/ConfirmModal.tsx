interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export default function ConfirmModal({
  isOpen,
  title = "تأكيد الحذف",
  message = "هل أنت متأكد من تنفيذ هذا الإجراء؟",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-3">{title}</h2>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}
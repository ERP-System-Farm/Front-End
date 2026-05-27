import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2, 
  Eye, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Plus, 
  Briefcase, 
  Activity, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  User,
  Users,
  Bell,
  Notebook,
  Shield,
  FileCheck,
  UploadCloud,
  Download
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../../components/ui/dialog";
import api from '../../services/api';

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [workers, setWorkers] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Expanded Table Row state
  const [expandedWorkerId, setExpandedWorkerId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [workerTypeFilter, setWorkerTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    setSearchQuery('');
    setWorkerTypeFilter('ALL');
    setStatusFilter('ALL');
    setDeptFilter('ALL');
    setCurrentPage(1);
    setExpandedWorkerId(null);
    setExpandedEmployeeId(null);
  };

  // New Worker Dialog
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [newWorker, setNewWorker] = useState({
    name: '',
    worker_type: 'COMPANY',
    contractor: '',
    salary_type: 'MONTHLY',
    base_salary: '3000',
    working_hours_per_day: '8',
    national_id: '',
    address: '',
    hire_date: new Date().toISOString().split('T')[0],
    badge_number: '',
    notes: ''
  });

  // Edit Worker Dialog
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  // Worker Detail Modal
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [detailedWorker, setDetailedWorker] = useState(null);

  // Staff & Employees states
  const [employees, setEmployees] = useState([]);
  const [detailedEmployee, setDetailedEmployee] = useState(null);
  const [openEmployeeDetailDialog, setOpenEmployeeDetailDialog] = useState(false);
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false);
  const [selectedEmployeeForDoc, setSelectedEmployeeForDoc] = useState(null);
  const [newDocForm, setNewDocForm] = useState({
    document_type: 'national_id',
    document_file: null,
    issue_date: '',
    expiry_date: '',
    notes: ''
  });
  const [openAddPayrollCompDialog, setOpenAddPayrollCompDialog] = useState(false);
  const [selectedEmployeeForComp, setSelectedEmployeeForComp] = useState(null);
  const [newPayrollCompForm, setNewPayrollCompForm] = useState({
    type: 'ALLOWANCE',
    name: '',
    amount: '',
  });

  // Add Employee Form States
  const [openAddEmployeeDialog, setOpenAddEmployeeDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    user: '',
    hire_date: new Date().toISOString().split('T')[0],
    department: 'الإدارة الهندسية',
    position: 'مهندس زراعي',
    monthly_salary: '5000',
    standard_work_hours: '8',
    status: 'active',
    notes: ''
  });

  // Edit & Expand Employee States
  const [openEditEmployeeDialog, setOpenEditEmployeeDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);

  const toggleEmployeeRowExpansion = (empId) => {
    setExpandedEmployeeId(expandedEmployeeId === empId ? null : empId);
  };

  // Direct Transaction (Deduction/Overtime) Dialog State
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [transactionWorker, setTransactionWorker] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    transaction_type: 'OVERTIME',
    hours: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Hybrid review resolution state
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionAction, setResolutionAction] = useState({}); // { [reviewId]: { action: 'link' | 'create', value: '' } }
  
  // Hybrid New Worker complete profile Resolution Dialog
  const [openResolveNewWorkerDialog, setOpenResolveNewWorkerDialog] = useState(false);
  const [selectedReviewForCreation, setSelectedReviewForCreation] = useState(null);
  const [resolveNewWorkerForm, setResolveNewWorkerForm] = useState({
    name: '',
    worker_type: 'COMPANY',
    contractor_id: '',
    monthly_salary: '3000',
    national_id: '',
    address: '',
    hire_date: new Date().toISOString().split('T')[0],
    standard_work_hours: '8',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, contractorsRes, reviewsRes, employeesRes] = await Promise.all([
        api.get('/hr/workers/'),
        api.get('/reports/contractors/').catch(() => ({ data: [] })), 
        api.get('/hr/reviews/?resolved=false'),
        api.get('/hr/employees/').catch(() => ({ data: [] }))
      ]);
      setWorkers(Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data.results || []));
      setContractors(Array.isArray(contractorsRes.data) ? contractorsRes.data : (contractorsRes.data.results || []));
      setPendingReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : (reviewsRes.data.results || []));
      setEmployees(Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data.results || []));
    } catch (err) {
      console.error("Failed to load HR data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      const res = await api.get('/hr/available-users/');
      setAvailableUsers(res.data);
      if (res.data.length > 0) {
        setNewEmployee(prev => ({ ...prev, user: res.data[0].id }));
      } else {
        setNewEmployee(prev => ({ ...prev, user: '' }));
      }
    } catch (err) {
      console.error("Failed to fetch available users", err);
    }
  };

  const handleCreateEmployee = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        user: newEmployee.user,
        hire_date: newEmployee.hire_date || null,
        department: newEmployee.department,
        position: newEmployee.position,
        monthly_salary: parseFloat(newEmployee.monthly_salary) || 0,
        standard_work_hours: parseInt(newEmployee.standard_work_hours, 10) || 8,
        status: newEmployee.status,
        notes: newEmployee.notes
      };

      await api.post('/hr/employees/', payload);
      setOpenAddEmployeeDialog(false);
      setNewEmployee({
        user: '',
        hire_date: new Date().toISOString().split('T')[0],
        department: 'الإدارة الهندسية',
        position: 'مهندس زراعي',
        monthly_salary: '5000',
        standard_work_hours: '8',
        status: 'active',
        notes: ''
      });
      setSuccessMessage('تم تسجيل الموظف الرسمي بنجاح في النظام!');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchData();
    } catch (err) {
      setFormError('حدث خطأ أثناء إضافة الموظف. الرجاء التأكد من اختيار حساب مستخدم صحيح وإدخال جميع الحقول المطلوبة.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEditEmployeeDialog = (emp) => {
    setEditingEmployee({
      ...emp,
      monthly_salary: parseFloat(emp.monthly_salary) || 0,
      standard_work_hours: parseInt(emp.standard_work_hours, 10) || 8,
    });
    setOpenEditEmployeeDialog(true);
  };

  const handleUpdateEmployee = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        user: editingEmployee.user,
        hire_date: editingEmployee.hire_date || null,
        department: editingEmployee.department,
        position: editingEmployee.position,
        monthly_salary: parseFloat(editingEmployee.monthly_salary) || 0,
        standard_work_hours: parseInt(editingEmployee.standard_work_hours, 10) || 8,
        status: editingEmployee.status,
        notes: editingEmployee.notes
      };

      await api.put(`/hr/employees/${editingEmployee.id}/`, payload);
      setOpenEditEmployeeDialog(false);
      setEditingEmployee(null);
      setSuccessMessage('تم تحديث بيانات الموظف بنجاح!');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchData();
    } catch (err) {
      setFormError('حدث خطأ أثناء تعديل بيانات الموظف. الرجاء التأكد من صحة المدخلات.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEmployee = async (empId, empName) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الموظف (${empName}) نهائياً من ملفات الموارد البشرية؟`)) {
      return;
    }
    try {
      await api.delete(`/hr/employees/${empId}/`);
      setSuccessMessage('تم حذف الموظف بنجاح من النظام.');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchData();
    } catch (err) {
      alert("فشل حذف الموظف. قد يكون مرتبطاً بمعاملات تشغيلية أو مالية في النظام.");
    }
  };

  const handleCreateWorker = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        name: newWorker.name,
        worker_type: newWorker.worker_type,
        contractor: newWorker.worker_type === 'CONTRACTOR' && newWorker.contractor ? newWorker.contractor : null,
        monthly_salary: parseFloat(newWorker.base_salary) || 0,
        standard_work_hours: parseInt(newWorker.working_hours_per_day, 10) || 8,
        national_id: newWorker.national_id,
        address: newWorker.address,
        hire_date: newWorker.hire_date || null,
        badge_number: newWorker.badge_number,
        notes: newWorker.notes
      };

      await api.post('/hr/workers/', payload);
      setOpenAddDialog(false);
      setNewWorker({
        name: '',
        worker_type: 'COMPANY',
        contractor: '',
        salary_type: 'MONTHLY',
        base_salary: '3000',
        working_hours_per_day: '8',
        national_id: '',
        address: '',
        hire_date: new Date().toISOString().split('T')[0],
        badge_number: '',
        notes: ''
      });
      setSuccessMessage('تم تسجيل العامل الجديد بنجاح في ملفات الموارد البشرية!');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchData();
    } catch (err) {
      setFormError('حدث خطأ أثناء إضافة العامل. يرجى مراجعة البيانات المدخلة.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEditDialog = (worker) => {
    setEditingWorker({
      ...worker,
      base_salary: worker.monthly_salary,
      working_hours_per_day: worker.standard_work_hours,
      contractor: worker.contractor || ''
    });
    setOpenEditDialog(true);
  };

  const handleUpdateWorker = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        name: editingWorker.name,
        worker_type: editingWorker.worker_type,
        contractor: editingWorker.worker_type === 'CONTRACTOR' && editingWorker.contractor ? editingWorker.contractor : null,
        monthly_salary: parseFloat(editingWorker.base_salary) || 0,
        standard_work_hours: parseInt(editingWorker.working_hours_per_day, 10) || 8,
        national_id: editingWorker.national_id,
        address: editingWorker.address,
        hire_date: editingWorker.hire_date || null,
        badge_number: editingWorker.badge_number,
        notes: editingWorker.notes,
        status: editingWorker.status
      };

      await api.put(`/hr/workers/${editingWorker.id}/`, payload);
      setOpenEditDialog(false);
      setEditingWorker(null);
      setSuccessMessage('تم تحديث بيانات العامل بنجاح!');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchData();
    } catch (err) {
      setFormError('حدث خطأ أثناء تعديل بيانات العامل. الرجاء المحاولة مرة أخرى.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteWorker = async (workerId, workerName) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف العامل (${workerName}) نهائياً من ملفات الموارد البشرية؟`)) {
      return;
    }
    try {
      await api.delete(`/hr/workers/${workerId}/`);
      setSuccessMessage('تم حذف العامل بنجاح من النظام.');
      setTimeout(() => setSuccessMessage(''), 4000);
      fetchData();
    } catch (err) {
      alert("فشل حذف العامل. قد يكون مرتبطاً بسجلات تشغيلية أو مالية في النظام.");
    }
  };

  const handleOpenTransactionDialog = (worker) => {
    setTransactionWorker(worker);
    setTransactionForm({
      transaction_type: 'OVERTIME',
      hours: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setFormError('');
    setOpenTransactionDialog(true);
  };

  const handleCreateTransaction = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        worker: transactionWorker.id,
        transaction_type: transactionForm.transaction_type,
        hours: parseFloat(transactionForm.hours) || 0,
        amount: parseFloat(transactionForm.amount) || 0,
        date: transactionForm.date,
        notes: transactionForm.notes,
        status: 'APPROVED'
      };

      await api.post('/hr/transactions/', payload);
      setOpenTransactionDialog(false);
      setTransactionWorker(null);
      setSuccessMessage('تم تسجيل الحركة المالية (الخصم/الإضافي) بنجاح!');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || err.response?.data?.period || 'فشلت إضافة الحركة المالية. تأكد من وجود فترة رواتب مفتوحة وصلاحية التاريخ.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResolveReview = async (reviewId) => {
    const config = resolutionAction[reviewId];
    if (!config || !config.action) {
      alert("الرجاء اختيار نوع الإجراء أولاً");
      return;
    }
    
    const review = pendingReviews.find(r => r.id === reviewId);

    if (config.action === 'link') {
      if (!config.value) {
        alert("الرجاء اختيار العامل المراد الربط به");
        return;
      }
      setResolvingId(reviewId);
      try {
        const payload = {
          create_new: false,
          worker_id: config.value
        };
        await api.post(`/hr/reviews/${reviewId}/resolve/`, payload);
        setSuccessMessage('تم ربط واعتماد تسجيل العامل بنجاح مع الملف المختار!');
        setTimeout(() => setSuccessMessage(''), 5500);
        fetchData();
      } catch (err) {
        alert("فشل ربط العامل. الرجاء المحاولة مرة أخرى.");
      } finally {
        setResolvingId(null);
      }
    } else if (config.action === 'create') {
      // Open complete profile dialogue pre-filled with the field fallback name
      setSelectedReviewForCreation(review);
      setResolveNewWorkerForm({
        name: review.worker_name_fallback || '',
        worker_type: config.value || 'COMPANY',
        contractor_id: '',
        monthly_salary: '3000',
        national_id: '',
        address: '',
        hire_date: review.labor_entry_report_date || new Date().toISOString().split('T')[0],
        standard_work_hours: '8',
        notes: `مسجل تلقائياً عبر مراجعة التسجيل الهجين من التقرير الميداني`
      });
      setOpenResolveNewWorkerDialog(true);
    }
  };

  const handleResolveWithCompleteProfile = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        create_new: true,
        name: resolveNewWorkerForm.name,
        worker_type: resolveNewWorkerForm.worker_type,
        contractor_id: resolveNewWorkerForm.worker_type === 'CONTRACTOR' && resolveNewWorkerForm.contractor_id ? resolveNewWorkerForm.contractor_id : null,
        monthly_salary: parseFloat(resolveNewWorkerForm.monthly_salary) || 0,
        national_id: resolveNewWorkerForm.national_id,
        address: resolveNewWorkerForm.address,
        hire_date: resolveNewWorkerForm.hire_date || null,
        standard_work_hours: parseInt(resolveNewWorkerForm.standard_work_hours, 10) || 8,
        notes: resolveNewWorkerForm.notes
      };

      await api.post(`/hr/reviews/${selectedReviewForCreation.id}/resolve/`, payload);
      setOpenResolveNewWorkerDialog(false);
      setSelectedReviewForCreation(null);
      setSuccessMessage('تم إنشاء وتفعيل ملف العامل الجديد بالكامل وتسوية التسجيل الهجين بنجاح!');
      setTimeout(() => setSuccessMessage(''), 6000);
      fetchData();
    } catch (err) {
      setFormError('فشل إنشاء وتسجيل العامل. تأكد من إدخال رقم البطاقة وجميع الحقول بشكل صحيح.');
    } finally {
      setFormLoading(false);
    }
  };

  const updateResolutionState = (reviewId, field, val) => {
    setResolutionAction(prev => ({
      ...prev,
      [reviewId]: {
        ...prev[reviewId],
        [field]: val
      }
    }));
  };

  const toggleRowExpansion = (workerId) => {
    if (expandedWorkerId === workerId) {
      setExpandedWorkerId(null);
    } else {
      setExpandedWorkerId(workerId);
    }
  };

  const handleShowWorkerProfile = (worker) => {
    setDetailedWorker(worker);
    setOpenDetailDialog(true);
  };

  const translateDocType = (type) => {
    switch (type) {
      case 'national_id': return 'بطاقة الرقم القومي';
      case 'academic_certificate': return 'مؤهل دراسي / شهادة تخرج';
      case 'training_certificate': return 'شهادة تدريبية أو خبرة';
      case 'contract': return 'عقد عمل معتمد';
      default: return 'مستند آخر';
    }
  };

  const handleUploadDocument = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const formData = new FormData();
      formData.append("employee", selectedEmployeeForDoc.id);
      formData.append("document_type", newDocForm.document_type);
      formData.append("document_file", newDocForm.document_file);
      if (newDocForm.issue_date) formData.append("issue_date", newDocForm.issue_date);
      if (newDocForm.expiry_date) formData.append("expiry_date", newDocForm.expiry_date);
      if (newDocForm.notes) formData.append("notes", newDocForm.notes);

      await api.post('/hr/documents/', formData);
      setOpenAddDocDialog(false);
      setNewDocForm({
        document_type: 'national_id',
        document_file: null,
        issue_date: '',
        expiry_date: '',
        notes: ''
      });
      setSuccessMessage('تم رفع وثيقة الموظف بنجاح!');
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Refresh
      const employeesRes = await api.get('/hr/employees/');
      const updatedEmployees = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data.results || []);
      setEmployees(updatedEmployees);
      
      const updatedEmp = updatedEmployees.find(e => e.id === selectedEmployeeForDoc.id);
      setDetailedEmployee(updatedEmp);
    } catch (err) {
      setFormError('حدث خطأ أثناء رفع الملف. الرجاء التأكد من إدخال جميع الحقول وصحة الملف.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifyDocument = async (docId, isVerified) => {
    try {
      await api.post(`/hr/documents/${docId}/verify/`, { is_verified: isVerified });
      setSuccessMessage(isVerified ? 'تم اعتماد الوثيقة الرسمية بنجاح!' : 'تم إلغاء اعتماد الوثيقة.');
      setTimeout(() => setSuccessMessage(''), 4000);
      
      // Refresh list
      const employeesRes = await api.get('/hr/employees/');
      const updatedEmployees = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data.results || []);
      setEmployees(updatedEmployees);
      
      if (detailedEmployee) {
        const updatedEmp = updatedEmployees.find(e => e.id === detailedEmployee.id);
        setDetailedEmployee(updatedEmp);
      }
    } catch (err) {
      alert("فشل تحديث حالة اعتماد المستند.");
    }
  };

  const handleCreatePayrollComponent = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        employee: selectedEmployeeForComp.id,
        type: newPayrollCompForm.type,
        name: newPayrollCompForm.name,
        amount: parseFloat(newPayrollCompForm.amount) || 0,
        is_recurring: newPayrollCompForm.is_recurring
      };

      await api.post('/hr/payroll-components/', payload);
      setOpenAddPayrollCompDialog(false);
      setNewPayrollCompForm({
        type: 'ALLOWANCE',
        name: '',
        amount: '',
        is_recurring: true
      });
      setSuccessMessage('تم إضافة البند المالي للرواتب بنجاح!');
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Refresh list
      const employeesRes = await api.get('/hr/employees/');
      const updatedEmployees = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data.results || []);
      setEmployees(updatedEmployees);
      
      const updatedEmp = updatedEmployees.find(e => e.id === selectedEmployeeForComp.id);
      setDetailedEmployee(updatedEmp);
    } catch (err) {
      setFormError('حدث خطأ أثناء إضافة البند المالي. تأكد من إدخال اسم البند والقيمة بشكل صحيح.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePayrollComponent = async (compId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا البند المالي نهائياً؟")) {
      return;
    }
    try {
      await api.delete(`/hr/payroll-components/${compId}/`);
      setSuccessMessage('تم حذف البند المالي بنجاح.');
      setTimeout(() => setSuccessMessage(''), 4000);
      
      // Refresh list
      const employeesRes = await api.get('/hr/employees/');
      const updatedEmployees = Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data.results || []);
      setEmployees(updatedEmployees);
      
      if (detailedEmployee) {
        const updatedEmp = updatedEmployees.find(e => e.id === detailedEmployee.id);
        setDetailedEmployee(updatedEmp);
      }
    } catch (err) {
      alert("فشل حذف البند المالي.");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 text-right atls-page-enter" dir="rtl">
      
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight leading-tight">
            <span className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0">
              <Users className="h-6 w-6" />
            </span>
            نظام عمال وموظفي الميدان (HR)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 ms-[52px] font-medium leading-relaxed">
            إدارة عمالة الشركة الأساسية وعمالة المقاولين، تتبع الملفات الشخصية الكاملة، وربط وتصفية التسجيل الميداني الهجين.
          </p>
        </div>
        <div className="flex-shrink-0">
          {activeTab === 2 ? (
          <button
            onClick={() => {
              fetchAvailableUsers();
              setOpenAddEmployeeDialog(true);
            }}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <UserPlus className="h-4 w-4" />
            إضافة موظف جديد
          </button>
          ) : (
          <button
            onClick={() => setOpenAddDialog(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            <UserPlus className="h-4 w-4" />
            إضافة عامل جديد يدوياً
          </button>
          )}
        </div>
      </div>

      {/* ── Success Alert ─────────────────────────────────────── */}
      {successMessage && (
        <div className="mb-6 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* ── Navigation Tabs ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 mb-6 flex w-full">
        <button
          onClick={() => handleTabChange(0)}
          className={`flex-1 py-3 text-center text-sm font-bold rounded-lg transition-all ${
            activeTab === 0 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          سجل عمالة الميدان اليومية
        </button>
        <button
          onClick={() => handleTabChange(2)}
          className={`flex-1 py-3 text-center text-sm font-bold rounded-lg transition-all ${
            activeTab === 2 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          سجل المهندسين والموظفين الرسميين (Staff)
        </button>
        <button
          onClick={() => handleTabChange(1)}
          className={`flex-1 py-3 text-center text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 1 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span>إشعارات مراجعة التسجيل الهجين</span>
          {pendingReviews.length > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-black">
              {pendingReviews.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <span className="text-sm font-medium text-slate-500">جاري تحميل السجلات الميدانية...</span>
        </div>
      ) : (
        <div>
          {/* TAB 0: Workers Registry */}
          {activeTab === 0 && (() => {
            const filteredWorkers = workers.filter(worker => {
              const matchesSearch = 
                worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (worker.badge_number && worker.badge_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (worker.national_id && worker.national_id.toLowerCase().includes(searchQuery.toLowerCase()));

              const matchesType = 
                workerTypeFilter === 'ALL' || 
                worker.worker_type === workerTypeFilter;

              const matchesStatus = 
                statusFilter === 'ALL' || 
                ((statusFilter === 'ACTIVE') && (worker.status === 'active' || worker.status === 'ACTIVE' || worker.is_active)) ||
                ((statusFilter === 'INACTIVE') && (worker.status !== 'active' && worker.status !== 'ACTIVE' && !worker.is_active));

              return matchesSearch && matchesType && matchesStatus;
            }).sort((a, b) => {
              if (a.created_at && b.created_at) {
                return new Date(b.created_at) - new Date(a.created_at);
              }
              return b.id.localeCompare(a.id);
            });

            const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
            const activePage = Math.min(currentPage, totalPages || 1);
            const startIndex = (activePage - 1) * itemsPerPage;
            const paginatedWorkers = filteredWorkers.slice(startIndex, startIndex + itemsPerPage);

            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-150 pb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">سجل عمال وموظفي الشركة والمقاولين</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">يظهر كحد أقصى {itemsPerPage} صفوف بالصفحة الواحدة لتسهيل العرض والمتابعة.</p>
                  </div>
                  
                  {/* Premium Filter controls */}
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search Field */}
                    <div className="relative flex-1 md:flex-initial min-w-[240px]">
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث بالاسم، الكود، الرقم القومي..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pr-10 pl-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-right"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                          className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Type Filter */}
                    <select
                      value={workerTypeFilter}
                      onChange={(e) => {
                        setWorkerTypeFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="ALL">جميع أنواع التوظيف</option>
                      <option value="COMPANY">عمالة شركة</option>
                      <option value="CONTRACTOR">عمالة مقاول</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="ALL">جميع الحالات</option>
                      <option value="ACTIVE">النشطين فقط</option>
                      <option value="INACTIVE">المعطلين فقط</option>
                    </select>
                  </div>
                </div>
                
                {workers.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-semibold text-sm">لا يوجد عمال مسجلين في النظام حالياً.</p>
                  </div>
                ) : filteredWorkers.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-semibold text-sm">لم يتم العثور على أي نتائج تطابق خيارات التصفية أو البحث المحددة.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-3 w-12"></th>
                            <th className="p-3">اسم العامل (اضغط لفتح الملف)</th>
                            <th className="p-3">رقم البادج</th>
                            <th className="p-3">نوع التوظيف</th>
                            <th className="p-3">المقاول التابع له</th>
                            <th className="p-3">الراتب الأساسي</th>
                            <th className="p-3">الأجر بالساعة</th>
                            <th className="p-3">الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedWorkers.map((worker) => {
                            const isExpanded = expandedWorkerId === worker.id;
                            return (
                              <React.Fragment key={worker.id}>
                                <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                                  <td className="p-3 text-center">
                                    <button 
                                      onClick={() => toggleRowExpansion(worker.id)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-600"
                                    >
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    <button 
                                      onClick={() => handleShowWorkerProfile(worker)}
                                      className="font-bold text-emerald-600 hover:text-emerald-800 underline transition-all text-right"
                                    >
                                      {worker.name}
                                    </button>
                                  </td>
                                  <td className="p-3 text-slate-600 font-medium">
                                    {worker.badge_number || 'غير متوفر'}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                      worker.worker_type === 'COMPANY' 
                                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                        : 'bg-purple-50 text-purple-700 border border-purple-100'
                                    }`}>
                                      {worker.worker_type === 'COMPANY' ? 'موظف شركة' : 'عامل مقاول'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-600 font-medium">
                                    {worker.contractor_name || '-'}
                                  </td>
                                  <td className="p-3 font-bold text-emerald-700">
                                    {worker.monthly_salary} ج.م
                                  </td>
                                  <td className="p-3 font-bold text-slate-700">
                                    {worker.hourly_rate} ج.م/س
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                      worker.status === 'active' || worker.status === 'ACTIVE' || worker.is_active 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-slate-100 text-slate-800'
                                    }`}>
                                      {worker.status === 'active' || worker.status === 'ACTIVE' || worker.is_active ? 'نشط' : 'غير نشط'}
                                    </span>
                                  </td>
                                </tr>
                                
                                {/* Expandable Panel */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={8} className="p-4 bg-slate-50 border-b border-slate-200">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex flex-wrap gap-6 items-center">
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                                            <span className="text-xs font-bold">الإضافي الحالي:</span>
                                            <span className="text-sm font-black text-emerald-600">
                                              +{worker.total_overtime || 0} ج.م
                                              {worker.total_overtime_hours > 0 && (
                                                <span className="text-[10px] font-semibold text-emerald-500 mr-1">({worker.total_overtime_hours} س)</span>
                                              )}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            <TrendingDown className="h-4 w-4 text-rose-600" />
                                            <span className="text-xs font-bold">الخصومات الحالية:</span>
                                            <span className="text-sm font-black text-rose-600">
                                              -{worker.total_deductions || 0} ج.م
                                              {worker.total_deductions_hours > 0 && (
                                                <span className="text-[10px] font-semibold text-rose-500 mr-1">({worker.total_deductions_hours} س)</span>
                                              )}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                            <DollarSign className="h-4 w-4 text-emerald-700" />
                                            <span className="text-xs font-bold text-slate-800">صافي المستحق:</span>
                                            <span className="text-sm font-black text-emerald-700">{worker.net_salary || worker.monthly_salary} ج.م</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                          <button
                                            onClick={() => handleOpenTransactionDialog(worker)}
                                            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                                          >
                                            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                                            خصم / إضافي مباشر
                                          </button>
                                          <button
                                            onClick={() => handleShowWorkerProfile(worker)}
                                            className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                            كل التفاصيل
                                          </button>
                                          <button
                                            onClick={() => handleOpenEditDialog(worker)}
                                            className="flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                          >
                                            <Edit2 className="h-3.5 w-3.5" />
                                            تعديل
                                          </button>
                                          <button
                                            onClick={() => handleDeleteWorker(worker.id, worker.name)}
                                            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            حذف
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t border-slate-100 pt-4" dir="rtl">
                        <div className="text-xs text-slate-500 font-semibold">
                          عرض {startIndex + 1} إلى {Math.min(startIndex + itemsPerPage, filteredWorkers.length)} من أصل {filteredWorkers.length} عامل
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            disabled={activePage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            السابق
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                activePage === page 
                                  ? 'bg-emerald-600 text-white shadow-md' 
                                  : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          
                          <button
                            disabled={activePage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            التالي
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}

          {/* TAB 1: Hybrid Registration */}
          {activeTab === 1 && (
            <div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm font-semibold mb-6 flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">تسوية ومراجعة الأسماء اليدوية من الميدان</h4>
                  <p className="font-medium text-xs text-amber-700 leading-relaxed">
                    هنا تظهر الأسماء التي أدخلها المهندسون يدوياً لعدم العثور عليها في القوائم. كمسؤول موارد بشرية، يمكنك ربط هذه السجلات بعمال مسجلين فعلياً لتسجيل يومياتهم ماليًا، أو استكمال بياناتهم بالكامل وتسجيلهم كعمال دائمين بالنظام.
                  </p>
                </div>
              </div>

              {pendingReviews.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                  <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
                  <h3 className="text-lg font-extrabold text-slate-800">جميع الأسماء اليدوية مسواة بالكامل!</h3>
                  <p className="text-slate-500 text-sm mt-1">لا توجد معلقات تسجيل هجين تتطلب المراجعة حالياً.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingReviews.map((review) => {
                    const localAction = resolutionAction[review.id] || {};
                    return (
                      <div key={review.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        
                        {/* Summary Info */}
                        <div className="space-y-3 min-w-[320px]">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-rose-600">{review.worker_name_fallback}</span>
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded">تسجيل يدوي معلق</span>
                          </div>

                          {/* Engineer Operational details */}
                          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-2">
                            <h5 className="text-xs font-bold text-amber-800 flex items-center gap-1">
                              <Activity className="h-3.5 w-3.5" />
                              البيانات المرفقة من التقرير الميداني:
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                              <span>• ساعات أساسية: <strong className="text-slate-900">{review.labor_entry_hours || 0} س</strong></span>
                              <span>• ساعات إضافي: <strong className="text-emerald-700">+{review.labor_entry_overtime || 0} س</strong></span>
                              <span>• ساعات خصومات: <strong className="text-rose-700">-{review.labor_entry_deduction_hours || 0} س</strong></span>
                              <span className="col-span-2 italic text-slate-500">• ملاحظة المهندس: "{review.labor_entry_note || 'بدون ملاحظة'}"</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-500 space-y-1 font-semibold">
                            <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-400" /><span>تقرير يوم: {review.labor_entry_report_date || review.report_date}</span></div>
                            <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /><span>العملية: {review.operation_name} - {review.location_name || 'حوشة غير محددة'}</span></div>
                            <div className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-400" /><span>المهندس المسؤول: {review.engineer_name}</span></div>
                          </div>
                        </div>

                        {/* Action Panel */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex-1 flex flex-wrap gap-4 items-center">
                          <div className="flex flex-col gap-1 min-w-[160px]">
                            <label className="text-xs font-bold text-slate-500">اختر نوع التسوية</label>
                            <select
                              className="border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              value={localAction.action || ''}
                              onChange={(e) => updateResolutionState(review.id, 'action', e.target.value)}
                            >
                              <option value="">-- اختر الإجراء --</option>
                              <option value="link">ربط بعامل حالي بالنظام</option>
                              <option value="create">إنشاء كعامل جديد واستكمال ملفه</option>
                            </select>
                          </div>

                          {localAction.action === 'link' && (
                            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                              <label className="text-xs font-bold text-slate-500">العامل الحالي</label>
                              <select
                                className="border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                value={localAction.value || ''}
                                onChange={(e) => updateResolutionState(review.id, 'value', e.target.value)}
                              >
                                <option value="">-- اختر الملف الحالي --</option>
                                {[...workers]
                                  .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                                  .map(w => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.worker_type === 'COMPANY' ? 'شركة' : 'مقاول'})</option>
                                  ))
                                }
                              </select>
                            </div>
                          )}

                          {localAction.action === 'create' && (
                            <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                              <label className="text-xs font-bold text-slate-500">نوع العامل الجديد</label>
                              <select
                                className="border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                value={localAction.value || 'COMPANY'}
                                onChange={(e) => updateResolutionState(review.id, 'value', e.target.value)}
                              >
                                <option value="COMPANY">عمالة الشركة الرسمية</option>
                                <option value="CONTRACTOR">عمالة مقاول خارجي</option>
                              </select>
                            </div>
                          )}

                          <button
                            onClick={() => handleResolveReview(review.id)}
                            disabled={resolvingId === review.id || !localAction.action}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-all mt-auto"
                          >
                            {resolvingId === review.id ? 'جاري التسوية...' : 'تأكيد التسوية'}
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 2 && (() => {
            const departments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)))
              .sort((a, b) => a.localeCompare(b, 'ar'));

            const filteredEmployees = employees.filter(emp => {
              const matchesSearch = 
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (emp.position && emp.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()));

              const matchesStatus = 
                statusFilter === 'ALL' || 
                ((statusFilter === 'ACTIVE') && (emp.status === 'active' || emp.status === 'ACTIVE' || emp.is_active)) ||
                ((statusFilter === 'INACTIVE') && (emp.status !== 'active' && emp.status !== 'ACTIVE' && !emp.is_active));

              const matchesDept = 
                deptFilter === 'ALL' || 
                emp.department === deptFilter;

              return matchesSearch && matchesStatus && matchesDept;
            }).sort((a, b) => {
              if (a.created_at && b.created_at) {
                return new Date(b.created_at) - new Date(a.created_at);
              }
              return b.id.localeCompare(a.id);
            });

            const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
            const activePage = Math.min(currentPage, totalPages || 1);
            const startIndex = (activePage - 1) * itemsPerPage;
            const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-150 pb-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-800">سجل المهندسين والموظفين الرسميين (Staff)</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">يضم هذا القسم الكوادر الإدارية والهندسية الذين يمتلكون حسابات مستخدمين ويتقاضون رواتب شهرية.</p>
                  </div>
                  
                  {/* Premium Filter controls */}
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Search Field */}
                    <div className="relative flex-1 md:flex-initial min-w-[240px]">
                      <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ابحث بالاسم، الإيميل، القسم، المسمى الوظيفي..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pr-10 pl-3 py-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all text-right"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                          className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Department Filter */}
                    <select
                      value={deptFilter}
                      onChange={(e) => {
                        setDeptFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="ALL">جميع الأقسام</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="ALL">جميع الحالات</option>
                      <option value="ACTIVE">النشطين فقط</option>
                      <option value="INACTIVE">المعطلين فقط</option>
                    </select>
                  </div>
                </div>
                
                {employees.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-semibold text-sm">لا يوجد موظفون رسميون مسجلون حالياً.</p>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-semibold text-sm">لم يتم العثور على أي نتائج تطابق خيارات التصفية أو البحث المحددة.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-right">
                        <thead>
                          <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-3 w-12"></th>
                            <th className="p-3">اسم الموظف (اضغط لملف الوثائق)</th>
                            <th className="p-3">البريد الإلكتروني</th>
                            <th className="p-3">القسم / الإدارة</th>
                            <th className="p-3">المسمى الوظيفي</th>
                            <th className="p-3">الراتب الأساسي</th>
                            <th className="p-3">الوثائق</th>
                            <th className="p-3">الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedEmployees.map((emp) => {
                            const isExpanded = expandedEmployeeId === emp.id;
                            const totalAllowances = emp.payroll_components
                              ? emp.payroll_components.filter(c => c.type === 'ALLOWANCE').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
                              : 0;
                            const totalDeductions = emp.payroll_components
                              ? emp.payroll_components.filter(c => c.type === 'DEDUCTION').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
                              : 0;
                            const netSalary = parseFloat(emp.monthly_salary || 0) + totalAllowances - totalDeductions;
                            const documentCount = emp.documents ? emp.documents.length : 0;
                            const verifiedCount = emp.documents ? emp.documents.filter(d => d.is_verified).length : 0;

                            return (
                              <React.Fragment key={emp.id}>
                                <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                                  <td className="p-3 text-center">
                                    <button 
                                      onClick={() => toggleEmployeeRowExpansion(emp.id)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-600"
                                    >
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    <button 
                                      onClick={() => {
                                        setDetailedEmployee(emp);
                                        setOpenEmployeeDetailDialog(true);
                                      }}
                                      className="font-bold text-emerald-600 hover:text-emerald-800 underline transition-all text-right"
                                    >
                                      {emp.name}
                                    </button>
                                  </td>
                                  <td className="p-3 text-slate-600 font-medium">
                                    {emp.email || 'غير مرتبط بإيميل'}
                                  </td>
                                  <td className="p-3 text-slate-650 font-bold text-xs">
                                    {emp.department || 'الإدارة الهندسية'}
                                  </td>
                                  <td className="p-3 text-slate-600 font-medium">
                                    {emp.position || 'مهندس زراعي'}
                                  </td>
                                  <td className="p-3 font-bold text-emerald-700">
                                    {emp.monthly_salary} ج.م
                                  </td>
                                  <td className="p-3">
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                      verifiedCount === documentCount && documentCount > 0
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : documentCount > 0
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                      {documentCount > 0 ? `${verifiedCount}/${documentCount} معتمد` : 'بدون وثائق'}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                      emp.status === 'active' || emp.status === 'ACTIVE' || emp.is_active 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-slate-100 text-slate-800'
                                    }`}>
                                      {emp.status === 'active' || emp.status === 'ACTIVE' || emp.is_active ? 'نشط' : 'غير نشط'}
                                    </span>
                                  </td>
                                </tr>
                                
                                {/* Expandable Panel for Employee */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={8} className="p-4 bg-slate-50 border-b border-slate-200">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex flex-wrap gap-6 items-center">
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                                            <span className="text-xs font-bold">البدلات الشهرية:</span>
                                            <span className="text-sm font-black text-emerald-600">
                                              +{totalAllowances} ج.م
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 text-slate-700">
                                            <TrendingDown className="h-4 w-4 text-rose-600" />
                                            <span className="text-xs font-bold">الاستقطاعات المتكررة:</span>
                                            <span className="text-sm font-black text-rose-600">
                                              -{totalDeductions} ج.م
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                            <DollarSign className="h-4 w-4 text-emerald-700" />
                                            <span className="text-xs font-bold text-slate-800">صافي المستحق التكراري:</span>
                                            <span className="text-sm font-black text-emerald-700">{netSalary} ج.م</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end">
                                          <button
                                            onClick={() => {
                                              setSelectedEmployeeForComp(emp);
                                              setNewPayrollCompForm({
                                                type: 'ALLOWANCE',
                                                name: '',
                                                amount: '',
                                              });
                                              setOpenAddPayrollCompDialog(true);
                                            }}
                                            className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                                          >
                                            <DollarSign className="h-3.5 w-3.5 text-amber-600" />
                                            إضافة بند مالي (بدل/خصم)
                                          </button>
                                          <button
                                            onClick={() => {
                                              setDetailedEmployee(emp);
                                              setOpenEmployeeDetailDialog(true);
                                            }}
                                            className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                            ملف الموظف والوثائق
                                          </button>
                                          <button
                                            onClick={() => handleOpenEditEmployeeDialog(emp)}
                                            className="flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                          >
                                            <Edit2 className="h-3.5 w-3.5" />
                                            تعديل
                                          </button>
                                          <button
                                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs px-3 py-1.5 rounded-lg font-bold transition-all"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            حذف
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                        <div className="text-xs text-slate-500 font-semibold">
                          عرض الصفحة {activePage} من {totalPages} (إجمالي الموظفين المطابقين: {filteredEmployees.length})
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={activePage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-40 transition-all"
                          >
                            السابق
                          </button>
                          <button
                            disabled={activePage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 disabled:opacity-40 transition-all"
                          >
                            التالي
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ======================================================== */}
      {/* SHADCN DIALOGS FOR COMPREHENSIVE FORMS */}
      {/* ======================================================== */}

      {/* 1. NEW WORKER REGISTRATION DIALOG */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-emerald-600 flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              تسجيل عامل جديد (الملف الشامل للموظف)
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              أدخل كافة البيانات الشخصية والتعاقدية والمالية بدقة لبناء ملف شامل للعامل بالنظام.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="space-y-6">
            
            {/* القسم الأول: البيانات الشخصية والتعريفية */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 border-r-4 border-emerald-500 pr-2 mb-4">أولاً: البيانات الشخصية والتعريفية</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">اسم العامل بالكامل <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم الثلاثي أو الرباعي كما في البطاقة"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={newWorker.name}
                    onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">رقم بطاقة الرقم القومي (14 رقم)</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="29012345678901"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-left font-mono"
                    value={newWorker.national_id}
                    onChange={(e) => setNewWorker({ ...newWorker, national_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">رقم الكارنيه / البادج التعريفي</label>
                  <input
                    type="text"
                    placeholder="كود الميدان أو رقم الكارنيه"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={newWorker.badge_number}
                    onChange={(e) => setNewWorker({ ...newWorker, badge_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">العنوان السكني التفصيلي</label>
                  <input
                    type="text"
                    placeholder="المحافظة - المركز - القرية أو اسم الشارع"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={newWorker.address}
                    onChange={(e) => setNewWorker({ ...newWorker, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* القسم الثاني: تفاصيل التوظيف والرواتب */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 border-r-4 border-emerald-500 pr-2 mb-4">ثانياً: تفاصيل التوظيف والهيكل المالي</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">نوع التوظيف</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={newWorker.worker_type}
                    onChange={(e) => setNewWorker({ ...newWorker, worker_type: e.target.value })}
                  >
                    <option value="COMPANY">عمالة شركة مباشرة</option>
                    <option value="CONTRACTOR">عمالة تابعة لمقاول</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">المقاول التابع له (في حال عمالة مقاول)</label>
                  <select
                    disabled={newWorker.worker_type !== 'CONTRACTOR'}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white disabled:opacity-50"
                    value={newWorker.contractor}
                    onChange={(e) => setNewWorker({ ...newWorker, contractor: e.target.value })}
                  >
                    <option value="">بلا مقاول / مباشر</option>
                    {[...contractors]
                      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">الراتب الأساسي / اليومية (ج.م)</label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={newWorker.base_salary}
                    onChange={(e) => setNewWorker({ ...newWorker, base_salary: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">تاريخ مباشرة العمل / التعيين</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-right"
                    value={newWorker.hire_date}
                    onChange={(e) => setNewWorker({ ...newWorker, hire_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ساعات العمل القياسية باليوم</label>
                  <input
                    type="number"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={newWorker.working_hours_per_day}
                    onChange={(e) => setNewWorker({ ...newWorker, working_hours_per_day: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ملاحظات الموارد البشرية</label>
                  <textarea
                    rows={1}
                    placeholder="أي ملاحظات إضافية تخص ملف العامل"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white resize-none"
                    value={newWorker.notes}
                    onChange={(e) => setNewWorker({ ...newWorker, notes: e.target.value })}
                  />
                </div>
              </div>
            </div>

          </div>

          <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
            <button
              onClick={handleCreateWorker}
              disabled={formLoading || !newWorker.name}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2 rounded-lg transition-all shadow disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'تسجيل العامل الجديد'}
            </button>
            <button
              onClick={() => setOpenAddDialog(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-2 rounded-lg transition-all"
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. EDIT WORKER DETAILS DIALOG */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto text-right p-6 rounded-2xl shadow-xl border border-slate-150" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-sky-600 flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              تعديل بيانات العامل الشخصية والمالية
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              عدّل حقول البيانات المتاحة بالأسفل لحفظ البيانات المحدثة في سجلات الـ HR الفورية.
            </DialogDescription>
          </DialogHeader>

          {editingWorker && (
            <>
              {formError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="space-y-6">
                
                {/* القسم الأول: البيانات الشخصية */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 border-r-4 border-sky-500 pr-2 mb-4">أولاً: البيانات الشخصية والتعريفية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">اسم العامل بالكامل</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
                        value={editingWorker.name}
                        onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">رقم بطاقة الرقم القومي (14 رقم)</label>
                      <input
                        type="text"
                        maxLength={14}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white font-mono text-left"
                        value={editingWorker.national_id || ''}
                        onChange={(e) => setEditingWorker({ ...editingWorker, national_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">رقم الكارنيه / الكود</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        value={editingWorker.badge_number || ''}
                        onChange={(e) => setEditingWorker({ ...editingWorker, badge_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">العنوان السكني بالكامل</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        value={editingWorker.address || ''}
                        onChange={(e) => setEditingWorker({ ...editingWorker, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* القسم الثاني: البيانات الوظيفية والمالية */}
                <div>
                  <h4 className="text-sm font-bold text-slate-800 border-r-4 border-sky-500 pr-2 mb-4">ثانياً: البيانات الوظيفية والراتب الأساسي</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">نوع التوظيف</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        value={editingWorker.worker_type}
                        onChange={(e) => setEditingWorker({ ...editingWorker, worker_type: e.target.value })}
                      >
                        <option value="COMPANY">عمالة شركة</option>
                        <option value="CONTRACTOR">عمالة مقاول</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">المقاول التابع له</label>
                      <select
                        disabled={editingWorker.worker_type !== 'CONTRACTOR'}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white disabled:opacity-50"
                        value={editingWorker.contractor}
                        onChange={(e) => setEditingWorker({ ...editingWorker, contractor: e.target.value })}
                      >
                        <option value="">بلا مقاول</option>
                        {[...contractors]
                          .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        }
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">الراتب الأساسي / اليومية (ج.م)</label>
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        value={editingWorker.base_salary}
                        onChange={(e) => setEditingWorker({ ...editingWorker, base_salary: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">تاريخ بدء العمل (التعيين)</label>
                      <input
                        type="date"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white text-right"
                        value={editingWorker.hire_date || ''}
                        onChange={(e) => setEditingWorker({ ...editingWorker, hire_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">ساعات العمل القياسية باليوم</label>
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        value={editingWorker.working_hours_per_day}
                        onChange={(e) => setEditingWorker({ ...editingWorker, working_hours_per_day: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">الحالة العامة</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        value={editingWorker.status}
                        onChange={(e) => setEditingWorker({ ...editingWorker, status: e.target.value })}
                      >
                        <option value="active">نشط ومفعل للتقرير</option>
                        <option value="terminated">غير نشط / موقوف</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-slate-500 block mb-1">ملاحظات الموارد البشرية</label>
                      <textarea
                        rows={2}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        value={editingWorker.notes || ''}
                        onChange={(e) => setEditingWorker({ ...editingWorker, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

              </div>

              <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={handleUpdateWorker}
                  disabled={formLoading || !editingWorker.name}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-2 rounded-lg transition-all shadow disabled:opacity-50"
                >
                  {formLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  onClick={() => setOpenEditDialog(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-2 rounded-lg transition-all"
                >
                  إلغاء
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={openEditEmployeeDialog} onOpenChange={setOpenEditEmployeeDialog}>
        <DialogContent className="max-w-2xl text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-emerald-600 flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              تعديل بيانات الموظف / المهندس الرسمي
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              قم بتعديل البيانات الوظيفية والمالية للموظف.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}

          {editingEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">اسم الموظف</label>
                  <input
                    type="text"
                    disabled
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 font-semibold cursor-not-allowed"
                    value={editingEmployee.name}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">البريد الإلكتروني</label>
                  <input
                    type="text"
                    disabled
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 font-semibold cursor-not-allowed text-left font-mono"
                    value={editingEmployee.email || 'غير متوفر'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">القسم / الإدارة <span className="text-rose-500">*</span></label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-bold text-slate-800"
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                  >
                    <option value="الإدارة الهندسية">الإدارة الهندسية</option>
                    <option value="الموارد البشرية (HR)">الموارد البشرية (HR)</option>
                    <option value="الحسابات والمالية">الحسابات والمالية</option>
                    <option value="إدارة العمليات والمزارع">إدارة العمليات والمزارع</option>
                    <option value="المشتريات والمخازن">المشتريات والمخازن</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">المسمى الوظيفي <span className="text-rose-500">*</span></label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-800"
                    value={editingEmployee.position}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                  >
                    <option value="مهندس زراعي">مهندس زراعي</option>
                    <option value="مهندس ري">مهندس ري</option>
                    <option value="مهندس وقاية ومكافحة">مهندس وقاية ومكافحة</option>
                    <option value="مدير مزرعة">مدير مزرعة</option>
                    <option value="مدير قطاع">مدير قطاع</option>
                    <option value="مشرف ميداني">مشرف ميداني</option>
                    <option value="محاسب موقع">محاسب موقع</option>
                    <option value="أخصائي موارد بشرية (HR)">أخصائي موارد بشرية (HR)</option>
                    <option value="أمين مخزن">أمين مخزن</option>
                    <option value="مدير الإدارة الهندسية">مدير الإدارة الهندسية</option>
                    <option value="مدير عام العمليات">مدير عام العمليات</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">الراتب الأساسي الشهري (ج.م) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={editingEmployee.monthly_salary}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, monthly_salary: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">ساعات العمل القياسية يومياً <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={editingEmployee.standard_work_hours}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, standard_work_hours: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">تاريخ التعيين</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                    value={editingEmployee.hire_date || ''}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, hire_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">حالة العمل <span className="text-rose-500">*</span></label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-bold text-slate-800"
                    value={editingEmployee.status}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value })}
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">ملاحظات إضافية</label>
                <textarea
                  placeholder="ملاحظات حول العقد، التأمينات، أو شروط العمل الخاصة..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white h-20 resize-none text-right"
                  value={editingEmployee.notes || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpenEditEmployeeDialog(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleUpdateEmployee}
                  disabled={formLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 3. WORKER DETAILS DIALOG (PROFILE CARD) */}
      <Dialog open={openDetailDialog} onOpenChange={setOpenDetailDialog}>
        <DialogContent className="max-w-md text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-3 mb-4">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              الملف الشخصي والمالي الشامل للعامل
            </DialogTitle>
          </DialogHeader>

          {detailedWorker && (
            <div className="space-y-5">
              
              {/* بطاقة الرأس */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="text-lg font-black text-slate-900">{detailedWorker.name}</h3>
                <p className="text-xs text-slate-500 font-semibold">كود / بادج العامل: {detailedWorker.badge_number || 'غير متوفر'}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                    detailedWorker.worker_type === 'COMPANY' 
                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                      : 'bg-purple-50 text-purple-700 border-purple-100'
                  }`}>
                    {detailedWorker.worker_type === 'COMPANY' ? 'موظف شركة' : 'عامل مقاول'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                    detailedWorker.status === 'active' || detailedWorker.status === 'ACTIVE' || detailedWorker.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-slate-100 text-slate-700 border-slate-250'
                  }`}>
                    {detailedWorker.status === 'active' || detailedWorker.status === 'ACTIVE' || detailedWorker.is_active ? 'الملف نشط' : 'ملف معطل'}
                  </span>
                </div>
              </div>

              {/* البيانات الشخصية */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400">البيانات التعاقدية والشخصية:</h4>
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-normal">رقم بطاقة الهوية</span>
                    <span className="font-mono">{detailedWorker.national_id || 'غير متوفر'}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-normal">تاريخ التعيين</span>
                    <span>{detailedWorker.hire_date || 'غير مسجل'}</span>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <span className="text-slate-400 block font-normal">العنوان التفصيلي</span>
                    <span>{detailedWorker.address || 'غير متوفر'}</span>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <span className="text-slate-400 block font-normal">المقاول المسؤول</span>
                    <span>{detailedWorker.contractor_name || 'لا يوجد (عمالة مباشرة)'}</span>
                  </div>
                </div>
              </div>

              {/* التفاصيل المالية */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400">دورة الأجور والرواتب المعلقة:</h4>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-700">
                    <div className="space-y-1">
                      <span className="text-slate-500 block font-normal text-[10px]">الأساسي/اليومية</span>
                      <span className="text-sm font-black text-slate-800">{detailedWorker.monthly_salary} ج.م</span>
                    </div>
                    <div className="space-y-1 border-x border-emerald-100">
                      <span className="text-slate-500 block font-normal text-[10px]">إجمالي الإضافي</span>
                      <span className="text-sm font-black text-emerald-600">+{detailedWorker.total_overtime || 0} ج.م</span>
                      {detailedWorker.total_overtime_hours > 0 && (
                        <span className="text-[10px] font-bold text-emerald-500 block">({detailedWorker.total_overtime_hours} ساعة إضافي)</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 block font-normal text-[10px]">الخصومات</span>
                      <span className="text-sm font-black text-rose-600">-{detailedWorker.total_deductions || 0} ج.م</span>
                      {detailedWorker.total_deductions_hours > 0 && (
                        <span className="text-[10px] font-bold text-rose-500 block">({detailedWorker.total_deductions_hours} ساعة خصم)</span>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-emerald-100/60 pt-2 flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-800 text-sm">صافي مستحقات الفترة:</span>
                    <span className="font-black text-emerald-700 text-base">{detailedWorker.net_salary || detailedWorker.monthly_salary} ج.م</span>
                  </div>
                </div>
              </div>

              {/* ملاحظات */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400">ملاحظات إدارية:</h4>
                <p className="text-xs italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 leading-relaxed">
                  {detailedWorker.notes || 'لا توجد ملاحظات مقيدة لهذا العامل.'}
                </p>
              </div>

            </div>
          )}

          <div className="mt-6 flex justify-start border-t border-slate-100 pt-3">
            <button
              onClick={() => setOpenDetailDialog(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-1.5 rounded-lg transition-all"
            >
              إغلاق الملف الشخصي
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. DIRECT TRANSACTION (DEDUCTION/OVERTIME) DIALOG */}
      <Dialog open={openTransactionDialog} onOpenChange={setOpenTransactionDialog}>
        <DialogContent className="max-w-xl text-right p-6 rounded-2xl shadow-xl border border-slate-150" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-lg font-black text-amber-600 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              إضافة حركة مالية مباشرة للعامل (خصم / إضافي)
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs mt-1">
              يمكنك كمسؤول موارد بشرية تسجيل ساعات عمل إضافية أو خصم ساعات مباشرة لملف العامل دون الارتباط بالتقرير الميداني.
            </DialogDescription>
          </DialogHeader>

          {transactionWorker && (
            <>
              {formError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold leading-relaxed">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                {/* اسم العامل */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">العامل المستهدف</span>
                    <span className="text-sm font-extrabold text-slate-800">{transactionWorker.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block text-left font-bold font-semibold">فئة الأجر</span>
                    <span className="text-xs font-black text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded block text-center mt-0.5">
                      {transactionWorker.monthly_salary} ج.م ({transactionWorker.hourly_rate} ج.م/ساعة)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* نوع المعاملة */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">نوع الحركة المالية <span className="text-rose-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTransactionForm({ ...transactionForm, transaction_type: 'OVERTIME' })}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          transactionForm.transaction_type === 'OVERTIME'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm font-black'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-bold'
                        }`}
                      >
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ساعات إضافي (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionForm({ ...transactionForm, transaction_type: 'DEDUCTION' })}
                        className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          transactionForm.transaction_type === 'DEDUCTION'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm font-black'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-bold'
                        }`}
                      >
                        <TrendingDown className="h-4 w-4 text-rose-600" />
                        خصم ساعات (-)
                      </button>
                    </div>
                  </div>

                  {/* عدد الساعات */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">عدد الساعات</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="مثال: 3.5"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-semibold"
                      value={transactionForm.hours}
                      onChange={(e) => setTransactionForm({ ...transactionForm, hours: e.target.value })}
                    />
                  </div>

                  {/* المبلغ المالي */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">المبلغ المالي (ج.م) <span className="text-slate-400 font-normal">(اختياري)</span></label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="اتركه للاحتساب التلقائي"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-semibold"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    />
                  </div>

                  <p className="col-span-2 text-[10px] text-amber-700 font-semibold leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50">
                    💡 <strong>ملاحظة احتساب الأجر الساعي:</strong> إذا تركت خانة "المبلغ المالي" فارغة أو 0، سيقوم النظام تلقائياً باحتساب القيمة المالية بضرب (عدد الساعات) في (أجر العامل الساعي: {transactionWorker.hourly_rate} ج.م) وحفظها فوراً!
                  </p>

                  {/* تاريخ المعاملة */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">تاريخ تسجيل الحركة <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-right font-semibold"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                    />
                  </div>

                  {/* ملاحظات وبيان الحركة */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 block mb-1">بيان وملاحظات الحركة <span className="text-rose-500">*</span></label>
                    <textarea
                      required
                      rows={2}
                      placeholder="مثال: مكافأة عمل ساعات إضافية في حوشة المانجو، أو خصم بسبب تأخير المغادرة..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-medium"
                      value={transactionForm.notes}
                      onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={handleCreateTransaction}
                  disabled={formLoading || (!transactionForm.hours && !transactionForm.amount) || !transactionForm.notes}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-6 py-2 rounded-lg transition-all shadow disabled:opacity-50"
                >
                  {formLoading ? 'جاري الحفظ...' : 'تسجيل الحركة المالية'}
                </button>
                <button
                  onClick={() => setOpenTransactionDialog(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-2 rounded-lg transition-all"
                >
                  إلغاء
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 4. HYBRID NEW WORKER COMPLETE FORM DIALOG */}
      <Dialog open={openResolveNewWorkerDialog} onOpenChange={setOpenResolveNewWorkerDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-emerald-600 flex items-center gap-2">
              <Notebook className="h-5 w-5" />
              استكمال ملف العامل الجديد واعتماده من الميدان
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs">
              هذا العامل تم تسجيله يدوياً في تقرير اليومية. يرجى إتمام ملفه القانوني لإضافته رسمياً بالنظام وتسوية السجلات.
            </DialogDescription>
          </DialogHeader>

          {selectedReviewForCreation && (
            <>
              {/* Engineer Context Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 mb-6">
                <h4 className="text-xs font-black text-amber-800">بيانات التقرير التشغيلي المرفق من الميدان:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-700">
                  <div>الاسم الميداني: <span className="text-rose-600 font-extrabold">{selectedReviewForCreation.worker_name_fallback}</span></div>
                  <div>تقرير يوم: <span>{selectedReviewForCreation.labor_entry_report_date}</span></div>
                  <div>المهندس المسؤول: <span>{selectedReviewForCreation.engineer_name}</span></div>
                  <div> ساعات أساسية: <span className="text-slate-900">{selectedReviewForCreation.labor_entry_hours} س</span></div>
                  <div>إضافي ميداني: <span className="text-emerald-700">+{selectedReviewForCreation.labor_entry_overtime} س</span></div>
                  <div>ساعات خصم: <span className="text-rose-700">-{selectedReviewForCreation.labor_entry_deduction_hours} س</span></div>
                  <div className="col-span-2 sm:col-span-3 border-t border-amber-200/50 pt-2 text-amber-900 italic">
                    ملاحظة المهندس: "{selectedReviewForCreation.labor_entry_note || 'لا توجد ملاحظة'}"
                  </div>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 border-r-4 border-emerald-500 pr-2 mb-4">بيانات الموظف التعاقدية والشخصية الجديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">اسم العامل بالكامل كما في الهوية <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        value={resolveNewWorkerForm.name}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">رقم بطاقة الرقم القومي (14 رقم)</label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="29012345678901"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-left font-mono"
                        value={resolveNewWorkerForm.national_id}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, national_id: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">العنوان السكني التفصيلي</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        value={resolveNewWorkerForm.address}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">تاريخ بدء التعيين الفعلي</label>
                      <input
                        type="date"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-right"
                        value={resolveNewWorkerForm.hire_date}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, hire_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">نوع التوظيف بالنظام</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        value={resolveNewWorkerForm.worker_type}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, worker_type: e.target.value })}
                      >
                        <option value="COMPANY">عمالة الشركة الأساسية</option>
                        <option value="CONTRACTOR">عمالة مقاول خارجي</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">المقاول التابع له</label>
                      <select
                        disabled={resolveNewWorkerForm.worker_type !== 'CONTRACTOR'}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white disabled:opacity-50"
                        value={resolveNewWorkerForm.contractor_id}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, contractor_id: e.target.value })}
                      >
                        <option value="">اختر المقاول</option>
                        {[...contractors]
                          .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        }
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">الراتب الأساسي / اليومية المعتمدة</label>
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        value={resolveNewWorkerForm.monthly_salary}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, monthly_salary: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">ساعات العمل اليومية القياسية</label>
                      <input
                        type="number"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        value={resolveNewWorkerForm.standard_work_hours}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, standard_work_hours: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-600 block mb-1">ملاحظات التفعيل الإداري</label>
                      <textarea
                        rows={2}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                        value={resolveNewWorkerForm.notes}
                        onChange={(e) => setResolveNewWorkerForm({ ...resolveNewWorkerForm, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={handleResolveWithCompleteProfile}
                  disabled={formLoading || !resolveNewWorkerForm.name}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2 rounded-lg transition-all shadow disabled:opacity-50"
                >
                  {formLoading ? 'جاري تفعيل الحساب...' : 'حفظ واعتماد تسوية العامل'}
                </button>
                <button
                  onClick={() => setOpenResolveNewWorkerDialog(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-2 rounded-lg transition-all"
                >
                  إلغاء
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 5. EMPLOYEE PROFILE & DOCUMENTS DETAIL DIALOG */}
      <Dialog open={openEmployeeDetailDialog} onOpenChange={setOpenEmployeeDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-3 mb-4">
            <DialogTitle className="text-lg font-black text-emerald-700 flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-600" />
              الملف الوظيفي والمستندي الشامل للموظف
            </DialogTitle>
          </DialogHeader>

          {detailedEmployee && (
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{detailedEmployee.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    {detailedEmployee.position || 'موظف'} - {detailedEmployee.department || 'الإدارة الهندسية'}
                  </p>
                </div>
                <div className="text-xs text-slate-500 font-semibold space-y-1 text-right">
                  <div>تاريخ التعيين: <span className="text-slate-800 font-bold">{detailedEmployee.hire_date || 'غير مسجل'}</span></div>
                  <div>البريد الإلكتروني: <span className="text-slate-800 font-bold">{detailedEmployee.email || 'غير متوفر'}</span></div>
                </div>
              </div>

              {/* 1. Official Documents Area */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <FileText className="h-4.5 w-4.5 text-emerald-600" />
                    المستندات الرسمية والوثائق القانونية
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedEmployeeForDoc(detailedEmployee);
                      setNewDocForm({
                        document_type: 'national_id',
                        document_file: null,
                        issue_date: '',
                        expiry_date: '',
                        notes: ''
                      });
                      setFormError('');
                      setOpenAddDocDialog(true);
                    }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    رفع وثيقة جديدة
                  </button>
                </div>

                {!detailedEmployee.documents || detailedEmployee.documents.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-500 font-semibold text-xs">لا توجد وثائق مرفوعة لملف هذا الموظف حالياً.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {detailedEmployee.documents.map((doc) => (
                      <div key={doc.id} className="border border-slate-200 rounded-xl p-3 bg-white flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all text-right">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200 mb-1.5 inline-block">
                              {translateDocType(doc.document_type)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">تاريخ الإصدار: {doc.issue_date || '-'}</span>
                            {doc.expiry_date && (
                              <span className="text-[10px] text-rose-500 block font-semibold">تاريخ الانتهاء: {doc.expiry_date}</span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            doc.is_verified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {doc.is_verified ? '✅ معتمد' : '⏳ قيد المراجعة'}
                          </span>
                        </div>

                        {doc.notes && (
                          <p className="text-[11px] italic bg-slate-50 p-2 rounded text-slate-650 font-medium">
                            📝 {doc.notes}
                          </p>
                        )}

                        <div className="flex gap-2 border-t border-slate-100 pt-2.5 mt-1">
                          <a
                            href={doc.document_file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <Download className="h-3.5 w-3.5" />
                            تحميل / عرض المستند
                          </a>
                          {!doc.is_verified ? (
                            <button
                              onClick={() => handleVerifyDocument(doc.id, true)}
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                            >
                              اعتماد الوثيقة
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifyDocument(doc.id, false)}
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                            >
                              إلغاء الاعتماد
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Payroll Components Control */}
              <div className="space-y-3 pt-4 border-t border-slate-100 text-right">
                <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
                    المكونات المالية للراتب الشهري (البدلات والاستقطاعات المتكررة)
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedEmployeeForComp(detailedEmployee);
                      setNewPayrollCompForm({
                        type: 'ALLOWANCE',
                        name: '',
                        amount: '',
                        is_recurring: true
                      });
                      setFormError('');
                      setOpenAddPayrollCompDialog(true);
                    }}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة بند مالي جديد
                  </button>
                </div>

                {/* Salary Details Card */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3 text-right">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs font-bold text-slate-700">
                    <div className="space-y-1">
                      <span className="text-slate-500 block font-normal text-[10px]">الراتب الأساسي التعاقدي</span>
                      <span className="text-sm font-black text-slate-800">{detailedEmployee.monthly_salary} ج.م</span>
                    </div>
                    <div className="space-y-1 border-r border-slate-200 pr-4">
                      <span className="text-slate-500 block font-normal text-[10px]">إجمالي البدلات المضافة</span>
                      <span className="text-sm font-black text-emerald-600">
                        +{detailedEmployee.payroll_components?.filter(c => c.type === 'ALLOWANCE').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0} ج.م
                      </span>
                    </div>
                    <div className="space-y-1 border-r border-slate-200 pr-4">
                      <span className="text-slate-500 block font-normal text-[10px]">إجمالي الاستقطاعات</span>
                      <span className="text-sm font-black text-rose-600">
                        -{detailedEmployee.payroll_components?.filter(c => c.type === 'DEDUCTION').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0} ج.م
                      </span>
                    </div>
                    <div className="space-y-1 border-r border-slate-200 pr-4 bg-emerald-100/50 py-1.5 rounded-lg">
                      <span className="text-emerald-800 block font-bold text-[10px]">صافي الراتب المتكرر</span>
                      <span className="text-base font-black text-emerald-700">
                        {parseFloat(detailedEmployee.monthly_salary || 0) + 
                         (detailedEmployee.payroll_components?.filter(c => c.type === 'ALLOWANCE').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0) -
                         (detailedEmployee.payroll_components?.filter(c => c.type === 'DEDUCTION').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0)
                        } ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {!detailedEmployee.payroll_components || detailedEmployee.payroll_components.length === 0 ? (
                  <div className="text-center py-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-500 font-semibold text-xs">لا توجد بدلات أو استقطاعات مضافة حالياً (يصرف الراتب الأساسي فقط).</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-right">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2.5 text-right">اسم البند المالي</th>
                          <th className="p-2.5 text-right">النوع</th>
                          <th className="p-2.5 text-right">النوع المتكرر</th>
                          <th className="p-2.5 text-right">القيمة المالية</th>
                          <th className="p-2.5 w-20 text-right">التحكم</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedEmployee.payroll_components.map((comp) => (
                          <tr key={comp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 font-bold text-slate-800 text-right">{comp.name}</td>
                            <td className="p-2.5 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                comp.type === 'ALLOWANCE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {comp.type === 'ALLOWANCE' ? 'بدل إضافي (+)' : 'استقطاع / خصم (-)'}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 font-semibold text-right">
                              {comp.is_recurring ? 'متكرر شهرياً' : 'لمرة واحدة فقط'}
                            </td>
                            <td className={`p-2.5 font-bold text-sm text-right ${comp.type === 'ALLOWANCE' ? 'text-emerald-700' : 'text-rose-750'}`}>
                              {comp.type === 'ALLOWANCE' ? `+${comp.amount}` : `-${comp.amount}`} ج.م
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => handleDeletePayrollComponent(comp.id)}
                                className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-all border border-transparent hover:border-rose-150"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          <div className="mt-6 flex justify-start border-t border-slate-100 pt-3">
            <button
              onClick={() => setOpenEmployeeDetailDialog(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-lg transition-all shadow"
            >
              إغلاق الملف الشخصي
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. UPLOAD DOCUMENT DIALOG */}
      <Dialog open={openAddDocDialog} onOpenChange={setOpenAddDocDialog}>
        <DialogContent className="max-w-md text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-3 mb-4">
            <DialogTitle className="text-lg font-black text-emerald-700 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-emerald-600" />
              رفع وثيقة رسمية لملف الموظف
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold leading-relaxed">
              {formError}
            </div>
          )}

          <div className="space-y-4 text-right">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">نوع المستند <span className="text-rose-500">*</span></label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                value={newDocForm.document_type}
                onChange={(e) => setNewDocForm({ ...newDocForm, document_type: e.target.value })}
              >
                <option value="national_id">بطاقة الرقم القومي</option>
                <option value="academic_certificate">مؤهل دراسي / شهادة تخرج</option>
                <option value="training_certificate">شهادة تدريبية أو خبرة</option>
                <option value="contract">عقد عمل معتمد</option>
                <option value="other">مستند آخر</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">تاريخ الإصدار</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-right font-semibold"
                value={newDocForm.issue_date}
                onChange={(e) => setNewDocForm({ ...newDocForm, issue_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">تاريخ الانتهاء (اختياري)</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-right font-semibold"
                value={newDocForm.expiry_date}
                onChange={(e) => setNewDocForm({ ...newDocForm, expiry_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">الملف (صورة أو PDF) <span className="text-rose-500">*</span></label>
              <input
                type="file"
                required
                accept="image/*,application/pdf"
                onChange={(e) => setNewDocForm({ ...newDocForm, document_file: e.target.files[0] })}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 text-right"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">بيان وملاحظات المستند</label>
              <textarea
                rows={2}
                placeholder="أدخل أي ملاحظات حول المستند المرفوع..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white resize-none"
                value={newDocForm.notes}
                onChange={(e) => setNewDocForm({ ...newDocForm, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
            <button
              onClick={handleUploadDocument}
              disabled={formLoading || !newDocForm.document_file}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition-all shadow disabled:opacity-50"
            >
              {formLoading ? 'جاري الرفع...' : 'بدء الرفع والحفظ'}
            </button>
            <button
              onClick={() => setOpenAddDocDialog(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-2 rounded-lg transition-all"
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. ADD PAYROLL COMPONENT DIALOG */}
      <Dialog open={openAddPayrollCompDialog} onOpenChange={setOpenAddPayrollCompDialog}>
        <DialogContent className="max-w-md text-right p-6 rounded-2xl" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-3 mb-4">
            <DialogTitle className="text-lg font-black text-emerald-700 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              إضافة بند مالي لراتب الموظف
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold leading-relaxed">
              {formError}
            </div>
          )}

          <div className="space-y-4 text-right">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">نوع البند المالي <span className="text-rose-500">*</span></label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                value={newPayrollCompForm.type}
                onChange={(e) => setNewPayrollCompForm({ ...newPayrollCompForm, type: e.target.value })}
              >
                <option value="ALLOWANCE">بدل / إضافي متكرر (+)</option>
                <option value="DEDUCTION">استقطاع / خصم شهري (-)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">اسم البند المالي <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="مثال: بدل انتقال، بدل طبيعة عمل، تأمينات..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                value={newPayrollCompForm.name}
                onChange={(e) => setNewPayrollCompForm({ ...newPayrollCompForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">القيمة المالية (ج.م) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                step="0.01"
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold"
                value={newPayrollCompForm.amount}
                onChange={(e) => setNewPayrollCompForm({ ...newPayrollCompForm, amount: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 py-2 text-right">
              <input
                type="checkbox"
                id="is_recurring_checkbox"
                checked={newPayrollCompForm.is_recurring}
                onChange={(e) => setNewPayrollCompForm({ ...newPayrollCompForm, is_recurring: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="is_recurring_checkbox" className="text-xs font-bold text-slate-700 cursor-pointer mr-2">
                هل هذا البند متكرر شهرياً في مسير الرواتب؟
              </label>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
            <button
              onClick={handleCreatePayrollComponent}
              disabled={formLoading || !newPayrollCompForm.name || !newPayrollCompForm.amount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition-all shadow disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'إضافة البند المالي'}
            </button>
            <button
              onClick={() => setOpenAddPayrollCompDialog(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-2 rounded-lg transition-all"
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. ADD NEW EMPLOYEE DIALOG */}
      <Dialog open={openAddEmployeeDialog} onOpenChange={setOpenAddEmployeeDialog}>
        <DialogContent className="max-w-md text-right p-6 rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="text-right border-b border-slate-100 pb-3 mb-4">
            <DialogTitle className="text-lg font-black text-emerald-700 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              إنشاء ملف موظف رسمي جديد (Staff)
            </DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs font-semibold leading-relaxed">
              {formError}
            </div>
          )}

          <div className="space-y-4 text-right">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">ربط الموظف بحساب مستخدم (Email) <span className="text-rose-500">*</span></label>
              {availableUsers.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold leading-relaxed">
                  ⚠️ لا توجد حسابات مستخدمين نشطة وغير مرتبطة حالياً في شركتك. يرجى إنشاء حساب مستخدم (عن طريق التسجيل) أولاً.
                </div>
              ) : (
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-800"
                  value={newEmployee.user}
                  onChange={(e) => setNewEmployee({ ...newEmployee, user: e.target.value })}
                >
                  <option value="">-- اختر حساب مستخدم --</option>
                  {[...availableUsers]
                    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) - [{u.role}]
                      </option>
                    ))
                  }
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">القسم <span className="text-rose-500">*</span></label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-800"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
              >
                <option value="الإدارة الهندسية">الإدارة الهندسية</option>
                <option value="الموارد البشرية (HR)">الموارد البشرية (HR)</option>
                <option value="الحسابات والمالية">الحسابات والمالية</option>
                <option value="إدارة العمليات والمزارع">إدارة العمليات والمزارع</option>
                <option value="المشتريات والمخازن">المشتريات والمخازن</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">المسمى الوظيفي <span className="text-rose-500">*</span></label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-800"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
              >
                <option value="مهندس زراعي">مهندس زراعي</option>
                <option value="مهندس ري">مهندس ري</option>
                <option value="مهندس وقاية ومكافحة">مهندس وقاية ومكافحة</option>
                <option value="مدير مزرعة">مدير مزرعة</option>
                <option value="مدير قطاع">مدير قطاع</option>
                <option value="مشرف ميداني">مشرف ميداني</option>
                <option value="محاسب موقع">محاسب موقع</option>
                <option value="أخصائي موارد بشرية (HR)">أخصائي موارد بشرية (HR)</option>
                <option value="أمين مخزن">أمين مخزن</option>
                <option value="مدير الإدارة الهندسية">مدير الإدارة الهندسية</option>
                <option value="مدير عام العمليات">مدير عام العمليات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">الراتب الأساسي التعاقدي الشهري (ج.م) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                step="0.01"
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-800"
                value={newEmployee.monthly_salary}
                onChange={(e) => setNewEmployee({ ...newEmployee, monthly_salary: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">ساعات العمل القياسية يومياً <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                placeholder="8"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-800"
                value={newEmployee.standard_work_hours}
                onChange={(e) => setNewEmployee({ ...newEmployee, standard_work_hours: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">تاريخ التعيين <span className="text-rose-500">*</span></label>
              <input
                type="date"
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-right font-semibold text-slate-800"
                value={newEmployee.hire_date}
                onChange={(e) => setNewEmployee({ ...newEmployee, hire_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">ملاحظات وبيان</label>
              <textarea
                rows={2}
                placeholder="أدخل أي ملاحظات وظيفية إضافية..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white resize-none"
                value={newEmployee.notes}
                onChange={(e) => setNewEmployee({ ...newEmployee, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-start border-t border-slate-100 pt-4 mt-6">
            <button
              onClick={handleCreateEmployee}
              disabled={formLoading || !newEmployee.user || !newEmployee.position || !newEmployee.monthly_salary}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2 rounded-lg transition-all shadow disabled:opacity-50"
            >
              {formLoading ? 'جاري الحفظ...' : 'تسجيل الموظف'}
            </button>
            <button
              onClick={() => setOpenAddEmployeeDialog(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-2 rounded-lg transition-all"
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default HRDashboard;

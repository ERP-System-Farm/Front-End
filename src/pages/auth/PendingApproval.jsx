import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import { useAuth } from '../../app/AuthContext';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const PendingApproval = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <HourglassEmptyIcon fontSize="large" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">حسابك قيد المراجعة</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          تم استلام طلبك بنجاح. يرجى الانتظار حتى يقوم مدير النظام بمراجعة وتفعيل الحساب الخاص بك لتتمكن من الوصول للوحة التحكم.
        </p>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={logout} 
          fullWidth 
          sx={{ borderRadius: '12px', py: 1.5, fontWeight: 'bold' }}
        >
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
};

export default PendingApproval;

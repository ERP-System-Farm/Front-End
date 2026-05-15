import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import GppBadIcon from '@mui/icons-material/GppBad';

const Forbidden403 = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <GppBadIcon fontSize="large" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">403</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-4">غير مصرح بالدخول</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          عذراً، أنت لا تملك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى مراجعة مدير النظام إذا كنت تعتقد أن هذا خطأ.
        </p>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/dashboard')} 
          fullWidth 
          sx={{ borderRadius: '12px', py: 1.5, fontWeight: 'bold' }}
        >
          العودة للرئيسية
        </Button>
      </div>
    </div>
  );
};

export default Forbidden403;

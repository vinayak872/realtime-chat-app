import React, { useContext, useEffect } from 'react';
import { CallContext } from '../context/CallContext';
import { AlertCircle, X } from 'lucide-react';

const CallErrorBanner = () => {
  const { callError, clearCallError, callStatus } = useContext(CallContext);

  useEffect(() => {
    if (callError) {
      const timer = setTimeout(() => {
        clearCallError();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [callError, clearCallError]);

  if (!callError || callStatus !== 'idle') {
    return null;
  }

  return (
    <div className="fixed top-5 inset-x-4 max-w-md mx-auto z-[10000] p-4 rounded-2xl bg-rose-600/95 text-white shadow-2xl backdrop-blur-xl border border-rose-400/30 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded-xl bg-white/10 shrink-0">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm font-medium leading-tight truncate">{callError}</p>
      </div>
      <button
        type="button"
        onClick={clearCallError}
        className="p-1.5 hover:bg-white/20 active:scale-95 rounded-lg text-white/80 hover:text-white transition shrink-0"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CallErrorBanner;

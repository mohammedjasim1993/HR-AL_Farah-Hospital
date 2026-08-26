import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-red-500/20 shadow-xl text-right font-sans my-4" dir="rtl">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-full text-red-400 shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="flex-1 text-center sm:text-right">
              <h3 className="text-base font-bold text-white">
                تنبيه أمان: حدث خطأ أثناء تحميل مكون {this.props.moduleName || 'النظام'}
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                لقد منع نظام الحماية الذكي حدوث انهيار كامل للتطبيق. يمكنك محاولة إعادة تحميل الصفحة أو إعادة تعيين المكون.
              </p>
              {this.state.error && (
                <div className="mt-2.5 p-2 bg-slate-950/80 rounded-lg text-[10px] font-mono text-red-300 break-words max-h-24 overflow-y-auto" dir="ltr">
                  {this.state.error.toString()}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2.5">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-600/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة تشغيل المكون</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

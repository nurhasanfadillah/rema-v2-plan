import React, { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface MultiFileUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  accept?: string;
  label?: string;
}

export function MultiFileUpload({ values = [], onChange, accept = "*/*", label = "Upload File" }: MultiFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: terlalu besar (maks 10MB)`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const urls = await Promise.all(validFiles.map(f => api.upload.file(f).then(r => r.url)));
      onChange([...(Array.isArray(values) ? values : []), ...urls]);
      toast.success(`${urls.length} file berhasil diunggah!`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunggah file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newVals = Array.isArray(values) ? [...values] : [];
    newVals.splice(index, 1);
    onChange(newVals);
    toast.success("Lampiran berhasil dihapus");
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>

      {Array.isArray(values) && values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {values.map((val, idx) => {
            const isImage = typeof val === 'string' && val.length > 0 &&
              (val.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(val));
            return (
              <div key={idx} className="relative rounded-2xl border border-slate-200/60 bg-white shadow-sm flex items-center justify-center h-24 p-2 hover:shadow-md transition-all duration-300">
                {isImage ? (
                  <img src={val} alt="Preview" className="max-h-full max-w-full rounded-xl object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[11px] text-slate-500 font-bold px-2 truncate w-full">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <span className="truncate max-w-full text-center">Lampiran {idx + 1}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full hover:scale-110 shadow-md active:scale-95 transition-all z-10 cursor-pointer"
                  title="Hapus berkas"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer min-h-[120px] group ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 hover:shadow-sm'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className={`p-3.5 rounded-full mb-2 border transition-all duration-300 ${
          dragActive
            ? 'bg-indigo-100 border-indigo-200 text-indigo-600'
            : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100/85 group-hover:scale-105'
        }`}>
          <Upload className="w-4.5 h-4.5" />
        </div>
        <p className="text-sm text-slate-700 font-bold text-center">Tarik & Lepas File ke Sini</p>
        <p className="text-xs text-slate-400 mt-1 max-w-[220px] text-center font-medium">Bisa memilih lebih dari 1 file sekaligus (Maksimal 10MB per file)</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          multiple
        />
      </div>
    </div>
  );
}

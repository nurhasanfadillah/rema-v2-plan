import React, { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ value, onChange, accept = "image/*", label = "Upload File" }: FileUploadProps) {
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

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Batas maksimal adalah 10MB.');
      return;
    }
    setUploading(true);
    try {
      const { url } = await api.upload.file(file);
      onChange(url);
      toast.success('File berhasil diunggah!');
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
    toast.success("Berkas dihapus");
  };

  const isImage = typeof value === 'string' && value.length > 0 &&
    (value.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(value));

  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      {value ? (
        <div className="relative rounded-2xl border border-slate-200/60 bg-slate-50 p-4 flex items-center justify-center min-h-[120px] shadow-inner transition-all duration-300">
          {isImage ? (
            <div className="relative group rounded-xl overflow-hidden shadow-sm max-w-[200px] border border-slate-200">
              <img src={value} alt="Preview" className="max-h-32 object-contain transition-transform duration-300 group-hover:scale-105" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-3 text-slate-700 bg-white border rounded-xl shadow-sm max-w-xs">
              <FileText className="w-6 h-6 text-blue-500" />
              <div className="text-xs font-semibold truncate max-w-full text-center">Berkas Berhasil Terunggah</div>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Siap</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2.5 -right-2.5 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full hover:scale-105 shadow-md active:scale-95 transition-all z-10 cursor-pointer"
            title="Hapus berkas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer min-h-[140px] group ${
            dragActive
              ? 'border-blue-500 bg-blue-500/5'
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
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className={`p-4 rounded-full mb-3 border transition-all duration-300 ${
            dragActive
              ? 'bg-blue-100 border-blue-200 text-blue-600'
              : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100/80 group-hover:scale-105'
          }`}>
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-700 font-bold text-center">Tarik & Lepas File di Sini</p>
          <p className="text-xs text-slate-400 mt-1 max-w-[220px] text-center font-medium">Klik atau seret file ke sini (maks. 10MB)</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

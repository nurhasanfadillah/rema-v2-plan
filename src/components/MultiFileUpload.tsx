import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { resizeImage } from '../lib/utils';

interface MultiFileUploadProps {
  values: string[];
  onChange: (base64Urls: string[]) => void;
  accept?: string;
  label?: string;
}

export function MultiFileUpload({ values = [], onChange, accept = "*/*", label = "Upload File" }: MultiFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
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
    const validFiles = Array.from(files).filter(f => f.size <= 2 * 1024 * 1024);
    if (validFiles.length < files.length) {
      alert("Beberapa file terlalu besar dan diabaikan. Maksimal 2MB per file.");
    }

    if (validFiles.length === 0) return;

    const newValues: string[] = [];

    for (const file of validFiles) {
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        try {
          const resized = await resizeImage(file, 800); 
          newValues.push(resized);
        } catch(e) {
          // fallback
          const reader = new FileReader();
          const base64 = await new Promise<string>(res => {
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(file);
          });
          newValues.push(base64);
        }
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>(res => {
          reader.onloadend = () => res(reader.result as string);
          reader.readAsDataURL(file);
        });
        newValues.push(base64);
      }
    }
    
    onChange([...(Array.isArray(values) ? values : []), ...newValues]);
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
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      {Array.isArray(values) && values.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
          {values.map((val, idx) => {
            const isImage = typeof val === 'string' && val.startsWith('data:image/');
            return (
              <div key={idx} className="relative rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center h-24 p-2">
                {isImage ? (
                  <img src={val} alt="Preview" className="max-h-full max-w-full rounded object-contain" />
                ) : (
                  <div className="text-xs font-medium text-gray-600 text-center break-all w-full truncate px-1">File {idx+1}</div>
                )}
                <button 
                  type="button" 
                  onClick={() => handleRemove(idx)} 
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow z-10"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div 
        className={`relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={`w-6 h-6 mb-2 ${dragActive ? 'text-gray-900' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600 font-medium text-center">Klik atau Drop file di sini</p>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px] text-center">Maksimal ukuran file 2MB (Bisa pilih banyak)</p>
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

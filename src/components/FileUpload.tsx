import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { resizeImage } from '../lib/utils';

interface FileUploadProps {
  value: string;
  onChange: (base64Url: string) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ value, onChange, accept = "image/*", label = "Upload File" }: FileUploadProps) {
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

  const processFile = async (file: File) => {
    // optional limit size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please upload files under 2MB.");
      return;
    }
    
    if (file.type.startsWith('image/')) {
        try {
            const resized = await resizeImage(file, 800);
            onChange(resized);
            return;
        } catch(e) {}
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string || "");
    };
    reader.readAsDataURL(file);
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
  };

  const isImage = typeof value === 'string' && value.startsWith('data:image/');

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {value ? (
        <div className="relative rounded-lg border border-gray-200 bg-gray-50 p-2 flex items-center justify-center min-h-[100px]">
          {isImage ? (
            <img src={value} alt="Preview" className="max-h-32 rounded object-contain" />
          ) : (
            <div className="text-sm font-medium text-gray-600 truncate px-4">File terunggah berserta data.</div>
          )}
          <button 
            type="button" 
            onClick={handleRemove} 
            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div 
          className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className={`w-8 h-8 mb-2 ${dragActive ? 'text-gray-900' : 'text-gray-400'}`} />
          <p className="text-sm text-gray-600 font-medium text-center">Klik atau Drop file di sini</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px] text-center">Maksimal ukuran file 2MB</p>
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

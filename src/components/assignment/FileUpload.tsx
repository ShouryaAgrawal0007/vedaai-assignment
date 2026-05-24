import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: { name: string; size: string } | null) => void;
  selectedFile: { name: string; size: string } | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const simulateProgress = (fileName: string, fileSizeStr: string) => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onFileSelect({ name: fileName, size: fileSizeStr });
            setUploadProgress(null);
          }, 400);
          return 100;
        }
        return prev + 10;
      });
    }, 80);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = formatBytes(file.size);
      simulateProgress(file.name, sizeStr);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = formatBytes(file.size);
      simulateProgress(file.name, sizeStr);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
      
      {selectedFile ? (
        <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <File className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950 truncate max-w-[200px] sm:max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-xs text-zinc-500 font-bold">
                {selectedFile.size} • Uploaded
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-1.5 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors border border-zinc-200 bg-white"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : uploadProgress !== null ? (
        <div className="p-6 border border-zinc-200 bg-zinc-50 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#FF5722] rounded-full animate-ping" />
              Parsing source document...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FF5722] transition-all duration-100 ease-out" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 cursor-default transition-all duration-200 
            ${isDragActive 
              ? 'border-[#FF5722] bg-[#FFF3EB]/40' 
              : 'border-zinc-250 hover:border-zinc-350 bg-white'
            }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
            className="hidden"
          />
          
          <div className="p-3 text-zinc-800 rounded-full mb-2">
            <Upload className="w-6 h-6 stroke-[2px]" />
          </div>

          <p className="text-sm font-black text-zinc-900 text-center tracking-tight">
            Choose a file or drag & drop it here
          </p>
          <p className="text-[10px] text-zinc-400 font-bold text-center mt-1 uppercase tracking-wider">
            PDF, DOCX, JPEG, PNG, upto 10MB
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-6 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-250 text-zinc-800 font-extrabold text-xs rounded-full shadow-sm tracking-wide transition-all active:scale-[0.98]"
          >
            Browse Files
          </button>
        </div>
      )}
      
      <span className="text-[10px] font-bold text-zinc-400 text-center select-none">
        Upload images of your preferred document/image
      </span>
    </div>
  );
};

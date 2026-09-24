import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  HardDrive,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { UploadedFileMeta } from '../../types/form';
import { uploadFileToGoogleDrive } from '../../services/googleDrive';

interface FileUploadZoneProps {
  files: UploadedFileMeta[];
  onFilesChange: (files: UploadedFileMeta[]) => void;
  accessToken: string | null;
  maxFiles?: number;
  maxSizeMb?: number;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  onFilesChange,
  accessToken,
  maxFiles = 5,
  maxSizeMb = 50
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedExtensions = ['.pdf', '.ai', '.eps', '.psd', '.png', '.jpg', '.jpeg', '.tiff', '.zip'];

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const newFiles: File[] = Array.from(fileList);

    if (files.length + newFiles.length > maxFiles) {
      setErrorMessage(`Maximum limit of ${maxFiles} artwork files per request.`);
      return;
    }

    setIsUploading(true);
    const addedMetas: UploadedFileMeta[] = [];

    for (const file of newFiles) {
      // Validate file size
      if (file.size > maxSizeMb * 1024 * 1024) {
        setErrorMessage(`File "${file.name}" exceeds the ${maxSizeMb}MB maximum file limit.`);
        continue;
      }

      let driveLink: string | undefined;
      let driveId: string | undefined;

      // If user has active Google Drive access token, upload directly to Drive
      if (accessToken) {
        try {
          const driveResult = await uploadFileToGoogleDrive(accessToken, file);
          driveLink = driveResult.webViewLink;
          driveId = driveResult.fileId;
        } catch (err: any) {
          console.warn('Google Drive upload failed, falling back to local file attachment:', err);
        }
      }

      // Generate local preview URL if image
      let dataUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        try {
          dataUrl = await readFileAsDataUrl(file);
        } catch {}
      }

      addedMetas.push({
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl,
        driveFileId: driveId,
        driveViewLink: driveLink,
        uploadedAt: new Date().toISOString()
      });
    }

    onFilesChange([...files, ...addedMetas]);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|tiff)$/i)) {
      return <ImageIcon className="w-6 h-6 text-blue-500" />;
    }
    return <File className="w-6 h-6 text-slate-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-bold text-slate-900 dark:text-white">
          Upload Artwork & Print-Ready Files
        </label>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          PDF, AI, PSD, EPS, TIFF, High-Res PNG/JPG, ZIP (Up to {maxSizeMb}MB)
        </span>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-blue-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedExtensions.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              <span className="text-blue-600 dark:text-blue-400">Click to browse</span> or drag and drop artwork files
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Press-ready 300 DPI files with 0.125" bleed recommended
            </p>
          </div>

          {accessToken && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <HardDrive className="w-3 h-3" />
              <span>Direct Google Drive Cloud Storage Enabled</span>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Attached Files ({files.length} of {maxFiles})
          </p>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {file.dataUrl ? (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shrink-0">
                      {getFileIcon(file.type, file.name)}
                    </div>
                  )}

                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatFileSize(file.size)}</span>
                      {file.driveViewLink ? (
                        <a
                          href={file.driveViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <HardDrive className="w-3 h-3 text-emerald-500" />
                          <span>Google Drive Link</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

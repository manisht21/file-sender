import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, FileArchive, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

interface FileUploaderProps {
  endpoint?: string;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  onUploadComplete?: (files: UploadedFile[]) => void;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return FileArchive;
  if (type.includes('pdf') || type.includes('doc') || type.includes('text')) return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FileUploader: React.FC<FileUploaderProps> = ({
  endpoint = '/api/upload',
  maxFileSize = 10,
  acceptedTypes = ['*'],
  onUploadComplete,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File exceeds ${maxFileSize}MB limit`;
    }
    if (acceptedTypes[0] !== '*' && !acceptedTypes.some(type => file.type.match(type))) {
      return 'File type not accepted';
    }
    return null;
  }, [maxFileSize, acceptedTypes]);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const filesToAdd: UploadedFile[] = Array.from(newFiles).map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      status: 'pending' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...filesToAdd]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  const uploadFile = async (uploadedFile: UploadedFile): Promise<UploadedFile> => {
    const validationError = validateFile(uploadedFile.file);
    if (validationError) {
      return { ...uploadedFile, status: 'error', errorMessage: validationError };
    }

    const formData = new FormData();
    formData.append('file', uploadedFile.file);

    try {
      // Update status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadedFile.id ? { ...f, status: 'uploading' as const, progress: 10 } : f
        )
      );

      // Simulate progress updates (real progress would come from XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadedFile.id && f.status === 'uploading' && f.progress < 90
              ? { ...f, progress: Math.min(f.progress + 20, 90) }
              : f
          )
        );
      }, 200);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return { ...uploadedFile, status: 'success', progress: 100 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      return { ...uploadedFile, status: 'error', errorMessage, progress: 0 };
    }
  };

  const handleUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast({
        title: 'No files to upload',
        description: 'Please add files before uploading.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    const results = await Promise.all(pendingFiles.map(uploadFile));

    setFiles(prev =>
      prev.map(f => {
        const result = results.find(r => r.id === f.id);
        return result || f;
      })
    );

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    if (successCount > 0) {
      toast({
        title: 'Upload complete',
        description: `${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully.`,
      });
    }

    if (errorCount > 0) {
      toast({
        title: 'Some uploads failed',
        description: `${errorCount} file${errorCount > 1 ? 's' : ''} failed to upload.`,
        variant: 'destructive',
      });
    }

    setIsUploading(false);
    onUploadComplete?.(results);
  };

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Upload Zone */}
      <div
        className={`upload-zone p-8 cursor-pointer ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
        />
        
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary animate-bounce-subtle" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Maximum file size: {maxFileSize}MB
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              Files ({files.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((uploadedFile) => {
              const FileIcon = getFileIcon(uploadedFile.file.type);
              
              return (
                <div key={uploadedFile.id} className="file-item">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileIcon className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-2 progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {uploadedFile.status === 'error' && uploadedFile.errorMessage && (
                      <p className="text-xs text-destructive mt-1">
                        {uploadedFile.errorMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadedFile.status === 'pending' && (
                      <span className="status-badge pending">Pending</span>
                    )}
                    {uploadedFile.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    )}
                    {uploadedFile.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                    
                    {(uploadedFile.status === 'pending' || uploadedFile.status === 'error') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(uploadedFile.id);
                        }}
                        className="p-1 rounded-full hover:bg-muted transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload Button */}
          {pendingCount > 0 && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full mt-4"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;

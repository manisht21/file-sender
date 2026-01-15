import { FileUploader } from '@/components/FileUploader';
import { Cloud, Database, Shield } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-6">
            <Cloud className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Cloud File Upload
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Drag and drop your files or click to browse. Files are securely stored in the cloud.
          </p>
        </div>

        {/* File Uploader Component */}
        <FileUploader
          maxFileSize={10}
          onUploadComplete={(files) => {
            console.log('Upload complete:', files);
          }}
        />

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-card border text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">10MB</div>
            <div className="text-sm text-muted-foreground">Max file size</div>
          </div>
          <div className="p-5 rounded-xl bg-card border text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">All Types</div>
            <div className="text-sm text-muted-foreground">Supported</div>
          </div>
          <div className="p-5 rounded-xl bg-card border text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">Secure</div>
            <div className="text-sm text-muted-foreground">Cloud storage</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

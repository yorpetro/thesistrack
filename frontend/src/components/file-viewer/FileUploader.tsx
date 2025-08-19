import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadAttachment } from '../../services/attachmentService';
import { DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

type FileUploaderProps = {
  thesisId: string;
  onSuccess: () => void;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

const fileSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine(files => files.length > 0, "File is required")
    .refine(files => files[0]?.size <= MAX_FILE_SIZE, `Max file size is 10MB`)
    .refine(
      files => ACCEPTED_FILE_TYPES.includes(files[0]?.type),
      "Only PDF, DOC, DOCX, or TXT files are accepted"
    ),
  description: z.string().optional(),
});

type FileFormData = z.infer<typeof fileSchema>;

const FileUploader = ({ thesisId, onSuccess }: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FileFormData>({
    resolver: zodResolver(fileSchema)
  });
  
  const onSubmit = async (data: FileFormData) => {
    if (!data.file?.[0]) return;
    
    try {
      setUploading(true);
      setError(null);
      
      await uploadAttachment(thesisId, data.file[0], data.description);
      
      setSelectedFile(null);
      reset();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError('File size exceeds 10MB limit');
        return;
      }
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setError('Invalid file type. Only PDF, DOC, DOCX, or TXT files are accepted');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    reset();
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-secondary mb-1">
          File
        </label>
        <div className="flex flex-col items-center justify-center w-full">
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer 
            ${selectedFile ? 'border-primary bg-primary/5' : 'border-neutral bg-neutral-light'} 
            hover:bg-neutral transition-colors`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <DocumentArrowUpIcon className="w-8 h-8 mb-2 text-primary" />
                  <p className="text-sm text-secondary mb-1">{selectedFile.name}</p>
                  <p className="text-xs text-earth">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center"
                  >
                    <XMarkIcon className="w-4 h-4 mr-1" />
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <DocumentArrowUpIcon className="w-8 h-8 mb-3 text-earth" />
                  <p className="mb-1 text-sm text-secondary">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-earth">PDF, DOCX, DOC or TXT (Max 10MB)</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              {...register("file", {
                onChange: handleFileChange
              })}
            />
          </label>
        </div>
        {errors.file && (
          <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-secondary mb-1">
          Description (optional)
        </label>
        <textarea
          id="description"
          className="form-input w-full"
          rows={3}
          placeholder="Enter a description for this file"
          {...register("description")}
        />
      </div>
      
      {error && (
        <div className="p-2 bg-red-50 text-red-500 text-sm rounded">
          {error}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : 'Upload'}
        </button>
      </div>
    </form>
  );
};

export default FileUploader; 
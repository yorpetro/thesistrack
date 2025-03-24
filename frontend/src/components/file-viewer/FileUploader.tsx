import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadAttachment } from '../../services/attachmentService';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

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
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FileFormData>({
    resolver: zodResolver(fileSchema)
  });
  
  const onSubmit = async (data: FileFormData) => {
    if (!data.file?.[0]) return;
    
    try {
      setUploading(true);
      setError(null);
      
      await uploadAttachment(thesisId, data.file[0], data.description);
      
      reset();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium mb-4">Upload Document</h3>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            File
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <DocumentArrowUpIcon className="w-8 h-8 mb-3 text-gray-500" />
                <p className="mb-1 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF, DOCX, DOC or TXT (Max 10MB)</p>
              </div>
              <input 
                type="file" 
                className="hidden"
                accept=".pdf,.doc,.docx,.txt" 
                {...register("file")}
              />
            </label>
          </div>
          {errors.file && (
            <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Enter a description for this file"
            {...register("description")}
          />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-500 text-sm rounded">
            {error}
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default FileUploader; 
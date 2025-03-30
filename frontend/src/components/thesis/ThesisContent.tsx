import { useState, useRef, useEffect } from 'react';
import { ThesisWithRelations } from '../../types';
import ReactMarkdown from 'react-markdown';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

interface ThesisContentProps {
  thesis: ThesisWithRelations;
  onSave: (title: string, abstract: string) => Promise<void>;
}

const ThesisContent = ({ thesis, onSave }: ThesisContentProps) => {
  const [title, setTitle] = useState(thesis.title);
  const [abstract, setAbstract] = useState(thesis.abstract || '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingAbstract, setEditingAbstract] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const titleRef = useRef<HTMLInputElement>(null);
  const abstractRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
    }
    if (editingAbstract && abstractRef.current) {
      abstractRef.current.focus();
    }
  }, [editingTitle, editingAbstract]);

  const handleSave = async (newTitle: string, newAbstract: string) => {
    if (saving) return;
    
    setSaving(true);
    try {
      await onSave(newTitle, newAbstract);
    } catch (err) {
      console.error('Failed to save changes:', err);
      // Revert changes on error
      setTitle(thesis.title);
      setAbstract(thesis.abstract || '');
    } finally {
      setSaving(false);
      setEditingTitle(false);
      setEditingAbstract(false);
      setShowPreview(false);
    }
  };

  const handleTitleSubmit = () => {
    if (title !== thesis.title || abstract !== (thesis.abstract || '')) {
      handleSave(title, abstract);
    } else {
      setEditingTitle(false);
    }
  };

  const handleAbstractSubmit = () => {
    if (title !== thesis.title || abstract !== (thesis.abstract || '')) {
      handleSave(title, abstract);
    } else {
      setEditingAbstract(false);
      setShowPreview(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    isTitle: boolean
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isTitle) {
        handleTitleSubmit();
      } else {
        handleAbstractSubmit();
      }
    } else if (e.key === 'Escape') {
      if (isTitle) {
        setTitle(thesis.title);
        setEditingTitle(false);
      } else {
        setAbstract(thesis.abstract || '');
        setEditingAbstract(false);
        setShowPreview(false);
      }
    }
  };

  return (
    <div className="card">
      <div className="flex-1">
        {editingTitle ? (
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => handleKeyDown(e, true)}
            className="form-input w-full text-xl font-bold mb-4"
            placeholder="Thesis title"
          />
        ) : (
          <h1 
            onClick={() => setEditingTitle(true)}
            className="text-xl font-bold mb-4 text-secondary cursor-pointer hover:bg-neutral-light/50 px-2 py-1 -ml-2 rounded-custom transition-colors"
          >
            {thesis.title}
          </h1>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-secondary">Abstract</h3>
            {editingAbstract && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="btn-neutral btn-sm flex items-center"
              >
                {showPreview ? (
                  <>
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Edit
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4 mr-1.5" />
                    Preview
                  </>
                )}
              </button>
            )}
          </div>
          {editingAbstract ? (
            <div className="space-y-4">
              {showPreview ? (
                <div className="bg-neutral-light rounded-custom p-4">
                  <div className="prose max-w-none">
                    <ReactMarkdown>{abstract || '*No abstract provided*'}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <textarea
                  ref={abstractRef}
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  onBlur={handleAbstractSubmit}
                  onKeyDown={(e) => handleKeyDown(e, false)}
                  className="form-input w-full h-40 font-mono"
                  placeholder="Abstract (optional) - Markdown supported"
                />
              )}
              <div className="text-xs text-earth">
                <p>Supports Markdown formatting:</p>
                <ul className="list-disc list-inside">
                  <li># Header 1, ## Header 2, etc.</li>
                  <li>**bold**, *italic*, ~~strikethrough~~</li>
                  <li>[Link](url), ![Image](url)</li>
                  <li>- List items</li>
                  <li>1. Numbered lists</li>
                  <li>{'>>'} Blockquotes</li>
                </ul>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setEditingAbstract(true)}
              className="bg-neutral-light rounded-custom p-4 cursor-pointer hover:bg-neutral-light/70 transition-colors"
            >
              <div className="prose max-w-none">
                {thesis.abstract ? (
                  <ReactMarkdown>{thesis.abstract}</ReactMarkdown>
                ) : (
                  <p className="text-earth italic">No abstract provided</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThesisContent; 
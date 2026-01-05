import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaperType, PinColor } from '../types';

interface NewNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; category: string; paperColor: string; pinColor: PinColor }) => void;
}

const COLORS = [
  { bg: '#ffffff', label: 'White' },
  { bg: '#fef3c7', label: 'Cream' },
  { bg: '#dbeafe', label: 'Blue' },
  { bg: '#fce7f3', label: 'Pink' },
  { bg: '#dcfce7', label: 'Green' },
];

export const NewNoticeModal: React.FC<NewNoticeModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [selectedColor, setSelectedColor] = useState('#ffffff');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    onSave({
      title,
      content,
      category,
      paperColor: selectedColor,
      pinColor: 'red', // Default pin color
    });
    
    // Reset
    setTitle('');
    setContent('');
    setCategory('General');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">New Note</h2>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Weekly Meeting"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                  autoFocus
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Content</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write something..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-600 resize-none"
                />
              </div>

              {/* Options Row */}
              <div className="flex gap-4">
                 <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none"
                    >
                      <option>General</option>
                      <option>Work</option>
                      <option>Ideas</option>
                      <option>To-Do</option>
                    </select>
                 </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Color</label>
                <div className="flex gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setSelectedColor(c.bg)}
                      className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center transition-transform hover:scale-110 ${selectedColor === c.bg ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-slate-200'}`}
                      style={{ backgroundColor: c.bg }}
                      title={c.label}
                    >
                      {selectedColor === c.bg && <Check size={14} className="text-slate-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!title || !content}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Note
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

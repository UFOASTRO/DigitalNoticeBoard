import React from 'react';
import { X, Moon, Sun } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface GeneralSettingsModalProps {
  onClose: () => void;
}

export const GeneralSettingsModal: React.FC<GeneralSettingsModalProps> = ({ onClose }) => {
  const { theme, toggleTheme } = useStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold dark:text-white">General Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium dark:text-gray-200">Appearance</h3>
              
              <div className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-orange-500" />
                  )}
                  <div>
                    <div className="font-medium dark:text-white">Dark Mode</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Switch between light and dark themes
                    </div>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={theme === 'dark'} 
                    onChange={toggleTheme} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

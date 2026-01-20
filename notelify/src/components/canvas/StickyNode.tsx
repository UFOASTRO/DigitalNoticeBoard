import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { PaperNote } from '../PaperNote';

const StickyNode = ({ data, selected }: NodeProps) => {
  // data contains the pin object and other props we passed
  const { pin, onEdit, onMarkRead, currentUserId } = data;

  return (
    <div className={`relative group ${selected ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}>
      {/* Handles for connecting - High Z-Index to stay on top */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity z-50"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity z-50"
      />
      
      {/* 
         Render PaperNote with drag disabled so React Flow manages position.
         We REMOVED 'nodrag' so React Flow can capture drag events on the note body.
      */}
      <div>
          <PaperNote 
            pin={pin} 
            onEdit={onEdit}
            onMarkRead={onMarkRead}
            currentUserId={currentUserId}
            disableDrag={true} 
          />
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity z-50"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity z-50"
      />
    </div>
  );
};

export default memo(StickyNode);

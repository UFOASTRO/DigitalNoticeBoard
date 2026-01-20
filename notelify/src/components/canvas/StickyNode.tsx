import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PaperNote } from '../PaperNote';

const StickyNode = ({ data, selected }: NodeProps) => {
  // data contains the pin object and other props we passed
  const { pin, onEdit, onMarkRead, currentUserId } = data;

  return (
    <div className={`relative ${selected ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}>
      {/* Handles for connecting */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      
      {/* 
         We pass a modified version of the pin to PaperNote.
         The PaperNote component has internal drag logic using framer-motion which we need to disable
         because ReactFlow handles dragging.
         
         However, PaperNote expects onDragEnd. We can pass a dummy or refactor PaperNote.
         Better approach: Render PaperNote but suppress its drag capabilities if possible.
         Looking at PaperNote source, it uses <motion.div drag ...>.
         We might need to create a 'static' version or pass a prop to disable drag.
         For now, we will assume we can't easily change PaperNote without breaking other things,
         but we can try to disable drag via props if we add that capability to PaperNote
         OR we just wrap it in a div that captures events? 
         Actually, ReactFlow nodes are draggable by default. 
         If PaperNote has `drag` prop on motion.div, it will conflict.
      */}
      <div className="nodrag">
          {/* 
             We wrap PaperNote in 'nodrag' class so ReactFlow doesn't drag it? 
             No, we WANT ReactFlow to drag it. 
             But PaperNote has its own drag. 
             We should update PaperNote to accept a `disableDrag` prop.
          */}
          <PaperNote 
            pin={pin} 
            onEdit={onEdit}
            onMarkRead={onMarkRead}
            currentUserId={currentUserId}
            disableDrag={true} // We will add this prop to PaperNote
          />
      </div>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

export default memo(StickyNode);

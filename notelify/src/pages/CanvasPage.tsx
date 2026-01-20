import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  ConnectionMode,
  MarkerType,
  Connection,
  Node,
  ReactFlowProvider,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import StickyNode from '../components/canvas/StickyNode';
import { NewNoticeModal } from '../components/NewNoticeModal';
import { FloatingDock } from '../components/FloatingDock';
import { usePins } from '../hooks/usePins';
import { useConnections } from '../hooks/useConnections';
import { useStore } from '../store/useStore';
import { usePresence } from '../hooks/usePresence';

const nodeTypes = {
  sticky: StickyNode,
};

const CanvasContent = () => {
    const navigate = useNavigate();
    const { setActivePin } = useStore();
    const { pins, updatePinPosition, addPin, updatePinContent, markPinAsRead } = usePins();
    const { connections, addConnection } = useConnections();
    const { currentUser } = usePresence(); 
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPin, setEditingPin] = useState<any | null>(null);

    // React Flow State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Sync Pins -> Nodes
    useEffect(() => {
        // Transform pins to React Flow nodes
        const newNodes = pins.map(pin => ({
            id: pin.id,
            type: 'sticky',
            position: { x: pin.x, y: pin.y },
            data: { 
                pin, 
                onEdit: (p: any) => { setEditingPin(p); setIsModalOpen(true); },
                onMarkRead: markPinAsRead,
                currentUserId: currentUser?.id
            },
            // We can add dragHandle class to specific parts if needed, but StickyNode wraps PaperNote
        }));
        setNodes(newNodes);
    }, [pins, currentUser, markPinAsRead, setNodes]); 

    // Sync Connections -> Edges
    useEffect(() => {
        const newEdges = connections.map(conn => ({
            id: conn.id,
            source: conn.from_pin,
            target: conn.to_pin,
            type: 'smoothstep', // Modern orthogonal lines
            animated: true,
            style: { stroke: '#64748b', strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#64748b',
            },
        }));
        setEdges(newEdges);
    }, [connections, setEdges]);

    const handleNodeDragStop = useCallback((_event: any, node: Node) => {
        // Only update if position actually changed significantly to reduce writes
        updatePinPosition(node.id, node.position.x, node.position.y);
    }, [updatePinPosition]);

    const onConnect = useCallback((params: Connection) => {
        if (params.source && params.target) {
            addConnection(params.source, params.target);
        }
    }, [addConnection]);

    const handleSaveNotice = (data: any) => {
        const pinContent = {
            title: data.title,
            body: data.content,
            category: data.category,
            paperType: 'plain' as const,
            paperColor: data.paperColor,
            pinColor: data.pinColor,
        };
    
        if (editingPin) {
            updatePinContent(editingPin.id, pinContent);
            setEditingPin(null);
        } else {
            // Calculate center of screen or random position?
            // For now, centerish (React Flow coordinates start at 0,0 usually)
            addPin({
              type: 'sticky',
              content: pinContent,
              x: Math.random() * 200 + 100,
              y: Math.random() * 200 + 100
            });
        }
    };

    const handleNodeClick = (_: React.MouseEvent, node: Node) => {
        setActivePin(node.id);
    };

    const handlePaneClick = () => {
        setActivePin(null);
    };

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900 transition-colors">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={handleNodeDragStop}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                className="transition-colors"
                minZoom={0.1}
            >
                <Background 
                    color="#94a3b8" 
                    gap={24} 
                    size={2} 
                    variant={BackgroundVariant.Dots} 
                    className="opacity-50"
                />
                <Controls className="bg-white dark:bg-slate-800 dark:text-white border-slate-200 dark:border-slate-700" />
            </ReactFlow>

            <FloatingDock 
                onAddNote={() => { setEditingPin(null); setIsModalOpen(true); }}
                isConnectMode={false} // Handled by React Flow handles
                onToggleConnect={() => {}} 
                onDashboard={() => navigate('/dashboard')}
            />
            
            <NewNoticeModal 
                isOpen={isModalOpen} 
                onClose={() => { setIsModalOpen(false); setEditingPin(null); }}
                onSave={handleSaveNotice}
                initialData={editingPin?.content}
            />
        </div>
    );
};

export const CanvasPage = () => (
    <ReactFlowProvider>
        <CanvasContent />
    </ReactFlowProvider>
);

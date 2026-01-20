import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  ConnectionMode,
  type Connection,
  type Node,
  ReactFlowProvider,
  BackgroundVariant,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { MousePointer2 } from 'lucide-react';
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Canvas Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-red-50 text-red-800 p-8">
          <div className="max-w-md">
             <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
             <pre className="text-xs bg-red-100 p-4 rounded overflow-auto">
                {this.state.error?.message}
             </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const CanvasContent = () => {
    const navigate = useNavigate();
    const { setActivePin } = useStore();
    const { pins, updatePinPosition, addPin, updatePinContent, markPinAsRead } = usePins();
    const { connections, addConnection } = useConnections();
    const { currentUser, othersCursors, updateMyCursor } = usePresence(); 
    const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();

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
            type: 'simplebezier',
            style: { stroke: '#64748b', strokeWidth: 2 },
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

    const onPointerMove = (e: React.PointerEvent) => {
        // Wrap in try-catch to prevent crash if ReactFlow not ready
        try {
            const { x, y } = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            updateMyCursor(x, y);
        } catch (err) {
            // Ignore init errors
        }
    };

    return (
        <div 
            className="absolute inset-0 bg-slate-50 dark:bg-slate-900 transition-colors"
            style={{ width: '100%', height: '100%' }}
            onPointerMove={onPointerMove}
        >
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

            {/* Cursors Layer */}
            {othersCursors.map(cursor => {
                // Wrap in try-catch
                try {
                    const pos = flowToScreenPosition({ x: cursor.x, y: cursor.y });
                    const x = pos.x;
                    const y = pos.y;
                    
                    // Only render if on screen? (Optional optimization)
                    if (x < -50 || y < -50 || x > window.innerWidth + 50 || y > window.innerHeight + 50) return null;

                    return (
                        <div
                            key={cursor.userId}
                            className="absolute top-0 left-0 z-50 pointer-events-none flex flex-col items-start transition-transform duration-100 will-change-transform"
                            style={{ transform: `translate(${x}px, ${y}px)` }}
                        >
                            <MousePointer2 
                              size={20} 
                              fill={cursor.color} 
                              color={cursor.color}
                              className="drop-shadow-sm"
                            />
                            <span 
                              className="ml-4 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm whitespace-nowrap opacity-80"
                              style={{ backgroundColor: cursor.color }}
                            >
                              {cursor.name}
                            </span>
                        </div>
                    );
                } catch(e) { return null; }
            })}

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
        <ErrorBoundary>
            <CanvasContent />
        </ErrorBoundary>
    </ReactFlowProvider>
);

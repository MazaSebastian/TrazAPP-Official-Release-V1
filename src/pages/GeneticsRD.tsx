import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  Node,
  useReactFlow as useRf,
  NodeResizer
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FaDna, FaSeedling, FaMars, FaVenus, FaGenderless, FaCompressArrowsAlt, FaTimes, FaMicroscope, FaRedo } from 'react-icons/fa';
import * as Select from '@radix-ui/react-select'; // Import Radix UI Select
import { geneticsService } from '../services/geneticsService';
import { Genetic, PhenoHunt, Phenotype } from '../types/genetics';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ContainerOuter = styled(motion.div)`
  height: calc(100vh - 80px);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  padding: 1rem;
`;

const PageHeader = styled.div`
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const TitleContainer = styled.div`
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #4ade80;
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  p {
    color: #94a3b8;
    font-size: 0.95rem;
    margin: 0;
  }
`;

const PhenoHuntContainer = styled.div`
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(74, 222, 128, 0.4);
  border-radius: 1.25rem;
  width: 900px;
  max-width: 95vw;
  max-height: 85vh; /* Ensure it never exceeds viewport height */
  margin: 2rem 0; /* Add top/bottom breathing room */
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  .hunt-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;

    h2 { margin: 0; color: #4ade80; display: flex; align-items: center; gap: 0.5rem; }
    .close-btn { background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; transition: color 0.2s; }
    .close-btn:hover { color: #f8fafc; }
  }

  .hunt-body {
    padding: 2rem;
    overflow-y: auto; /* Enable internal scrolling */
    flex: 1;

    /* Custom thin scrollbar for aesthetics */
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: rgba(15, 23, 42, 0.5); 
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(74, 222, 128, 0.3); 
      border-radius: 10px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: rgba(74, 222, 128, 0.6); 
    }

    .empty-hunt {
      text-align: center;
      padding: 3rem 1rem;
      h3 { color: #f8fafc; margin-bottom: 0.5rem; }
      p { color: #94a3b8; margin-bottom: 2rem; }
      .batch-input {
        display: flex; justify-content: center; gap: 1rem;
        input { padding: 0.75rem; border-radius: 0.5rem; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1); color: white; width: 100px; text-align: center; }
        .start-btn { background: #4ade80; color: #0f172a; padding: 0.75rem 1.5rem; border-radius: 0.5rem; border: none; font-weight: bold; cursor: pointer; }
        .start-btn:hover { background: #22c55e; }
      }
    }

    .hunt-pipeline {
      display: flex; flex-direction: column; gap: 2rem;
      
      .pipeline-stats {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
        .stat-card {
          background: rgba(30,41,59,0.5); padding: 1rem; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column; align-items: center;
          .label { color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem; }
          .value { color: #f8fafc; font-size: 1.5rem; font-weight: bold; }
        }
      }

      .phenotypes-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;
        
        .pheno-card {
          background: rgba(30,41,59,0.8); border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.1); padding: 1rem;
          display: flex; flex-direction: column; gap: 1rem; transition: transform 0.2s;
          &:hover { transform: translateY(-2px); }

          &.status-evaluating { border-top: 3px solid #facc15; }
          &.status-discarded { border-top: 3px solid #ef4444; opacity: 0.6; }
          &.status-keeper { border-top: 3px solid #4ade80; box-shadow: 0 0 15px rgba(74, 222, 128, 0.2); }

          .pheno-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            h4 { margin: 0; color: #f8fafc; font-size: 1.1rem; }
            .badge { font-size: 0.7rem; padding: 0.25rem 0.5rem; border-radius: 1rem; background: rgba(255,255,255,0.1); }
          }
          
          .pheno-actions {
            display: flex; gap: 0.5rem; margin-top: auto;
            .action-btn { flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: none; font-size: 0.8rem; font-weight: bold; cursor: pointer; }
            .action-btn.discard { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.2); }
            .action-btn.discard:hover { background: rgba(239, 68, 68, 0.2); }
            .action-btn.keeper { background: rgba(74, 222, 128, 0.1); color: #86efac; border: 1px solid rgba(74, 222, 128, 0.2); }
            .action-btn.keeper:hover { background: rgba(74, 222, 128, 0.2); }
          }
        }
      }
    }
  }
`;

const Workspace = styled.div`
  flex: 1;
  display: flex;
  gap: 1rem;
  overflow: hidden;
`;

const SidebarContainer = styled.div`
  width: 300px;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
`;

const CanvasWrapper = styled.div`
  flex: 1;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 20px rgba(0, 0, 0, 0.4);

  /* Override React Flow Controls to match Dark Glassmorphism */
  .react-flow__controls {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(74, 222, 128, 0.2);
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.8) !important;
    backdrop-filter: blur(8px);
    overflow: hidden;
  }
  
  .react-flow__controls-button {
    background: transparent !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    color: #94a3b8 !important;
    fill: #94a3b8 !important;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(74, 222, 128, 0.1) !important;
      fill: #4ade80 !important;
      color: #4ade80 !important;
    }

    &:last-child {
      border-bottom: none !important;
    }
  }
`;

const GeneticsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  
  .draggable-card {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(74, 222, 128, 0.2);
    padding: 1rem;
    border-radius: 0.75rem;
    cursor: grab;
    transition: all 0.2s;
    
    &:hover {
      border-color: #4ade80;
      transform: translateY(-2px);
    }
    
    h4 {
      margin: 0 0 0.25rem 0;
      color: #e2e8f0;
    }
    span {
      color: #94a3b8;
      font-size: 0.8rem;
    }
  }
`;

const GlassModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  box-sizing: border-box;
`;

const GeneticModalContainer = styled.div`
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(74, 222, 128, 0.4);
  border-radius: 1.25rem;
  width: 600px;
  max-width: 95vw;
  max-height: 85vh;
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  .modal-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;

    h2 { margin: 0; color: #4ade80; display: flex; align-items: center; gap: 0.5rem; }
    .close-btn { background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; transition: color 0.2s; }
    .close-btn:hover { color: #f8fafc; }
  }

  .modal-body {
    padding: 2rem;
    overflow-y: auto;
    flex: 1;

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .info-item {
      background: rgba(30,41,59,0.5);
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(255,255,255,0.05);

      span { display: block; color: #94a3b8; font-size: 0.8rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.25rem; }
      strong { color: #f8fafc; font-size: 1.1rem; }
    }
  }
`;

const GlassModalContent = styled.div`
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(74, 222, 128, 0.4);
  padding: 2rem;
  border-radius: 1.25rem;
  width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  
  h3 { margin-top: 0; color: #4ade80; display: flex; align-items: center; gap: 0.5rem; }
  
  .form-group {
    margin-bottom: 1rem;
    label { display: block; margin-bottom: 0.5rem; font-size: 0.85rem; color: #cbd5e1; }
    input, select {
      width: 100%;
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(30, 41, 59, 0.8);
      color: white;
      transition: all 0.2s;
      outline: none;

      &:focus {
        border-color: rgba(74, 222, 128, 0.5);
        box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
      }
      
      option {
        background: #0f172a;
        color: #f8fafc;
      }
    }
  }

  .glass-select-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(30, 41, 59, 0.8);
    color: white;
    transition: all 0.2s;
    outline: none;
    font-size: 0.95rem;

    &:focus {
      border-color: rgba(74, 222, 128, 0.5);
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;

    button {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;

      &.cancel { 
        background: transparent; 
        color: #f8fafc; 
        border: 1px solid rgba(255,255,255,0.1); 
        &:hover { background: rgba(255, 255, 255, 0.05); }
      }
      &.save { 
        background: #4ade80; 
        color: #0f172a; 
        &:hover { background: #22c55e; }
      }
    }
  }
`;

const GlassSelectContent = styled(Select.Content)`
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  width: var(--radix-select-trigger-width);

  .glass-select-item {
    padding: 0.75rem 1rem;
    color: #f8fafc;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    outline: none;

    &:hover, &[data-highlighted] {
      background: rgba(74, 222, 128, 0.15);
      color: #4ade80;
    }
  }
`;

// --- CUSTOM NODES ---
const StyledGeneticNode = styled.div`
  container-type: size;
  container-name: genetic-node;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 222, 128, 0.4);
  border-radius: 12px;
  padding: 10px;
  color: white;
  min-width: 120px;
  min-height: 50px;
  width: 100%;
  height: 100%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  font-family: inherit;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;

  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 1rem;
    color: #4ade80;
    margin-bottom: 5px;
    white-space: nowrap;
    
    .text-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  .node-body {
    font-size: 0.8rem;
    color: #cbd5e1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow: hidden;

    .type-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .text-truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .handle-custom {
    width: 10px;
    height: 10px;
    background: #4ade80;
    border: 2px solid #0f172a;
  }

  /* --- Responsive Container Queries --- */
  @container genetic-node (max-width: 160px) {
    padding: 8px;
    .node-header { font-size: 0.85rem; gap: 4px; }
    .node-body .text-label { display: none; }
    .node-body { font-size: 0.75rem; }
  }

  @container genetic-node (max-height: 70px) {
    .node-body { display: none; }
    .node-header { margin-bottom: 0; }
  }
`;

const StyledCrossNode = styled.div`
  background: rgba(56, 189, 248, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid #38bdf8;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
  text-align: center;
  padding: 2px;
  position: relative;

  svg { font-size: 0.9rem; color: #38bdf8; margin-bottom: 1px; }
  .cross-name { 
    font-size: 0.6rem; 
    font-weight: bold; 
    line-height: 1; 
    white-space: nowrap; 
    overflow: hidden; 
    text-overflow: ellipsis; 
    max-width: 40px; 
  }
  .cross-type { 
    font-size: 0.5rem; 
    color: #bae6fd; 
    background: rgba(56, 189, 248, 0.2); 
    padding: 1px 3px; 
    border-radius: 6px; 
    margin-top: 2px; 
  }

  .handle-custom {
    width: 6px;
    height: 6px;
    background: #38bdf8;
    border: 1px solid #0f172a;
  }
`;

const GeneticNode = ({ data, selected }: { data: any, selected?: boolean }) => (
  <>
    <NodeResizer minWidth={120} minHeight={50} isVisible={selected} handleStyle={{ width: 8, height: 8, background: '#4ade80', borderRadius: '50%', border: '1px solid #0f172a' }} lineStyle={{ border: '1px dashed rgba(74, 222, 128, 0.5)' }} />
    <StyledGeneticNode>
      <Handle type="target" position={Position.Top} className="handle-custom" />
      <div className="node-header">
        <FaDna style={{ flexShrink: 0 }} /> <span className="text-truncate">{data.label}</span>
      </div>
      <div className="node-body">
        {data.type && (
          <span className="type-badge">
            {data.type === 'Feminizada' ? <FaVenus color="#f472b6" style={{ flexShrink: 0 }} /> : data.type === 'Regular' ? <FaMars color="#60a5fa" style={{ flexShrink: 0 }} /> : <FaGenderless color="#94a3b8" style={{ flexShrink: 0 }} />}
            <span className="text-label">{data.type}</span>
          </span>
        )}
        {data.strainType && <span className="text-truncate"><span className="text-label">• {data.strainType}</span></span>}
      </div>
      <Handle type="source" position={Position.Bottom} className="handle-custom" />
    </StyledGeneticNode>
  </>
);

const CrossNode = ({ data }: { data: any }) => (
  <StyledCrossNode>
    <Handle type="target" position={Position.Top} className="handle-custom" />
    <FaCompressArrowsAlt />
    <div className="cross-name">{data.objective || 'Nuevo Cruce'}</div>
    <div className="cross-type">{data.crossType || 'F1'}</div>
    <Handle type="source" position={Position.Bottom} className="handle-custom" />
  </StyledCrossNode>
);

const nodeTypes = { geneticNode: GeneticNode, crossNode: CrossNode };

let id = 1;
const getId = () => `node_${Date.now()}_${id++}`;

const InteractionCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, getNode } = useReactFlow();
  const [genetics, setGenetics] = useState<Genetic[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Track initialization to prevent saving empty state on first load
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // Pheno Hunt Modal State
  const [selectedCrossNode, setSelectedCrossNode] = useState<Node | null>(null);
  const [phenoHuntData, setPhenoHuntData] = useState<PhenoHunt | null>(null);
  const [selectedGeneticNodeData, setSelectedGeneticNodeData] = useState<any>(null);
  const [loadingHunt, setLoadingHunt] = useState(false);
  const [batchSizeInput, setBatchSizeInput] = useState<number>(10);

  // Modal State
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [crossObjective, setCrossObjective] = useState('');
  const [crossType, setCrossType] = useState('F1');

  useEffect(() => {
    loadGenetics();
    loadPersistedCanvas();
  }, []);

  const loadGenetics = async () => {
    try {
      const data = await geneticsService.getGenetics();
      setGenetics(data);
    } catch (error) {
      console.error("Error loading genetics", error);
    }
  };

  const loadPersistedCanvas = async () => {
    setLoading(true);
    try {
        const { nodes: savedNodes, edges: savedEdges } = await geneticsService.loadCanvasState();
        if (savedNodes.length > 0) setNodes(savedNodes as Node[]);
        if (savedEdges.length > 0) setEdges(savedEdges as Edge[]);
    } catch (error) {
        console.error("Error loading canvas:", error);
    } finally {
        setLoading(false);
        // Small delay to ensure state is set before we allow saves
        setTimeout(() => setIsInitialized(true), 500); 
    }
  };

  // Auto-Save Effect (Debounced)
  useEffect(() => {
      if (!isInitialized) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
          await geneticsService.saveCanvasState(nodes, edges);
      }, 1500); // 1.5s debounce

      return () => {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      }
  }, [nodes, edges, isInitialized]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Intercept the connection to open the modal instead of connecting directly
      setPendingConnection(params);
    },
    []
  );

  const confirmCross = () => {
    if (!pendingConnection) return;

    const sourceNode = getNode(pendingConnection.source);
    const targetNode = getNode(pendingConnection.target);

    if (sourceNode && targetNode) {
      // Calculate midpoint
      const midX = (sourceNode.position.x + targetNode.position.x) / 2;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2;

      const crossNodeId = getId();
      const newCrossNode: Node = {
        id: crossNodeId,
        type: 'crossNode',
        position: { x: midX, y: midY },
        data: { objective: crossObjective, crossType }
      };

      const edge1: Edge = { id: `e_${sourceNode.id}-${crossNodeId}`, source: sourceNode.id, target: crossNodeId, type: 'smoothstep', animated: true };
      const edge2: Edge = { id: `e_${crossNodeId}-${targetNode.id}`, source: crossNodeId, target: targetNode.id, type: 'smoothstep', animated: true };

      setNodes((nds) => nds.concat(newCrossNode));
      setEdges((eds) => eds.concat(edge1, edge2));
    }

    setPendingConnection(null);
    setCrossObjective('');
    setCrossType('F1');
  };

  const onDragStart = (event: React.DragEvent, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow', 'geneticNode');
    event.dataTransfer.setData('application/geneticData', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const geneticDataStr = event.dataTransfer.getData('application/geneticData');

      if (typeof type === 'undefined' || !type || !geneticDataStr) {
        return;
      }

      const geneticData = JSON.parse(geneticDataStr);
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: geneticData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );
  
  const onNodeDoubleClick = async (event: React.MouseEvent, node: Node) => {
    if (node.type === 'crossNode') {
      setSelectedCrossNode(node);
      setLoadingHunt(true);
      try {
        const hunt = await geneticsService.getPhenoHuntByNodeId(node.id);
        setPhenoHuntData(hunt); // Null if none exists
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHunt(false);
      }
    } else if (node.type === 'geneticNode') {
      setSelectedGeneticNodeData(node.data);
    }
  };

  const handleStartPhenoHunt = async () => {
    if (!selectedCrossNode || batchSizeInput <= 0) return;
    setLoadingHunt(true);
    try {
      const newHunt = await geneticsService.createPhenoHunt(selectedCrossNode.id, batchSizeInput);
      setPhenoHuntData(newHunt);
    } catch (error) {
       console.error(error);
    } finally {
       setLoadingHunt(false);
    }
  };

  const togglePhenotypeStatus = async (pheno: Phenotype, newStatus: 'evaluating' | 'discarded' | 'keeper') => {
      // Optimistic update
      if (!phenoHuntData || !phenoHuntData.phenotypes) return;
      const updatedList = phenoHuntData.phenotypes.map(p => 
          p.id === pheno.id ? { ...p, status: newStatus } : p
      );
      setPhenoHuntData({ ...phenoHuntData, phenotypes: updatedList });

      // Request
      await geneticsService.updatePhenotype(pheno.id, { status: newStatus });
  };

  const refreshNodes = async () => {
      await loadPersistedCanvas();
  }

  return (
    <ContainerOuter>
      <PageHeader>
        <TitleContainer>
          <h1><FaMicroscope /> Laboratorio I+D (Pheno Hunting)</h1>
          <p>Arrastra genéticas de tu inventario al lienzo para crear y trackear cruces, retrocruces (BX) y crías S1.</p>
        </TitleContainer>
        <button className="refresh-btn" onClick={refreshNodes} title="Recargar Canva" style={{ background: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}>
            <FaRedo />
        </button>
      </PageHeader>

      <Workspace>
        {/* Left Sidebar for Dragging */}
        <SidebarContainer>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>Tus Genéticas</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 0 }}>
            {loading ? 'Cargando inventario...' : 'Arrastra (Drag & Drop) hacia el lienzo.'}
          </p>
          
          <GeneticsList>
            {loading ? (
               <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                 <LoadingSpinner />
               </div>
            ) : genetics.length === 0 ? (
               <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>No hay genéticas en tu catálogo.</p>
            ) : (
              genetics.map(g => (
                <div 
                  key={g.id}
                  className="draggable-card" 
                  draggable 
                  onDragStart={(e) => onDragStart(e, { label: g.name, type: g.type === 'photoperiodic' ? 'Feminizada' : 'Automática', strainType: g.nomenclatura || 'Híbrida' })}
                >
                  <h4>{g.name}</h4>
                  <span>{g.type === 'photoperiodic' ? 'Feminizada' : 'Automática'} {g.nomenclatura ? `• ${g.nomenclatura}` : ''}</span>
                </div>
              ))
            )}
          </GeneticsList>
        </SidebarContainer>

        {/* Main Canvas */}
        <CanvasWrapper>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: '#0f172a' }} // Dark bg
          >
            <Background color="#334155" gap={20} size={1} />
            <Controls style={{ background: 'rgba(30, 41, 59, 0.9)', fill: '#fff', padding: '5px', borderRadius: '8px', border: 'none' }} />
            <MiniMap 
              nodeColor={(node) => {
                if (node.type === 'crossNode') return '#38bdf8';
                return '#4ade80';
              }} 
              maskColor="rgba(15, 23, 42, 0.8)" 
              style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
            />
          </ReactFlow>
          
          {/* Form Modal when connecting two nodes */}
          {pendingConnection && (
             <GlassModalOverlay onClick={() => setPendingConnection(null)}>
               <GlassModalContent onClick={(e) => e.stopPropagation()}>
                 <h3><FaCompressArrowsAlt /> Configurar Nuevo Cruce</h3>
                 <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                   Estás documentando la combinación entre el Donante (Polen) y el Receptor (Madre).
                 </p>
                 
                 <div className="form-group">
                   <label>Cepa Resultante / Objetivo</label>
                   <input 
                     type="text" 
                     placeholder="Ej: F1 Frosty Glue" 
                     value={crossObjective}
                     onChange={(e) => setCrossObjective(e.target.value)}
                   />
                 </div>
                 
                 <div className="form-group">
                   <label>Tipo de Cruce</label>
                   <Select.Root value={crossType} onValueChange={setCrossType}>
                     <Select.Trigger className="glass-select-trigger" aria-label="Tipo de Cruce">
                       <Select.Value />
                       <Select.Icon />
                     </Select.Trigger>
                     <Select.Portal>
                       <GlassSelectContent position="popper" sideOffset={5}>
                         <Select.Viewport>
                           <Select.Item value="F1" className="glass-select-item">
                             <Select.ItemText>F1 (Primer Filial - Nuevo Cruce)</Select.ItemText>
                           </Select.Item>
                           <Select.Item value="F2" className="glass-select-item">
                             <Select.ItemText>F2 (Cruce entre hermanos F1)</Select.ItemText>
                           </Select.Item>
                           <Select.Item value="BX" className="glass-select-item">
                             <Select.ItemText>BX (Retrocruce hacia la madre)</Select.ItemText>
                           </Select.Item>
                           <Select.Item value="S1" className="glass-select-item">
                             <Select.ItemText>S1 (Selfing / Auto-polinización STS)</Select.ItemText>
                           </Select.Item>
                         </Select.Viewport>
                       </GlassSelectContent>
                     </Select.Portal>
                   </Select.Root>
                 </div>

                 <div className="actions">
                   <button className="cancel" onClick={() => setPendingConnection(null)}>Cancelar</button>
                   <button className="save" onClick={confirmCross}>Guardar Cruce</button>
                 </div>
               </GlassModalContent>
             </GlassModalOverlay>
          )}

          {/* Pheno Hunt Interactive Modal */}
          {selectedCrossNode && (
            <GlassModalOverlay onClick={() => setSelectedCrossNode(null)}>
               <PhenoHuntContainer onClick={(e) => e.stopPropagation()}>
                 <div className="hunt-header">
                     <h2><FaDna /> Pipeline de Pheno Hunting</h2>
                     <button className="close-btn" onClick={() => setSelectedCrossNode(null)}>✕</button>
                 </div>
                 
                 <div className="hunt-body">
                    {loadingHunt ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><LoadingSpinner /></div>
                    ) : !phenoHuntData ? (
                        <div className="empty-hunt">
                            <h3>Iniciar Cacería de Fenotipos</h3>
                            <p>Este nodo de cruce aún no tiene fenotipos registrados. ¿Cuántas semillas has germinado de esta cruza?</p>
                            <div className="batch-input">
                                <input type="number" min="1" max="1000" value={batchSizeInput} onChange={e => setBatchSizeInput(Number(e.target.value))} />
                                <button className="start-btn" onClick={handleStartPhenoHunt}>Comenzar (Registrar {batchSizeInput} Plantas)</button>
                            </div>
                        </div>
                    ) : (
                        <div className="hunt-pipeline">
                            <div className="pipeline-stats">
                                <div className="stat-card">
                                    <span className="label">Semillas Germinadas</span>
                                    <span className="value">{phenoHuntData.batch_size}</span>
                                </div>
                                <div className="stat-card">
                                    <span className="label">Descartadas</span>
                                    <span className="value" style={{color: '#ef4444'}}>
                                        {phenoHuntData.phenotypes?.filter(p => p.status === 'discarded').length || 0}
                                    </span>
                                </div>
                                <div className="stat-card">
                                    <span className="label">En Evaluación</span>
                                    <span className="value" style={{color: '#facc15'}}>
                                        {phenoHuntData.phenotypes?.filter(p => p.status === 'evaluating').length || 0}
                                    </span>
                                </div>
                                <div className="stat-card">
                                    <span className="label">Keepers Seleccionadas</span>
                                    <span className="value" style={{color: '#4ade80'}}>
                                        {phenoHuntData.phenotypes?.filter(p => p.status === 'keeper').length || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="phenotypes-grid">
                                {phenoHuntData.phenotypes?.map(pheno => (
                                    <div key={pheno.id} className={`pheno-card status-${pheno.status}`}>
                                        <div className="pheno-header">
                                            <h4>Fenotipo #{pheno.pheno_number}</h4>
                                            <span className="badge">{pheno.status === 'evaluating' ? 'Evaluando' : pheno.status === 'discarded' ? 'Descartada' : 'Keeper 🏆'}</span>
                                        </div>
                                        <div className="pheno-actions">
                                            {pheno.status !== 'discarded' && (
                                                <button className="action-btn discard" onClick={() => togglePhenotypeStatus(pheno, 'discarded')}>Descartar</button>
                                            )}
                                            {pheno.status !== 'keeper' && (
                                                <button className="action-btn keeper" onClick={() => togglePhenotypeStatus(pheno, 'keeper')}>Marcar como Keeper</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
               </PhenoHuntContainer>
            </GlassModalOverlay>
          )}

          {selectedGeneticNodeData && (
            <GlassModalOverlay onClick={() => setSelectedGeneticNodeData(null)}>
               <GeneticModalContainer onClick={(e) => e.stopPropagation()}>
                 <div className="modal-header">
                     <h2><FaDna /> Información Genética</h2>
                     <button className="close-btn" onClick={() => setSelectedGeneticNodeData(null)}>✕</button>
                 </div>
                 
                 <div className="modal-body">
                    <div className="info-grid">
                        <div className="info-item">
                            <span>Nombre</span>
                            <strong>{selectedGeneticNodeData.label}</strong>
                        </div>
                        <div className="info-item">
                            <span>Sexo</span>
                            <strong>{selectedGeneticNodeData.type}</strong>
                        </div>
                        {selectedGeneticNodeData.strainType && (
                          <div className="info-item" style={{ gridColumn: 'span 2' }}>
                              <span>Tipo de Cepa</span>
                              <strong>{selectedGeneticNodeData.strainType}</strong>
                          </div>
                        )}
                    </div>
                 </div>
               </GeneticModalContainer>
            </GlassModalOverlay>
          )}

        </CanvasWrapper>
      </Workspace>
    </ContainerOuter>
  );
};

const GeneticsRD: React.FC = () => {
  return (
    <ReactFlowProvider>
      <InteractionCanvas />
    </ReactFlowProvider>
  );
};

export default GeneticsRD;

import { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

function TeamStar({ team, index, onClick, reduceMotion }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  // Calculate progress on X-axis (from 0.1 to 1.0)
  const getProgress = () => {
    if (team.status === 'submitted') return 1.0
    if (team.status === 'in_progress') return 0.6
    return 0.2 // problem_pending
  }

  // Color mapping based on status and overdue flag
  const getColor = () => {
    if (team.isOverdue) return '#E8544C' // Red (Overdue)
    if (team.status === 'problem_pending') return '#F2B84B' // Gold (Problem Pending)
    return '#3ECF8E' // Teal/Green (On Track)
  }

  // Calculate X, Y, Z coordinates
  // X scales with progress. Y & Z use static deterministic jitter to prevent overlaps
  const progress = getProgress()
  const x = (progress - 0.5) * 8 // map 0-1 to -4 to +4
  const y = Math.sin(index * 1.7) * 1.5
  const z = Math.cos(index * 2.3) * 1.5

  useFrame((state) => {
    if (!reduceMotion && meshRef.current) {
      // Gentle pulse based on index
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 2 + index) * 0.08
      meshRef.current.scale.setScalar(pulse)
    }
  })

  // Format deadline text
  const getDeadlineText = () => {
    if (team.status === 'submitted') return 'Fully Submitted'
    if (!team.batchId?.endDate) return 'No deadline set'
    const end = new Date(team.batchId.endDate)
    const now = new Date()
    const diffTime = end - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`
    return `${diffDays} days remaining`
  }

  return (
    <group position={[x, y, z]}>
      <mesh
        ref={meshRef}
        onClick={() => onClick(team)}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      >
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={getColor()} toneMapped={false} />
      </mesh>

      {/* Tooltip on Hover */}
      {hovered && (
        <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(11, 14, 26, 0.95)',
            border: `1px solid ${getColor()}`,
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#EDEFF5',
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            transform: 'translate(-50%, -120%)'
          }}>
            <strong style={{ display: 'block', fontSize: '12px', color: '#EDEFF5', fontFamily: 'Space Grotesk' }}>{team.name}</strong>
            <div style={{ color: '#8B92A8', fontSize: '10px', marginTop: 2 }}>
              College: <span style={{ color: '#EDEFF5' }}>{team.collegeId?.name || 'Unknown'}</span>
            </div>
            <div style={{ color: '#8B92A8', fontSize: '10px' }}>
              Status: <span style={{ color: getColor(), fontWeight: 600 }}>{team.status.toUpperCase()}</span>
            </div>
            <div style={{ color: '#8B92A8', fontSize: '10px' }}>
              Deadline: <span style={{ color: team.isOverdue ? '#E8544C' : '#3ECF8E' }}>{getDeadlineText()}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

function ConstellationConnections({ teams }) {
  // Connect teams to form a trail network
  const positions = teams.map((team, index) => {
    const getProgress = () => {
      if (team.status === 'submitted') return 1.0
      if (team.status === 'in_progress') return 0.6
      return 0.2
    }
    const progress = getProgress()
    const x = (progress - 0.5) * 8
    const y = Math.sin(index * 1.7) * 1.5
    const z = Math.cos(index * 2.3) * 1.5
    return new THREE.Vector3(x, y, z)
  })

  // Build connecting segment lines sequentially
  const linePoints = []
  for (let i = 0; i < positions.length - 1; i++) {
    linePoints.push(positions[i].x, positions[i].y, positions[i].z)
    linePoints.push(positions[i + 1].x, positions[i + 1].y, positions[i + 1].z)
  }

  if (linePoints.length === 0) return null

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(linePoints), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#2A2E44" linewidth={1} />
    </lineSegments>
  )
}

function GalaxyScene({ cappedTeams, onTeamClick, reduceMotion }) {
  const groupRef = useRef()
  useFrame((state) => {
    if (!reduceMotion && groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05
    }
  })
  return (
    <group ref={groupRef}>
      <ConstellationConnections teams={cappedTeams} />
      {cappedTeams.map((team, i) => (
        <TeamStar
          key={team._id}
          team={team}
          index={i}
          onClick={onTeamClick}
          reduceMotion={reduceMotion}
        />
      ))}
    </group>
  )
}

export default function TeamOverviewGalaxy({ teams = [], onTeamClick }) {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Limit rendering to 40 teams to guarantee 60fps performance
  const cappedTeams = teams.slice(0, 40)
  const remainder = teams.length - 40

  return (
    <div style={{
      width: '100%',
      height: '350px',
      background: '#0B0E1A',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.05)',
      marginBottom: '24px'
    }}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8B92A8', fontSize: '13px' }}>
          Simulating Team Status Constellation...
        </div>
      }>
        <Canvas camera={{ position: [0, 4, 10], fov: 45 }}>
          <color attach="background" args={['#0B0E1A']} />
          <ambientLight intensity={0.6} />
          
          {cappedTeams.length > 0 && (
            <GalaxyScene
              cappedTeams={cappedTeams}
              onTeamClick={onTeamClick}
              reduceMotion={reduceMotion}
            />
          )}

          <OrbitControls enableZoom={true} maxDistance={15} minDistance={4} />
        </Canvas>
      </Suspense>

      {/* Galaxy header labels */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '16px',
        pointerEvents: 'none',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '11px',
        color: '#EDEFF5'
      }}>
        <strong style={{ color: '#3ECF8E' }}>Team Progress Galaxy</strong> (X-Axis: Left = pending, Right = submitted)
      </div>

      {remainder > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          pointerEvents: 'none',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: '#F2B84B',
          background: 'rgba(242,184,75,0.08)',
          border: '1px solid rgba(242,184,75,0.2)',
          borderRadius: '4px',
          padding: '2px 6px'
        }}>
          + {remainder} more teams hidden for performance
        </div>
      )}

      {/* Color status key */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '16px',
        pointerEvents: 'none',
        display: 'flex',
        gap: '14px',
        fontSize: '9px',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3ECF8E' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3ECF8E' }} /> Active/On Track
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F2B84B' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F2B84B' }} /> Pending Select
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E8544C' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8544C' }} /> Overdue
        </span>
      </div>
    </div>
  )
}

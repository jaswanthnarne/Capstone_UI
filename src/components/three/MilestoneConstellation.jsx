import { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

function StageStar({ index, stage, onClick, reduceMotion }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  // Color mapping based on status
  const getColor = () => {
    if (stage.status === 'done') return '#F2B84B' // Gold
    if (stage.status === 'current') return '#3ECF8E' // Green
    return '#4A4E68' // Dim
  }

  // Pulsing animation for current stage
  useFrame((state) => {
    if (!reduceMotion && meshRef.current) {
      if (stage.status === 'current') {
        const pulse = 1.2 + Math.sin(state.clock.getElapsedTime() * 4) * 0.12
        meshRef.current.scale.setScalar(pulse)
      } else {
        const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 1.5 + index) * 0.04
        meshRef.current.scale.setScalar(pulse)
      }
    }
  })

  const xPosition = (index - 2) * 2.2 // Space out stages along x axis

  return (
    <group position={[xPosition, 0, 0]}>
      <mesh
        ref={meshRef}
        onClick={() => onClick(stage.label)}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      >
        <sphereGeometry args={[stage.status === 'current' ? 0.22 : 0.18, 24, 24]} />
        <meshBasicMaterial color={getColor()} toneMapped={false} />
      </mesh>

      {/* Label always visible underneath */}
      <Html distanceFactor={10} position={[0, -0.4, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: stage.status === 'pending' ? '#8B92A8' : '#EDEFF5',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: '10px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          transform: 'translateX(-50%)',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
        }}>
          {stage.label}
        </div>
      </Html>

      {/* Tooltip on Hover */}
      {hovered && (
        <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(11, 14, 26, 0.95)',
            border: `1px solid ${getColor()}`,
            borderRadius: '6px',
            padding: '6px 10px',
            color: '#EDEFF5',
            fontSize: '10px',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            transform: 'translate(-50%, -130%)'
          }}>
            Status: <strong style={{ color: getColor() }}>{stage.status.toUpperCase()}</strong>
          </div>
        </Html>
      )}
    </group>
  )
}

function ConstellationLines({ stages }) {
  // Generate points list
  const points = stages.map((_, i) => new THREE.Vector3((i - 2) * 2.2, 0, 0))

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[
            new Float32Array(points.flatMap(p => [p.x, p.y, p.z])),
            3
          ]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#2A2E44" linewidth={2} />
    </line>
  )
}

export default function MilestoneConstellation({ stages, onStageClick }) {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '160px',
      background: '#0B0E1A',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.05)',
      marginBottom: '24px'
    }}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8B92A8', fontSize: '13px' }}>
          Initializing Progress Constellation...
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
          <color attach="background" args={['#0B0E1A']} />
          <ambientLight intensity={0.8} />
          {stages && stages.length > 0 && (
            <>
              <ConstellationLines stages={stages} />
              {stages.map((stage, i) => (
                <StageStar
                  key={i}
                  index={i}
                  stage={stage}
                  onClick={onStageClick}
                  reduceMotion={reduceMotion}
                />
              ))}
            </>
          )}
          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>
      </Suspense>

      <div style={{
        position: 'absolute',
        top: '12px',
        left: '16px',
        pointerEvents: 'none',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '9px',
        color: '#8B92A8'
      }}>
        MILESTONE TRAJECTORY NODE MAP
      </div>
    </div>
  )
}

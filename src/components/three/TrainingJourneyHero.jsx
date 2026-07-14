import { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { getCollegesSummary } from '../../services/api'

function StarsSpiral({ colleges, reduceMotion }) {
  const groupRef = useRef()

  // Generate spiral positions
  // Fermat's spiral: r = a * sqrt(theta)
  const stars = colleges.map((college, i) => {
    const theta = i * 1.6 + 2.0
    const r = 2.4 * Math.sqrt(theta)
    const x = r * Math.cos(theta)
    const z = r * Math.sin(theta)
    const y = (Math.sin(i * 1.5) * 0.4) // subtle wave height
    return {
      id: i,
      position: [x, y, z],
      name: college.name,
      students: college.studentsTrained,
    }
  })

  // Disable rotation if reduceMotion is true
  useFrame((state) => {
    if (!reduceMotion && groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.08
    }
  })

  return (
    <group ref={groupRef}>
      {/* Draw spiral trail line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(stars.flatMap(s => s.position)),
              3
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#2A2E44" linewidth={1.5} />
      </line>

      {/* Render individual College stars */}
      {stars.map((star) => (
        <CollegeStar key={star.id} star={star} reduceMotion={reduceMotion} />
      ))}
    </group>
  )
}

function CollegeStar({ star, reduceMotion }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  // Pulsing animation if motion is allowed
  useFrame((state) => {
    if (!reduceMotion && meshRef.current) {
      const pulse = 1 + Math.sin(state.clock.getElapsedTime() * 3 + star.id) * 0.08
      meshRef.current.scale.setScalar(pulse)
    }
  })

  // Scale node based on students trained count
  const sizeMultiplier = Math.max(0.12, Math.min(0.3, star.students / 200))

  return (
    <group position={star.position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[sizeMultiplier, 16, 16]} />
        <meshBasicMaterial
          color={hovered ? '#3ECF8E' : '#F2B84B'}
          toneMapped={false}
        />
      </mesh>

      {/* HTML tooltip on Hover */}
      {hovered && (
        <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(11, 14, 26, 0.95)',
            border: '1px solid #F2B84B',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#EDEFF5',
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            transform: 'translate(-50%, -120%)'
          }}>
            <strong style={{ display: 'block', fontSize: '12px', color: '#EDEFF5', fontFamily: 'Space Grotesk' }}>{star.name}</strong>
            <span style={{ color: '#8B92A8', fontSize: '10px' }}>Trained: <strong style={{ color: '#3ECF8E' }}>{star.students} Students</strong></span>
          </div>
        </Html>
      )}
    </group>
  )
}

export default function TrainingJourneyHero() {
  const [colleges, setColleges] = useState([])
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    // Detect reduced motion preference
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)

    // Load data
    getCollegesSummary()
      .then((res) => {
        // Limit visible stars to 40
        const sorted = (res.data.data || []).sort((a, b) => b.studentsTrained - a.studentsTrained)
        setColleges(sorted.slice(0, 40))
      })
      .catch((err) => console.error('Failed to load college galaxy hero', err))
  }, [])

  return (
    <div style={{
      width: '100%',
      height: '320px',
      background: '#0B0E1A',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.05)',
      marginBottom: '24px'
    }}>
      {/* Background galaxy simulation */}
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8B92A8', fontSize: '13px' }}>
          Simulating College Constellation...
        </div>
      }>
        <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
          <color attach="background" args={['#0B0E1A']} />
          <ambientLight intensity={0.5} />
          {colleges.length > 0 && (
            <StarsSpiral colleges={colleges} reduceMotion={reduceMotion} />
          )}
          <OrbitControls enableZoom={false} autoRotate={!reduceMotion} autoRotateSpeed={0.4} />
        </Canvas>
      </Suspense>

      {/* Decorative Constellation Grid text overlay */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '16px',
        pointerEvents: 'none',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: '#8B92A8',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <span>SYSTEM: ACTIVE TRAINING NODES</span>
        <span>LATENCY: NOMINAL</span>
      </div>

      <div style={{
        position: 'absolute',
        top: '12px',
        right: '16px',
        pointerEvents: 'none',
        fontFamily: 'Space Grotesk, sans-serif',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#F2B84B',
        background: 'rgba(242,184,75,0.08)',
        border: '1px solid rgba(242,184,75,0.2)',
        borderRadius: '20px',
        padding: '3px 10px'
      }}>
        Constellation View
      </div>
    </div>
  )
}

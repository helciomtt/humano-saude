'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

interface GoldScannerProps {
  onPdfDropped?: (file: File) => void;
  onScanComplete?: (data: any) => void;
}

export function GoldScanner({ onPdfDropped, onScanComplete }: GoldScannerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controls = useAnimation();
  
  // Three.js Scene Setup
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.position.z = 5;
    
    // Criar geometria do scanner (anel dourado girante)
    const geometry = new THREE.TorusGeometry(1.5, 0.05, 16, 100);
    const material = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.8,
    });
    const torus = new THREE.Mesh(geometry, material);
    scene.add(torus);
    
    // Partículas douradas
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 100;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 5;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xF6E05E,
      transparent: true,
      opacity: 0.6,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    
    // Linha de scanner
    const lineGeometry = new THREE.PlaneGeometry(3, 0.1);
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      transparent: true,
      opacity: 0.5,
    });
    const scannerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    scene.add(scannerLine);
    
    let animationId: number;
    let time = 0;
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.01;
      
      // Rotacionar o anel
      torus.rotation.x = time;
      torus.rotation.y = time * 0.5;
      
      // Animar partículas
      if (particlesGeometry.attributes.position) {
        const positions = particlesGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particlesCount; i++) {
          const i3 = i * 3;
          positions[i3 + 1] = Math.sin(time + i) * 2;
        }
        particlesGeometry.attributes.position.needsUpdate = true;
      }
      
      // Animar linha de scanner quando estiver escaneando
      if (isScanning) {
        scannerLine.position.y = Math.sin(time * 3) * 2;
        scannerLine.material.opacity = 0.8 + Math.sin(time * 5) * 0.2;
      }
      
      // Efeito de brilho quando arrastar
      if (isDragging) {
        torus.scale.setScalar(1 + Math.sin(time * 5) * 0.1);
        material.opacity = 0.9 + Math.sin(time * 5) * 0.1;
      } else {
        torus.scale.setScalar(1);
        material.opacity = 0.8;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!canvas) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
    };
  }, [isDragging, isScanning]);
  
  // Confetti de sucesso
  const fireConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#D4AF37', '#F6E05E', '#AA8A2E', '#FFD700'],
    };
    
    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }
    
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    
    fire(0.2, {
      spread: 60,
    });
    
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };
  
  // Simular processamento
  const simulateScan = async (file: File) => {
    setIsScanning(true);
    setProgress(0);
    setScanComplete(false);
    
    // Animar progresso
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setProgress(i);
    }
    
    // Scan completo
    setIsScanning(false);
    setScanComplete(true);
    
    // Disparar confetti
    fireConfetti();
    
    // Callback
    if (onScanComplete) {
      onScanComplete({
        fileName: file.name,
        size: file.size,
        scannedAt: new Date().toISOString(),
        accuracy: 98.7,
      });
    }
    
    // Reset após 3 segundos
    setTimeout(() => {
      setScanComplete(false);
      setProgress(0);
    }, 3000);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    controls.start({
      scale: 1.05,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    });
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
    controls.start({
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    });
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    controls.start({
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    });
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      if (onPdfDropped) onPdfDropped(pdfFile);
      simulateScan(pdfFile);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      if (onPdfDropped) onPdfDropped(file);
      simulateScan(file);
    }
  };
  
  return (
    <motion.div
      animate={controls}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative overflow-hidden rounded-3xl cursor-pointer
        transition-all duration-500
        ${isDragging 
          ? 'glass-gold border-2 border-[#D4AF37] shadow-[0_0_50px_rgba(212,175,55,0.5)]' 
          : 'glass-dark border-2 border-white/10 hover:border-[#D4AF37]/30'
        }
        ${isScanning ? 'border-beam' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Content */}
      <div className="relative z-10 p-12 text-center">
        {!isScanning && !scanComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#bf953f] to-[#D4AF37] rounded-full flex items-center justify-center text-4xl animate-float">
              📄
            </div>
            <h3 className="text-3xl font-black text-white mb-3 uppercase font-perpetua bg-gold-gradient bg-clip-text text-transparent animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}>
              Scanner IA Premium
            </h3>
            <p className="text-gray-300 text-lg mb-2">
              Arraste seu PDF aqui ou clique para selecionar
            </p>
            <p className="text-gray-400 text-sm">
              Processamento instantâneo com 98.7% de precisão
            </p>
          </motion.div>
        )}
        
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#bf953f] to-[#D4AF37] rounded-full flex items-center justify-center text-4xl animate-pulse">
              ⚡
            </div>
            <h3 className="text-3xl font-black text-white mb-3 uppercase font-perpetua">
              Processando PDF...
            </h3>
            <div className="max-w-md mx-auto">
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#bf953f] via-[#D4AF37] to-[#F6E05E] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-[#D4AF37] font-black text-2xl">{progress}%</p>
            </div>
          </motion.div>
        )}
        
        {scanComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-5xl animate-pulse-glow">
              ✓
            </div>
            <h3 className="text-4xl font-black text-emerald-400 mb-3 uppercase font-perpetua">
              Scan Completo!
            </h3>
            <p className="text-white text-lg">
              PDF processado com <span className="text-[#D4AF37] font-black">98.7%</span> de precisão
            </p>
          </motion.div>
        )}
      </div>
      
      {/* Scanner Line Effect */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
            animate={{
              top: ['0%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

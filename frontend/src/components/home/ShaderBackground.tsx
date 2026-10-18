'use client';

import { Suspense } from 'react';
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { useReducedMotion } from 'motion/react';

export default function ShaderBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <Suspense>
      <ShaderGradientCanvas
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '120vh',
        }}
        pixelDensity={1}
        pointerEvents="none"
      >
        <ShaderGradient
          animate={reduceMotion ? 'off' : 'on'}
          type="sphere"
          wireframe={false}
          shader="defaults"
          uTime={0}
          uSpeed={0.3}
          uStrength={0.4}
          uDensity={0.8}
          uFrequency={5.5}
          uAmplitude={7}
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={0}
          rotationZ={140}
          color1="#1f469a"
          color2="#000000"
          color3="#000000"
          reflection={0.5}
          cAzimuthAngle={250}
          cPolarAngle={140}
          cDistance={1.5}
          cameraZoom={12.5}
          lightType="3d"
          brightness={1.5}
          envPreset="city"
          grain="on"
          toggleAxis={false}
          zoomOut={false}
          hoverState=""
          enableTransition={false}
        />
      </ShaderGradientCanvas>
    </Suspense>
  );
}

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BlastEvent, BOARD_SIZE, GEM_META, GemColor } from '../game/types';

export interface Scene3DBackdropHandle {
  emitBurst: (blasts: BlastEvent[], cascadeIndex: number) => void;
  triggerVictory: () => void;
  setPointerTilt: (nx: number, ny: number) => void;
}

interface Scene3DBackdropProps {
  variant: 'title' | 'playing';
}

interface ActiveShard {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  vrot: THREE.Vector3;
  scale: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

interface ActiveRing3D {
  mesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  active: boolean;
  life: number;
  maxLife: number;
  maxScale: number;
}

const MAX_SHARDS = 120;
const MAX_RINGS_3D = 12;

const PALETTE_HEX = ['#FF4D6D', '#F59E0B', '#22C55E', '#38BDF8', '#A855F7', '#FDE047'];

// Pre-allocated math helpers (zero GC inside animation loop)
const _mat4 = new THREE.Matrix4();
const _vec3 = new THREE.Vector3();
const _scaleVec = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function buildCrystalLanternTotem(accentHex: string, goldMat: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  // 1. Lathe pedestal base (multi-tiered Nordic stone & brass collar)
  const lathePoints = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.85, 0),
    new THREE.Vector2(0.75, 0.25),
    new THREE.Vector2(0.55, 0.35),
    new THREE.Vector2(0.45, 0.65),
    new THREE.Vector2(0.62, 0.8),
    new THREE.Vector2(0, 0.85),
  ];
  const baseGeo = new THREE.LatheGeometry(lathePoints, 8);
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x1b2336,
    roughness: 0.72,
    metalness: 0.18,
    flatShading: true,
  });
  const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
  group.add(baseMesh);

  // 2. Gold filigree collar ring
  const collarGeo = new THREE.TorusGeometry(0.56, 0.06, 10, 24);
  const collar = new THREE.Mesh(collarGeo, goldMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.82;
  group.add(collar);

  // 3. Central beveled crystal spire (ExtrudeGeometry hex prism + faceted cap)
  const hexShape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const rx = Math.cos(a) * 0.42;
    const ry = Math.sin(a) * 0.42;
    if (i === 0) hexShape.moveTo(rx, ry);
    else hexShape.lineTo(rx, ry);
  }
  hexShape.closePath();

  const crystalGeo = new THREE.ExtrudeGeometry(hexShape, {
    depth: 1.5,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.08,
    bevelSegments: 2,
  });
  crystalGeo.center();

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.32,
    roughness: 0.15,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    flatShading: true,
  });

  const mainSpire = new THREE.Mesh(crystalGeo, crystalMat);
  mainSpire.position.y = 1.95;
  group.add(mainSpire);

  // 4. Secondary side crystal shards
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const sideShard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.32, 0),
      crystalMat
    );
    sideShard.scale.set(0.75, 1.85, 0.75);
    sideShard.position.set(Math.cos(a) * 0.56, 1.28, Math.sin(a) * 0.56);
    sideShard.rotation.z = -Math.cos(a) * 0.34;
    sideShard.rotation.x = Math.sin(a) * 0.34;
    group.add(sideShard);
  }

  // 5. Orbiting golden halo ring
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.032, 10, 40), goldMat);
  halo.position.y = 2.0;
  halo.rotation.x = 1.15;
  halo.rotation.y = 0.35;
  halo.name = 'halo';
  group.add(halo);

  return group;
}

export const Scene3DBackdrop = forwardRef<Scene3DBackdropHandle, Scene3DBackdropProps>(
  ({ variant }, ref) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const variantRef = useRef(variant);
    variantRef.current = variant;

    const pointerTargetRef = useRef({ x: 0, y: 0 });
    const cameraShakeRef = useRef(0);
    const victoryBoostRef = useRef(0);

    const shardsRef = useRef<ActiveShard[]>(
      Array.from({ length: MAX_SHARDS }, () => ({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        vrot: new THREE.Vector3(),
        scale: 0.2,
        life: 0,
        maxLife: 1,
        color: new THREE.Color('#FDE047'),
      }))
    );
    const shardCursorRef = useRef(0);

    const spawnRingsQueueRef = useRef<
      Array<{ x: number; y: number; color: string; maxScale: number }>
    >([]);

    useImperativeHandle(ref, () => ({
      setPointerTilt(nx: number, ny: number) {
        pointerTargetRef.current.x = THREE.MathUtils.clamp(nx, -1, 1);
        pointerTargetRef.current.y = THREE.MathUtils.clamp(ny, -1, 1);
      },

      emitBurst(blasts: BlastEvent[], cascadeIndex: number) {
        if (
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          return;
        }

        const shards = shardsRef.current;
        let hasBigSpecial = false;

        for (const b of blasts) {
          // Map 8x8 board coords into centered 3D world coords roughly framing board area
          const wx = ((b.col + 0.5) / BOARD_SIZE - 0.5) * 6.2;
          const wy = (0.5 - (b.row + 0.5) / BOARD_SIZE) * 6.2;
          const hex = b.color
            ? GEM_META[b.color as GemColor].lightHex
            : b.type === 'ice'
            ? '#7DD3FC'
            : b.type === 'crate'
            ? '#FDE68A'
            : '#FDE047';

          const isSpecial =
            b.type === 'beam_h' ||
            b.type === 'beam_v' ||
            b.type === 'nova' ||
            b.type === 'prism';

          if (isSpecial) {
            hasBigSpecial = true;
            spawnRingsQueueRef.current.push({
              x: wx,
              y: wy,
              color: b.type === 'prism' ? '#FDE047' : hex,
              maxScale: b.type === 'prism' ? 4.2 : 2.6,
            });
          }

          const count = b.type === 'prism' ? 18 : isSpecial ? 10 : 3;
          for (let i = 0; i < count; i++) {
            const s = shards[shardCursorRef.current];
            shardCursorRef.current = (shardCursorRef.current + 1) % MAX_SHARDS;

            const angle = Math.random() * Math.PI * 2;
            const radial = (isSpecial ? 3.8 : 2.2) + Math.random() * 4.0;
            s.active = true;
            s.pos.set(wx + (Math.random() - 0.5) * 0.4, wy + (Math.random() - 0.5) * 0.4, 1.4);
            s.vel.set(
              Math.cos(angle) * radial,
              Math.sin(angle) * radial + 2.6,
              3.2 + Math.random() * 4.6
            );
            s.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
            s.vrot.set(
              (Math.random() - 0.5) * 14,
              (Math.random() - 0.5) * 14,
              (Math.random() - 0.5) * 14
            );
            s.scale = isSpecial ? 0.22 + Math.random() * 0.18 : 0.14 + Math.random() * 0.12;
            s.maxLife = isSpecial ? 1.05 + Math.random() * 0.35 : 0.72 + Math.random() * 0.25;
            s.life = s.maxLife;
            const pickedHex =
              b.type === 'prism' ? PALETTE_HEX[i % PALETTE_HEX.length] : hex;
            s.color.set(pickedHex);
          }
        }

        if (cascadeIndex >= 2 || hasBigSpecial) {
          cameraShakeRef.current = Math.min(
            0.65,
            cameraShakeRef.current + (hasBigSpecial ? 0.34 : 0.16 * cascadeIndex)
          );
        }
      },

      triggerVictory() {
        victoryBoostRef.current = 1.6;
        cameraShakeRef.current = 0.4;
        const shards = shardsRef.current;
        for (let i = 0; i < 64; i++) {
          const s = shards[shardCursorRef.current];
          shardCursorRef.current = (shardCursorRef.current + 1) % MAX_SHARDS;

          const angle = Math.random() * Math.PI * 2;
          const speed = 3.2 + Math.random() * 5.8;
          s.active = true;
          s.pos.set((Math.random() - 0.5) * 4.5, -2.5, 1.8);
          s.vel.set(Math.cos(angle) * speed, 6.2 + Math.random() * 5.2, 2.5 + Math.random() * 4.5);
          s.rot.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
          s.vrot.set(
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 16,
            (Math.random() - 0.5) * 16
          );
          s.scale = 0.2 + Math.random() * 0.22;
          s.maxLife = 1.45 + Math.random() * 0.55;
          s.life = s.maxLife;
          s.color.set(PALETTE_HEX[i % PALETTE_HEX.length]);
        }
        spawnRingsQueueRef.current.push({ x: 0, y: 0, color: '#FDE047', maxScale: 5.5 });
      },
    }));

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareWebGL();
      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        48,
        Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
        0.1,
        100
      );
      camera.position.set(0, 0.2, 11.5);

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      container.appendChild(renderer.domElement);

      // Studio environment reflections for metallic gold & crystal highlights
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envScene = new RoomEnvironment();
      const envRT = pmremGenerator.fromScene(envScene, 0.04);
      scene.environment = envRT.texture;
      envScene.dispose();
      pmremGenerator.dispose();

      // Warm/cool 3-point lighting rig + drifting warm lantern light
      const hemi = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.9);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xffe4a8, 2.2);
      keyLight.position.set(6, 9, 8);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.45);
      rimLight.position.set(-7, -3, -4);
      scene.add(rimLight);

      const movingGlowLight = new THREE.PointLight(0xfbbf24, 3.2, 26, 1.4);
      movingGlowLight.position.set(2.5, 1.2, 2.5);
      scene.add(movingGlowLight);

      // Gold metallic material shared by crystal totems
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf5b841,
        metalness: 0.92,
        roughness: 0.22,
      });

      // Left & Right 3D Crystal Totems framing the arena on playing view
      const totemGroup = new THREE.Group();
      const leftTotem = buildCrystalLanternTotem('#38BDF8', goldMat);
      leftTotem.position.set(-7.6, -2.0, -2.5);
      leftTotem.rotation.y = 0.4;
      leftTotem.scale.setScalar(1.05);
      totemGroup.add(leftTotem);

      const rightTotem = buildCrystalLanternTotem('#F59E0B', goldMat);
      rightTotem.position.set(7.4, -1.9, -2.6);
      rightTotem.rotation.y = -0.45;
      rightTotem.scale.setScalar(1.05);
      totemGroup.add(rightTotem);

      const topLeftShard = buildCrystalLanternTotem('#A855F7', goldMat);
      topLeftShard.position.set(-9.4, 2.9, -6.5);
      topLeftShard.rotation.set(0.25, 0.8, -0.3);
      topLeftShard.scale.setScalar(0.85);
      totemGroup.add(topLeftShard);

      const topRightShard = buildCrystalLanternTotem('#22C55E', goldMat);
      topRightShard.position.set(8.9, 3.0, -6.2);
      topRightShard.rotation.set(-0.2, -0.7, 0.28);
      topRightShard.scale.setScalar(0.85);
      totemGroup.add(topRightShard);

      scene.add(totemGroup);

      // 3D Burst Shards (InstancedMesh)
      const shardGeo = new THREE.IcosahedronGeometry(0.45, 0);
      const shardMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.15,
        metalness: 0.3,
        clearcoat: 1.0,
        emissive: 0x221a08,
        emissiveIntensity: 0.35,
        flatShading: true,
      });
      const shardInstanced = new THREE.InstancedMesh(shardGeo, shardMat, MAX_SHARDS);
      shardInstanced.frustumCulled = false;
      const initColor = new THREE.Color(0xfde047);
      for (let i = 0; i < MAX_SHARDS; i++) {
        shardInstanced.setColorAt(i, initColor);
      }
      if (shardInstanced.instanceColor) shardInstanced.instanceColor.needsUpdate = true;
      scene.add(shardInstanced);

      // 3D Expanding Shockwave Torus Pool
      const ringGeo = new THREE.TorusGeometry(1, 0.045, 10, 48);
      const rings3D: ActiveRing3D[] = Array.from({ length: MAX_RINGS_3D }, () => {
        const mat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0,
        });
        const mesh = new THREE.Mesh(ringGeo, mat);
        mesh.visible = false;
        scene.add(mesh);
        return { mesh, active: false, life: 0, maxLife: 0.5, maxScale: 3 };
      });
      let ringCursor = 0;

      // Apply variant background/fog state
      const syncVariant = () => {
        const isPlaying = variantRef.current === 'playing';
        totemGroup.visible = isPlaying;
        if (isPlaying) {
          renderer.setClearColor(0x0c111d, 1);
          scene.fog = new THREE.FogExp2(0x0c111d, 0.028);
        } else {
          renderer.setClearColor(0x000000, 0);
          scene.fog = null;
        }
      };
      syncVariant();

      // Resize observer
      const onResize = () => {
        if (!container) return;
        const w = Math.max(1, container.clientWidth);
        const h = Math.max(1, container.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(container);

      const startTimeMs = performance.now();
      let prevTimeMs = startTimeMs;
      let disposed = false;
      let frameId = 0;
      let timerId = 0;

      const afterDraw = (cb: () => void) => {
        try {
          const gl = renderer.getContext() as WebGL2RenderingContext;
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) {
              if (sync) gl.deleteSync(sync);
              return;
            }
            const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
            if (state === gl.UNSIGNALED) {
              timerId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              timerId = window.setTimeout(cb, 80);
            }
          };
          timerId = window.setTimeout(poll, 5);
        } catch {
          timerId = window.setTimeout(cb, 80);
        }
      };

      const tick = () => {
        if (disposed) return;

        syncVariant();
        const nowMs = performance.now();
        const dt = Math.min((nowMs - prevTimeMs) / 1000, 0.05);
        prevTimeMs = nowMs;
        const elapsed = (nowMs - startTimeMs) / 1000;

        // Smooth camera parallax + shake impulse
        const ptr = pointerTargetRef.current;
        const shake = cameraShakeRef.current;
        cameraShakeRef.current = THREE.MathUtils.damp(shake, 0, 7.5, dt);
        victoryBoostRef.current = THREE.MathUtils.damp(victoryBoostRef.current, 0, 2.2, dt);

        const targetX = reducedMotion ? 0 : ptr.x * 0.45 + (Math.random() - 0.5) * shake;
        const targetY = reducedMotion ? 0.2 : 0.2 - ptr.y * 0.35 + (Math.random() - 0.5) * shake;
        const targetZ = 11.5 - victoryBoostRef.current * 0.6;

        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 5.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 5.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 4.5, dt);
        camera.lookAt(0, 0, 0);

        // Gently bob and rotate flanking crystal totems
        if (totemGroup.visible && !reducedMotion) {
          leftTotem.position.y = -2.1 + Math.sin(elapsed * 0.9) * 0.18;
          leftTotem.rotation.y = 0.4 + Math.sin(elapsed * 0.45) * 0.14;
          rightTotem.position.y = -1.9 + Math.cos(elapsed * 0.85) * 0.18;
          rightTotem.rotation.y = -0.45 - Math.cos(elapsed * 0.42) * 0.14;
          topLeftShard.rotation.y += dt * 0.25;
          topRightShard.rotation.y -= dt * 0.25;

          totemGroup.traverse((obj) => {
            if (obj.name === 'halo') {
              obj.rotation.z += dt * 0.85;
            }
          });
        }

        // Animate background lighting rig so shadows/highlights sweep smoothly
        if (!reducedMotion) {
          keyLight.position.set(
            6 + Math.sin(elapsed * 0.55) * 3.8,
            8.5 + Math.cos(elapsed * 0.42) * 2.2,
            8 + Math.cos(elapsed * 0.35) * 1.6
          );
          keyLight.intensity = 2.1 + Math.sin(elapsed * 0.9) * 0.35;

          rimLight.position.set(
            -7 + Math.cos(elapsed * 0.48) * 3.2,
            -2.5 + Math.sin(elapsed * 0.6) * 2.4,
            -4
          );
          rimLight.intensity = 1.4 + Math.cos(elapsed * 0.85) * 0.3;

          movingGlowLight.position.set(
            Math.sin(elapsed * 0.45) * 5.8,
            1.4 + Math.cos(elapsed * 0.68) * 2.6,
            2.2 + Math.sin(elapsed * 0.52) * 1.2
          );
          movingGlowLight.intensity = 3.0 + Math.sin(elapsed * 1.4) * 0.9;
        }

        // Drain queued 3D shockwave rings
        while (spawnRingsQueueRef.current.length > 0) {
          const req = spawnRingsQueueRef.current.shift()!;
          const ring = rings3D[ringCursor];
          ringCursor = (ringCursor + 1) % MAX_RINGS_3D;
          ring.active = true;
          ring.life = 0.55;
          ring.maxLife = 0.55;
          ring.maxScale = req.maxScale;
          ring.mesh.visible = true;
          ring.mesh.position.set(req.x, req.y, 1.8);
          ring.mesh.rotation.set(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            0
          );
          ring.mesh.material.color.set(req.color);
          ring.mesh.material.opacity = 0.9;
        }

        // Animate active 3D shockwave rings
        for (let i = 0; i < MAX_RINGS_3D; i++) {
          const ring = rings3D[i];
          if (!ring.active) continue;
          ring.life -= dt;
          if (ring.life <= 0) {
            ring.active = false;
            ring.mesh.visible = false;
            continue;
          }
          const progress = 1 - ring.life / ring.maxLife;
          const sc = 0.35 + progress * ring.maxScale;
          ring.mesh.scale.set(sc, sc, sc);
          ring.mesh.position.z = 1.8 + progress * 1.4;
          ring.mesh.material.opacity = (1 - progress) * 0.85;
        }

        // Update flying 3D shards
        const shards = shardsRef.current;
        for (let i = 0; i < MAX_SHARDS; i++) {
          const s = shards[i];
          if (!s.active) {
            _scaleVec.set(0, 0, 0);
            _vec3.set(0, 0, -50);
            _quat.identity();
            _mat4.compose(_vec3, _quat, _scaleVec);
            shardInstanced.setMatrixAt(i, _mat4);
            continue;
          }

          s.life -= dt;
          if (s.life <= 0) {
            s.active = false;
            _scaleVec.set(0, 0, 0);
            _mat4.compose(_vec3, _quat, _scaleVec);
            shardInstanced.setMatrixAt(i, _mat4);
            continue;
          }

          s.pos.addScaledVector(s.vel, dt);
          s.vel.y -= 9.5 * dt; // 3D gravity arc
          s.rot.x += s.vrot.x * dt;
          s.rot.y += s.vrot.y * dt;
          s.rot.z += s.vrot.z * dt;

          const fade = Math.min(1, (s.life / s.maxLife) * 1.6);
          const sc = s.scale * fade;
          _quat.setFromEuler(s.rot);
          _scaleVec.set(sc, sc, sc);
          _mat4.compose(s.pos, _quat, _scaleVec);
          shardInstanced.setMatrixAt(i, _mat4);
          shardInstanced.setColorAt(i, s.color);
        }
        shardInstanced.instanceMatrix.needsUpdate = true;
        if (shardInstanced.instanceColor) shardInstanced.instanceColor.needsUpdate = true;

        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = requestAnimationFrame(tick);
        }
      };

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }
      tick();

      return () => {
        disposed = true;
        cancelAnimationFrame(frameId);
        clearTimeout(timerId);
        ro.disconnect();

        scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        });
        envRT.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }, []);

    return (
      <div
        ref={mountRef}
        data-testid="scene-3d"
        className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
        aria-hidden="true"
      />
    );
  }
);

Scene3DBackdrop.displayName = 'Scene3DBackdrop';

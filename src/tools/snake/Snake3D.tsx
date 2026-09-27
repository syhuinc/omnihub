import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import headGlbUrl from '../../assets/snake/head.glb?url';
import eggGlbUrl from '../../assets/snake/egg.glb?url';

const MODEL_URLS = { head: headGlbUrl, egg: eggGlbUrl } as const;
type Kind = keyof typeof MODEL_URLS;
export type Snake3DAnim = 'idle' | 'eating' | 'dying';

const IDLE_PERIOD_HEAD = 1.8;
const IDLE_PERIOD_EGG = 2.0;
const EAT_DURATION = 0.42;
const DEATH_DURATION = 0.6;

// One GLTFLoader/cache shared by every instance — the head and egg models
// are only ever fetched and parsed once no matter how many sprites (idle
// head, idle food, a transient eat-burst) are on screen at once.
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const modelCache = new Map<Kind, Promise<THREE.Object3D>>();

function loadModel(kind: Kind): Promise<THREE.Object3D> {
  let pending = modelCache.get(kind);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      loader.load(
        MODEL_URLS[kind],
        (gltf) => {
          const root = gltf.scene;
          const box = new THREE.Box3().setFromObject(root);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim;
          root.scale.setScalar(scale);
          root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          resolve(root);
        },
        undefined,
        reject,
      );
    });
    modelCache.set(kind, pending);
  }
  return pending;
}

interface Snake3DProps {
  kind: Kind;
  anim: Snake3DAnim;
  paused?: boolean;
  className?: string;
}

// Renders a live, continuously-animated 3D model (real WebGL, real-time
// lighting) instead of a pre-baked sprite-sheet flipbook — the rotation and
// shading actually change smoothly frame to frame rather than stepping
// through fixed poses.
export function Snake3D({ kind, anim, paused, className }: Snake3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(anim);
  const pausedRef = useRef(!!paused);
  const phaseStartRef = useRef(performance.now());

  useEffect(() => {
    animRef.current = anim;
    phaseStartRef.current = performance.now();
  }, [anim]);

  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let raf = 0;
    let root: THREE.Object3D | null = null;
    let baseScale = 1;
    let baseX = 0;
    let baseY = 0;
    let baseZ = 0;

    const scene = new THREE.Scene();
    const camDist = 3.2;
    const camera = new THREE.OrthographicCamera(-0.9, 0.9, 0.9, -0.9, 0.1, 10);
    camera.position.set(0, camDist * 0.55, camDist * 0.85);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(1.2, 2.2, 1.8);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfe0ff, 0.5);
    fill.position.set(-1.5, 1.0, -1.0);
    scene.add(fill);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    function resize() {
      const w = container!.clientWidth || 1;
      const h = container!.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    loadModel(kind).then((cached) => {
      if (cancelled) return;
      root = cached.clone(true);
      baseScale = root.scale.x;
      baseX = root.position.x;
      baseY = root.position.y;
      baseZ = root.position.z;
      scene.add(root);
    });

    function applyPose(elapsedSec: number) {
      if (!root) return;
      const a = animRef.current;
      if (kind === 'head') {
        if (a === 'dying') {
          const t = Math.min(1, elapsedSec / DEATH_DURATION);
          root.rotation.x = -t * Math.PI * 0.55;
          root.rotation.z = t * Math.PI * 0.9;
          root.position.set(baseX, baseY - t * 0.5, baseZ);
          root.scale.setScalar(baseScale * (1 - t * 0.35));
        } else {
          const t = (elapsedSec % IDLE_PERIOD_HEAD) / IDLE_PERIOD_HEAD;
          const ang = t * Math.PI * 2;
          root.rotation.x = 0;
          root.rotation.y = Math.sin(ang) * 0.16;
          root.rotation.z = Math.sin(ang * 2) * 0.025;
          root.position.set(baseX, baseY + Math.sin(ang * 2) * 0.035, baseZ);
          root.scale.setScalar(baseScale * (1 + Math.sin(ang * 2) * 0.025));
        }
      } else {
        if (a === 'eating') {
          const t = Math.min(1, elapsedSec / EAT_DURATION);
          const pop = t < 0.35 ? 1 + (t / 0.35) * 0.45 : Math.max(0, 1.45 - ((t - 0.35) / 0.65) * 1.45);
          root.rotation.y = t * 5.6;
          root.position.set(baseX, baseY + t * 0.25, baseZ);
          root.scale.setScalar(baseScale * pop);
        } else {
          const t = (elapsedSec % IDLE_PERIOD_EGG) / IDLE_PERIOD_EGG;
          const ang = t * Math.PI * 2;
          root.rotation.y = ang;
          root.position.set(baseX, baseY + Math.sin(ang * 2) * 0.03, baseZ);
          root.scale.setScalar(baseScale * (1 + Math.sin(ang * 2) * 0.015));
        }
      }
    }

    function loop() {
      if (cancelled) return;
      if (!pausedRef.current) {
        const elapsedSec = (performance.now() - phaseStartRef.current) / 1000;
        applyPose(elapsedSec);
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // kind never changes for a mounted instance in practice; anim/paused are
    // tracked via refs above so they don't tear down the WebGL context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return <div ref={containerRef} className={className} />;
}

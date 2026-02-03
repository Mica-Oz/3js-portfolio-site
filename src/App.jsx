import { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";

// ============================================================
// TORUS SPIRAL PORTFOLIO — Two-level zoom
// ============================================================
// Level 0: Home — torus spiral with 3 parent planets + moons
// Level 1: Section — camera flies to parent, moons grow
// Level 2: Link — camera flies to sub-sphere, content panel fills viewport
// ============================================================

// -- Parametric Torus Math --
function generateTorusPoints({
  radius = 1.0,
  minorRadius = 0.7,
  sections = 11,
  spans = 12,
}) {
  function gcd(a, b) {
    while (b) {
      [a, b] = [b, a % b];
    }
    return a;
  }
  const stepsToClose = (sections * spans) / gcd(sections, spans);
  const rawPoints = [];
  for (let i = 0; i < stepsToClose; i++) {
    const u = (i / sections) * Math.PI * 2;
    const t = (i / spans) * Math.PI * 2;
    const x = (radius + minorRadius * Math.cos(t)) * Math.cos(u);
    const y = minorRadius * Math.sin(t);
    const z = (radius + minorRadius * Math.cos(t)) * Math.sin(u);
    rawPoints.push(new THREE.Vector3(x, y, z));
  }
  const curve = new THREE.CatmullRomCurve3(rawPoints, true, "catmullrom", 0.5);
  return { points: curve.getPoints(stepsToClose * 8), curve };
}

let _torusCurve = null;
function getTorusPosition(progress) {
  if (!_torusCurve) {
    _torusCurve = generateTorusPoints({
      radius: 1.0,
      minorRadius: 0.7,
      sections: 11,
      spans: 12,
    }).curve;
  }
  return _torusCurve.getPointAt(((progress % 1) + 1) % 1);
}

// ============================================================
// SECTION DATA
// ============================================================
const SECTIONS = [
  {
    id: "art",
    label: "Art",
    color: "#2a2a2a",
    orbitOffset: 0.0,
    orbitSpeed: 0.0018,
    links: [
      {
        id: "gallery",
        title: "Gallery",
        subtitle: "Paintings, prints & murals",
        description:
          "A collection of original works spanning painting, screen printing, and large-scale mural projects. Each piece explores the intersection of geometric form and organic energy.",
      },
      {
        id: "instagram",
        title: "Instagram",
        subtitle: "@mica.oz",
        description:
          "Follow the creative journey — studio sessions, work in progress, and finished pieces shared in real time.",
      },
      {
        id: "process",
        title: "Process",
        subtitle: "Studio & behind the scenes",
        description:
          "Step inside the studio. From initial sketches through final execution, see how ideas become physical works.",
      },
    ],
  },
  {
    id: "dev",
    label: "Dev",
    color: "#5a5a5a",
    orbitOffset: 0.2,
    orbitSpeed: 0.0012,
    links: [
      {
        id: "projects",
        title: "Projects",
        subtitle: "Web apps & automation",
        description:
          "Full-stack applications, automation systems, and creative technology projects. Built with React, TypeScript, Next.js, and AWS.",
      },
      {
        id: "github",
        title: "GitHub",
        subtitle: "Open source work",
        description:
          "Contributions and repositories. Code that solves real problems.",
      },
      {
        id: "resume",
        title: "Resume",
        subtitle: "Experience & skills",
        description:
          "Principal Engineer experience spanning full-stack development, database architecture, OCR pipelines, and creative technology.",
      },
    ],
  },
  {
    id: "yoga",
    label: "Yoga",
    color: "#7a7a7a",
    orbitOffset: 0.4,
    orbitSpeed: 0.0022,
    links: [
      {
        id: "classes",
        title: "Classes",
        subtitle: "Schedule & booking",
        description:
          "Join a class. Vinyasa, restorative, and movement-based practices rooted in tradition and adapted for modern bodies.",
      },
      {
        id: "philosophy",
        title: "Philosophy",
        subtitle: "Practice & writing",
        description:
          "Explorations of Eastern philosophy, embodied practice, and the intersection of movement and meaning.",
      },
      {
        id: "training",
        title: "Training",
        subtitle: "Teacher training journey",
        description:
          "Documentation of the teacher training path — philosophy, anatomy, sequencing, and the art of holding space.",
      },
    ],
  },
  {
    id: "about",
    label: "About",
    color: "#9a9a9a",
    orbitOffset: 0.6,
    orbitSpeed: 0.0014,
    links: [
      {
        id: "story",
        title: "Story",
        subtitle: "Background & journey",
        description:
          "From Parsons to screen printing to code — a nonlinear path through commercial arts, technology, and movement practice.",
      },
      {
        id: "values",
        title: "Values",
        subtitle: "What drives the work",
        description:
          "Creativity as practice. Technology as craft. Movement as philosophy. The threads that connect everything.",
      },
      {
        id: "press",
        title: "Press",
        subtitle: "Features & mentions",
        description:
          "Selected press coverage, interviews, and features across art, technology, and wellness publications.",
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    color: "#b5b5b5",
    orbitOffset: 0.8,
    orbitSpeed: 0.002,
    links: [
      {
        id: "email",
        title: "Email",
        subtitle: "Get in touch",
        description:
          "For commissions, collaborations, speaking engagements, or just to say hello — drop a line.",
      },
      {
        id: "booking",
        title: "Booking",
        subtitle: "Schedule a session",
        description:
          "Book a yoga class, consultation, or creative session. Available for private and group work.",
      },
      {
        id: "social",
        title: "Social",
        subtitle: "Connect online",
        description:
          "Find and follow across platforms — Instagram, GitHub, LinkedIn, and more.",
      },
    ],
  },
];

// ============================================================
// HELPERS
// ============================================================
function useAnimationFrame(callback) {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const callbackRef = useRef(callback);

  // Update the ref when callback changes without touching refs during render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        callbackRef.current(
          time / 1000,
          (time - previousTimeRef.current) / 1000,
        );
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Seeded pseudo-random per sub-sphere
function subSeed(sIdx, lIdx) {
  return sIdx * 7 + lIdx * 13;
}
function seededVal(seed, mult) {
  return ((seed * mult) % 100) / 100;
}

// ============================================================
// 3D SCENE
// ============================================================
function Scene3D({
  activeSection,
  activeLink,
  showConstellation,
  onCameraProgress,
  onSubSphereScreenPositions,
  onClickSection,
  onClickSubSphere,
}) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshesRef = useRef({});
  const spheresRef = useRef([]);
  const subSpheresRef = useRef([]);
  const constellationLinesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseDownPosRef = useRef({ x: 0, y: 0 });

  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.3, y: 0 });
  const targetRotationRef = useRef({ x: 0.3, y: 0 });
  const autoRotateRef = useRef(0);
  const zoomRef = useRef(4.5);
  const targetZoomRef = useRef(4.5);
  const pinchStartRef = useRef(null);

  // Camera anim supports: flyToParent, flyToSub, flyBackToParent, flyBackHome
  const cameraAnimRef = useRef({
    active: false,
    phase: "idle",
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    endLookAt: new THREE.Vector3(),
    currentLookAt: new THREE.Vector3(),
    progress: 0,
    duration: 2.5,
    targetSectionIndex: -1,
    targetLinkIndex: -1,
  });

  // Init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset refs to prevent duplicates on re-render (React Strict Mode / hot reload)
    spheresRef.current = [];
    subSpheresRef.current = [];
    constellationLinesRef.current = [];

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 2, 4.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(5, 5, 5);
    scene.add(dl);
    const bl = new THREE.DirectionalLight(0xffffff, 0.3);
    bl.position.set(-3, -2, -5);
    scene.add(bl);

    // Torus spiral
    const torusResult = generateTorusPoints({
      radius: 1.0,
      minorRadius: 0.7,
      sections: 11,
      spans: 12,
    });
    _torusCurve = torusResult.curve;
    const lineGeo = new THREE.BufferGeometry().setFromPoints(
      torusResult.points,
    );
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x1a1a1a,
      transparent: true,
      opacity: 1,
    });
    scene.add(new THREE.Line(lineGeo, lineMat));
    meshesRef.current.lineMaterial = lineMat;

    // Parent spheres
    SECTIONS.forEach((section) => {
      const geo = new THREE.SphereGeometry(0.09, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(section.color),
        roughness: 0.2,
        metalness: 0.05,
        transparent: true,
        opacity: 1,
      });
      const sphere = new THREE.Mesh(geo, mat);
      const ringGeo = new THREE.RingGeometry(0.112, 0.128, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(section.color),
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      sphere.add(new THREE.Mesh(ringGeo, ringMat));
      sphere.userData = {
        sphereMaterial: mat,
        ringMaterial: ringMat,
        type: "parent",
      };
      scene.add(sphere);
      spheresRef.current.push(sphere);
    });

    // Sub-spheres
    SECTIONS.forEach((section, sIdx) => {
      const subs = [];
      section.links.forEach((link, lIdx) => {
        const shade = new THREE.Color(section.color).lerp(
          new THREE.Color("#000000"),
          0.15,
        );
        const geo = new THREE.SphereGeometry(0.045, 24, 24);
        const mat = new THREE.MeshStandardMaterial({
          color: shade,
          roughness: 0.15,
          metalness: 0.1,
          transparent: true,
          opacity: 0.8,
        });
        const sub = new THREE.Mesh(geo, mat);
        const ringGeo = new THREE.RingGeometry(0.055, 0.068, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: shade,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
        });
        sub.add(new THREE.Mesh(ringGeo, ringMat));
        sub.userData = {
          subMaterial: mat,
          subRingMaterial: ringMat,
          type: "sub",
          sectionIndex: sIdx,
          linkIndex: lIdx,
        };
        scene.add(sub);
        subs.push(sub);
      });
      subSpheresRef.current.push(subs);
    });

    // Constellation lines (connecting planets)
    for (let i = 0; i < SECTIONS.length; i++) {
      const geometry = new THREE.BufferGeometry();
      // Will be updated each frame with actual positions
      const positions = new Float32Array(6); // 2 points x 3 coords
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      const material = new THREE.LineBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0,
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      constellationLinesRef.current.push(line);
    }

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  // Controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getAllSpheres = () => {
      const all = [...spheresRef.current];
      subSpheresRef.current.forEach((subs) => all.push(...subs));
      return all;
    };

    const onMD = (e) => {
      if (cameraAnimRef.current.active) return;
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMM = (e) => {
      if (!isDraggingRef.current) {
        if (cameraRef.current) {
          const rect = canvas.getBoundingClientRect();
          const m = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
          );
          raycasterRef.current.setFromCamera(m, cameraRef.current);
          const hits = raycasterRef.current.intersectObjects(
            getAllSpheres(),
            true,
          );
          let pointer = false;
          if (hits.length > 0) {
            let h = hits[0].object;
            while (
              h &&
              h.userData.type !== "parent" &&
              h.userData.type !== "sub"
            )
              h = h.parent;
            if (h) {
              const mt = h.userData.sphereMaterial || h.userData.subMaterial;
              if (mt && mt.opacity > 0.3) pointer = true;
            }
          }
          canvas.style.cursor = pointer ? "pointer" : "grab";
        }
        return;
      }
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      if (
        Math.abs(e.clientX - mouseDownPosRef.current.x) > 5 ||
        Math.abs(e.clientY - mouseDownPosRef.current.y) > 5
      )
        hasDraggedRef.current = true;
      if (!activeSection) {
        targetRotationRef.current.y += dx * 0.005;
        targetRotationRef.current.x += dy * 0.005;
      }
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (cx, cy) => {
      if (hasDraggedRef.current || cameraAnimRef.current.active) return;
      const rect = canvas.getBoundingClientRect();
      const m = new THREE.Vector2(
        ((cx - rect.left) / rect.width) * 2 - 1,
        -((cy - rect.top) / rect.height) * 2 + 1,
      );
      raycasterRef.current.setFromCamera(m, cameraRef.current);
      const hits = raycasterRef.current.intersectObjects(getAllSpheres(), true);
      if (!hits.length) return;

      let h = hits[0].object;
      while (h && h.userData.type !== "parent" && h.userData.type !== "sub")
        h = h.parent;
      if (!h) return;

      if (h.userData.type === "parent" && !activeSection) {
        const idx = spheresRef.current.indexOf(h);
        if (idx >= 0) onClickSection?.(SECTIONS[idx].id);
      } else if (h.userData.type === "sub" && activeSection && !activeLink) {
        const mt = h.userData.subMaterial;
        if (mt.opacity > 0.3) {
          onClickSubSphere?.(
            SECTIONS[h.userData.sectionIndex].id,
            SECTIONS[h.userData.sectionIndex].links[h.userData.linkIndex].id,
          );
        }
      }
    };

    const onMU = (e) => {
      if (!hasDraggedRef.current) handleClick(e.clientX, e.clientY);
      isDraggingRef.current = false;
      hasDraggedRef.current = false;
    };
    const onWH = (e) => {
      if (cameraAnimRef.current.active || activeSection) return;
      targetZoomRef.current += e.deltaY * 0.003;
      targetZoomRef.current = Math.max(2, Math.min(8, targetZoomRef.current));
    };
    const onTS = (e) => {
      if (cameraAnimRef.current.active) return;
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        lastMouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        mouseDownPosRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        pinchStartRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const onTM = (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDraggingRef.current) {
        if (
          Math.abs(e.touches[0].clientX - mouseDownPosRef.current.x) > 8 ||
          Math.abs(e.touches[0].clientY - mouseDownPosRef.current.y) > 8
        )
          hasDraggedRef.current = true;
        if (!activeSection) {
          const dx = e.touches[0].clientX - lastMouseRef.current.x;
          const dy = e.touches[0].clientY - lastMouseRef.current.y;
          targetRotationRef.current.y += dx * 0.005;
          targetRotationRef.current.x += dy * 0.005;
        }
        lastMouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (
        e.touches.length === 2 &&
        pinchStartRef.current !== null &&
        !activeSection
      ) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        targetZoomRef.current += (pinchStartRef.current - dist) * 0.01;
        targetZoomRef.current = Math.max(2, Math.min(8, targetZoomRef.current));
        pinchStartRef.current = dist;
      }
    };
    const onTE = (e) => {
      if (!hasDraggedRef.current && e.changedTouches.length > 0)
        handleClick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      isDraggingRef.current = false;
      hasDraggedRef.current = false;
      pinchStartRef.current = null;
    };

    canvas.addEventListener("mousedown", onMD);
    window.addEventListener("mousemove", onMM);
    window.addEventListener("mouseup", onMU);
    canvas.addEventListener("wheel", onWH, { passive: true });
    canvas.addEventListener("touchstart", onTS, { passive: true });
    canvas.addEventListener("touchmove", onTM, { passive: false });
    canvas.addEventListener("touchend", onTE);
    return () => {
      canvas.removeEventListener("mousedown", onMD);
      window.removeEventListener("mousemove", onMM);
      window.removeEventListener("mouseup", onMU);
      canvas.removeEventListener("wheel", onWH);
      canvas.removeEventListener("touchstart", onTS);
      canvas.removeEventListener("touchmove", onTM);
      canvas.removeEventListener("touchend", onTE);
    };
  }, [activeSection, activeLink, onClickSection, onClickSubSphere]);

  // Camera fly triggers for both zoom levels
  const prevSectionRef = useRef(null);
  const prevLinkRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const anim = cameraAnimRef.current;
    const camera = cameraRef.current;
    if (!camera) return;

    // Skip initial mount
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevSectionRef.current = activeSection;
      prevLinkRef.current = activeLink;
      return;
    }

    if (activeLink && activeSection) {
      // Level 2: fly to sub-sphere
      const sIdx = SECTIONS.findIndex((s) => s.id === activeSection);
      const lIdx =
        sIdx >= 0
          ? SECTIONS[sIdx].links.findIndex((l) => l.id === activeLink)
          : -1;
      if (sIdx >= 0 && lIdx >= 0) {
        anim.active = true;
        anim.phase = "flyToSub";
        anim.startPos = camera.position.clone();
        anim.startLookAt = anim.currentLookAt
          ? anim.currentLookAt.clone()
          : spheresRef.current[sIdx].position.clone();
        anim.targetSectionIndex = sIdx;
        anim.targetLinkIndex = lIdx;
        anim.progress = 0;
        anim.duration = 1.8;
      }
    } else if (activeSection && !activeLink) {
      // Level 1: fly to parent (or returning from sub)
      const idx = SECTIONS.findIndex((s) => s.id === activeSection);
      anim.active = true;
      anim.phase = "flyToParent";
      anim.startPos = camera.position.clone();
      anim.startLookAt = anim.currentLookAt
        ? anim.currentLookAt.clone()
        : new THREE.Vector3(0, 0, 0);
      anim.targetSectionIndex = idx;
      anim.targetLinkIndex = -1;
      anim.progress = 0;
      anim.duration = prevLinkRef.current ? 1.5 : 2.5; // faster if coming back from sub
    } else if (!activeSection && !activeLink && prevSectionRef.current) {
      // Level 0: fly home (only if we were in a section before)
      const phi = rotationRef.current.x;
      const theta = rotationRef.current.y;
      const r = zoomRef.current;
      const homePos = new THREE.Vector3(
        r * Math.cos(phi) * Math.sin(theta),
        r * Math.sin(phi),
        r * Math.cos(phi) * Math.cos(theta),
      );
      anim.active = true;
      anim.phase = "flyHome";
      anim.startPos = camera.position.clone();
      anim.endPos = homePos;
      anim.startLookAt = anim.currentLookAt
        ? anim.currentLookAt.clone()
        : new THREE.Vector3(0, 0, 0);
      anim.endLookAt = new THREE.Vector3(0, 0, 0);
      anim.targetSectionIndex = -1;
      anim.targetLinkIndex = -1;
      anim.progress = 0;
      anim.duration = 2.0;
    }

    prevSectionRef.current = activeSection;
    prevLinkRef.current = activeLink;
  }, [activeSection, activeLink]);

  // Render loop
  const animate = useCallback(
    (time, delta) => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current)
        return;
      // Wait for scene init to complete
      if (!spheresRef.current.length || !subSpheresRef.current.length) return;

      const camera = cameraRef.current;
      const anim = cameraAnimRef.current;
      const lineMat = meshesRef.current.lineMaterial;

      // Auto-rotate
      if (!isDraggingRef.current && !anim.active && !activeSection) {
        autoRotateRef.current += delta * 0.15;
        targetRotationRef.current.y = autoRotateRef.current;
      } else if (isDraggingRef.current) {
        autoRotateRef.current = targetRotationRef.current.y;
      }
      rotationRef.current.x +=
        (targetRotationRef.current.x - rotationRef.current.x) * 0.05;
      rotationRef.current.y +=
        (targetRotationRef.current.y - rotationRef.current.y) * 0.05;
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.05;

      // Camera animation
      if (anim.active) {
        anim.progress += delta / anim.duration;
        if (anim.progress >= 1) {
          anim.progress = 1;
          anim.active = false;
        }
        const t = easeInOutCubic(anim.progress);

        if (anim.phase === "flyToParent" && anim.targetSectionIndex >= 0) {
          const sphere = spheresRef.current[anim.targetSectionIndex];
          const pos = sphere.position.clone();
          const dir = pos.clone().normalize();
          const endPos = pos
            .clone()
            .add(dir.multiplyScalar(0.6))
            .add(new THREE.Vector3(0, 0.15, 0));
          camera.position.lerpVectors(anim.startPos, endPos, t);
          const lookAt = new THREE.Vector3().lerpVectors(
            anim.startLookAt,
            pos,
            t,
          );
          camera.lookAt(lookAt);
          anim.currentLookAt = lookAt.clone();
        } else if (
          anim.phase === "flyToSub" &&
          anim.targetSectionIndex >= 0 &&
          anim.targetLinkIndex >= 0
        ) {
          const sub =
            subSpheresRef.current[anim.targetSectionIndex][
              anim.targetLinkIndex
            ];
          const subPos = sub.position.clone();
          const dir = subPos.clone().normalize();
          const endPos = subPos
            .clone()
            .add(dir.multiplyScalar(0.15))
            .add(new THREE.Vector3(0, 0.04, 0));
          camera.position.lerpVectors(anim.startPos, endPos, t);
          const lookAt = new THREE.Vector3().lerpVectors(
            anim.startLookAt,
            subPos,
            t,
          );
          camera.lookAt(lookAt);
          anim.currentLookAt = lookAt.clone();
        } else {
          camera.position.lerpVectors(anim.startPos, anim.endPos, t);
          const lookAt = new THREE.Vector3().lerpVectors(
            anim.startLookAt,
            anim.endLookAt,
            t,
          );
          camera.lookAt(lookAt);
          anim.currentLookAt = lookAt.clone();
        }
        if (onCameraProgress) onCameraProgress(anim.phase, anim.progress);
      } else if (!activeSection) {
        // Home orbit — full spherical
        const phi = rotationRef.current.x; // vertical angle (elevation)
        const theta = rotationRef.current.y; // horizontal angle (azimuth)
        const r = zoomRef.current;
        camera.position.set(
          r * Math.cos(phi) * Math.sin(theta),
          r * Math.sin(phi),
          r * Math.cos(phi) * Math.cos(theta),
        );
        // Flip up-vector when camera goes past the poles to prevent snapping
        const up = Math.cos(phi) >= 0 ? 1 : -1;
        camera.up.set(0, up, 0);
        camera.lookAt(0, 0, 0);
        if (onCameraProgress) onCameraProgress("home", 0);
      } else if (activeSection && !activeLink) {
        // Parked at parent
        const idx = SECTIONS.findIndex((s) => s.id === activeSection);
        if (idx >= 0) {
          const sphere = spheresRef.current[idx];
          const pos = sphere.position.clone();
          const dir = pos.clone().normalize();
          const breathe = Math.sin(time * 0.4) * 0.01;
          const target = pos
            .clone()
            .add(dir.multiplyScalar(0.6))
            .add(new THREE.Vector3(0, 0.15 + breathe, 0));
          camera.position.lerp(target, 0.03);
          camera.lookAt(pos);
        }
        if (onCameraProgress) onCameraProgress("parkedAtParent", 0);
      } else if (activeLink) {
        // Parked at sub-sphere
        const sIdx = SECTIONS.findIndex((s) => s.id === activeSection);
        const lIdx =
          sIdx >= 0
            ? SECTIONS[sIdx].links.findIndex((l) => l.id === activeLink)
            : -1;
        if (sIdx >= 0 && lIdx >= 0) {
          const sub = subSpheresRef.current[sIdx][lIdx];
          const subPos = sub.position.clone();
          const dir = subPos.clone().normalize();
          const breathe = Math.sin(time * 0.3) * 0.005;
          const target = subPos
            .clone()
            .add(dir.multiplyScalar(0.15))
            .add(new THREE.Vector3(0, 0.04 + breathe, 0));
          camera.position.lerp(target, 0.03);
          camera.lookAt(subPos);
        }
        if (onCameraProgress) onCameraProgress("parkedAtSub", 0);
      }

      // Update parent spheres
      spheresRef.current.forEach((sphere, index) => {
        const section = SECTIONS[index];
        if (!section) return;
        const progress =
          (((time * section.orbitSpeed + section.orbitOffset) % 1) + 1) % 1;
        sphere.position.copy(getTorusPosition(progress));

        sphere.scale.setScalar(1 + Math.sin(time * 2 + index * 2) * 0.06);
        if (sphere.children[0]) sphere.children[0].lookAt(camera.position);

        const mat = sphere.userData.sphereMaterial;
        const ringMat = sphere.userData.ringMaterial;
        if (activeSection) {
          const isActive = section.id === activeSection;
          mat.opacity +=
            ((isActive ? (activeLink ? 0.12 : 0.25) : 0.06) - mat.opacity) *
            0.05;
          ringMat.opacity +=
            ((isActive ? (activeLink ? 0.2 : 0.5) : 0.03) - ringMat.opacity) *
            0.05;
          if (isActive && !activeLink)
            sphere.scale.setScalar(2.0 + Math.sin(time * 1.2) * 0.2);
        } else {
          mat.opacity += (1 - mat.opacity) * 0.05;
          ringMat.opacity += (0.25 - ringMat.opacity) * 0.05;
        }
      });

      // Update sub-spheres
      subSpheresRef.current.forEach((subs, sIdx) => {
        const parent = spheresRef.current[sIdx];
        const section = SECTIONS[sIdx];
        if (!parent || !section) return;
        const isActiveSection = activeSection === section.id;

        const baseScale = isActiveSection ? 1.0 : 0.45;
        const baseOrbitR = isActiveSection ? 0.3 : 0.18;

        subs.forEach((sub, lIdx) => {
          const isActiveLink =
            isActiveSection && activeLink === section.links[lIdx].id;
          const subMat = sub.userData.subMaterial;
          const subRingMat = sub.userData.subRingMaterial;

          // Opacity: active link sphere glows, siblings dim
          let targetOp = 0.8;
          if (activeLink && isActiveSection) {
            targetOp = isActiveLink ? 1.0 : 0.15;
          } else if (isActiveSection) {
            targetOp = 0.95;
          }
          subMat.opacity += (targetOp - subMat.opacity) * 0.06;
          subRingMat.opacity +=
            ((isActiveLink ? 0.5 : isActiveSection ? 0.35 : 0.2) -
              subRingMat.opacity) *
            0.06;

          // Orbit params (seeded randomness)
          const seed = subSeed(sIdx, lIdx);
          const orbitSpeed = 0.18 + seededVal(seed, 17) * 0.22;
          const tiltAngle = 0.4 + seededVal(seed, 31) * 1.2;
          const tiltAxis = seededVal(seed, 43) * Math.PI * 2;
          const orbitDir = (seed * 53) % 2 === 0 ? 1 : -1;
          const radiusVar = 0.85 + seededVal(seed, 61) * 0.3;
          const startAngle = seededVal(seed, 71) * Math.PI * 2;

          // Active link sphere gets bigger orbit + scale
          const targetScale = isActiveLink ? 2.5 : baseScale;
          const targetOrbitR = isActiveLink ? 0.1 : baseOrbitR * radiusVar;

          if (!sub.userData._cOrbitR) sub.userData._cOrbitR = targetOrbitR;
          sub.userData._cOrbitR +=
            (targetOrbitR - sub.userData._cOrbitR) * 0.04;

          if (!sub.userData._cScale) sub.userData._cScale = targetScale;
          sub.userData._cScale += (targetScale - sub.userData._cScale) * 0.05;

          const parentPos = parent.position.clone();
          const angle = startAngle + time * orbitSpeed * orbitDir;
          const oR = sub.userData._cOrbitR;
          const lx = Math.cos(angle) * oR;
          const lz = Math.sin(angle) * oR;
          const cosT = Math.cos(tiltAngle),
            sinT = Math.sin(tiltAngle);
          const cosA = Math.cos(tiltAxis),
            sinA = Math.sin(tiltAxis);
          const x = lx * cosA - lz * sinA;
          const flat = lx * sinA + lz * cosA;
          sub.position.set(
            parentPos.x + x,
            parentPos.y + flat * sinT,
            parentPos.z + flat * cosT,
          );

          const pulse =
            1 +
            Math.sin(time * (2.0 + seededVal(seed, 83) * 1.5) + seed) * 0.08;
          sub.scale.setScalar(sub.userData._cScale * pulse);

          if (sub.children[0]) sub.children[0].lookAt(camera.position);
        });
      });

      // Torus line opacity
      if (lineMat) {
        const target = activeLink ? 0.04 : activeSection ? 0.1 : 1;
        lineMat.opacity += (target - lineMat.opacity) * 0.04;
      }

      // Constellation lines — update positions and opacity
      constellationLinesRef.current.forEach((line, i) => {
        const nextI = (i + 1) % SECTIONS.length;
        if (!spheresRef.current[i] || !spheresRef.current[nextI]) return;
        const p1 = spheresRef.current[i].position;
        const p2 = spheresRef.current[nextI].position;

        const positions = line.geometry.attributes.position.array;
        positions[0] = p1.x;
        positions[1] = p1.y;
        positions[2] = p1.z;
        positions[3] = p2.x;
        positions[4] = p2.y;
        positions[5] = p2.z;
        line.geometry.attributes.position.needsUpdate = true;

        // Fade based on showConstellation prop and activeSection
        const targetOpacity = showConstellation && !activeSection ? 0.35 : 0;
        line.material.opacity += (targetOpacity - line.material.opacity) * 0.08;

        // Hard cutoff — actually hide when nearly invisible
        line.visible = line.material.opacity > 0.01;
      });

      // Report sub-sphere screen positions
      if (onSubSphereScreenPositions && activeSection && !activeLink) {
        const idx = SECTIONS.findIndex((s) => s.id === activeSection);
        if (idx >= 0) {
          const positions = subSpheresRef.current[idx].map((sub) => {
            const sp = sub.position.clone().project(camera);
            return {
              x: ((sp.x + 1) / 2) * window.innerWidth,
              y: ((-sp.y + 1) / 2) * window.innerHeight,
              z: sp.z,
              opacity: sub.userData.subMaterial.opacity,
            };
          });
          onSubSphereScreenPositions(positions);
        }
      } else if (onSubSphereScreenPositions) {
        onSubSphereScreenPositions([]);
      }

      rendererRef.current.render(sceneRef.current, camera);
    },
    [
      activeSection,
      activeLink,
      showConstellation,
      onCameraProgress,
      onSubSphereScreenPositions,
      onClickSection,
      onClickSubSphere,
    ],
  );

  useAnimationFrame(animate);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        touchAction: "none",
      }}
    />
  );
}

// ============================================================
// SUB-SPHERE LABELS (Level 1 only)
// ============================================================
function SubSphereLabels({
  activeSection,
  activeLink,
  positions,
  cameraPhase,
  cameraProgress,
  onClickSubSphere,
}) {
  if (!activeSection || activeLink || !positions || !positions.length)
    return null;

  const sectionData = SECTIONS.find((s) => s.id === activeSection);
  if (!sectionData) return null;

  const op =
    cameraPhase === "flyToParent"
      ? Math.max(0, (cameraProgress - 0.8) / 0.2)
      : cameraPhase === "flyHome"
        ? Math.max(0, 1 - cameraProgress * 4)
        : 1;
  if (op <= 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 15,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "'EB Garamond', Georgia, serif",
          fontSize: "clamp(1.6rem, 5vw, 3rem)",
          fontWeight: 300,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: sectionData.color,
          opacity: op * 0.7,
          textShadow:
            "0 0 40px rgba(248,248,248,0.95), 0 0 80px rgba(248,248,248,0.6)",
          pointerEvents: "none",
        }}
      >
        {sectionData.label}
      </div>
      {positions.map((pos, i) => {
        if (!pos || pos.z > 1 || i >= sectionData.links.length) return null;
        const link = sectionData.links[i];
        const o = Math.min(op, pos.opacity || 0);
        if (o < 0.1) return null;
        return (
          <div
            key={link.id}
            onClick={() => onClickSubSphere?.(sectionData.id, link.id)}
            style={{
              position: "fixed",
              left: `${pos.x}px`,
              top: `${pos.y + 18}px`,
              transform: "translateX(-50%)",
              zIndex: 17,
              opacity: o * 0.85,
              cursor: "pointer",
              pointerEvents: o > 0.3 ? "auto" : "none",
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "clamp(0.6rem, 1.6vw, 0.65rem)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: sectionData.color,
              textShadow: "0 0 8px rgba(248,248,248,0.9)",
              textAlign: "center",
              userSelect: "none",
              whiteSpace: "nowrap",
              padding: "0.4rem 0.6rem",
            }}
          >
            {link.title}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// LINK CONTENT PANEL (Level 2 — near-fullscreen)
// ============================================================
function LinkPanel({
  activeSection,
  activeLink,
  cameraPhase,
  cameraProgress,
  onBack,
}) {
  if (!activeSection || !activeLink) return null;

  const sectionData = SECTIONS.find((s) => s.id === activeSection);
  const linkData = sectionData?.links.find((l) => l.id === activeLink);
  if (!sectionData || !linkData) return null;

  const op =
    cameraPhase === "flyToSub"
      ? Math.max(0, (cameraProgress - 0.6) / 0.4)
      : cameraPhase === "flyToParent" || cameraPhase === "flyHome"
        ? Math.max(0, 1 - cameraProgress * 3)
        : 1;
  if (op <= 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(3.5rem, 8vh, 5rem) clamp(0.75rem, 3vw, 2rem)",
        pointerEvents: op > 0.5 ? "auto" : "none",
        opacity: op,
        transition: "opacity 0.15s ease",
      }}
    >
      <div
        style={{
          width: "min(92vw, 600px)",
          maxHeight: "75vh",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "clamp(10px, 2vw, 16px)",
          padding: "clamp(1.5rem, 4vw, 3.5rem)",
          boxShadow: "0 12px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
          fontFamily: "'EB Garamond', Georgia, serif",
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            fontSize: "clamp(0.55rem, 1.5vw, 0.65rem)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: sectionData.color,
            opacity: 0.6,
            marginBottom: "0.5rem",
          }}
        >
          {sectionData.label}
        </div>
        <h1
          style={{
            fontSize: "clamp(1.6rem, 6vw, 3.5rem)",
            fontWeight: 300,
            letterSpacing: "0.1em",
            color: "#1a1a1a",
            marginBottom: "0.5rem",
            lineHeight: 1.1,
          }}
        >
          {linkData.title}
        </h1>
        <div
          style={{
            fontSize: "clamp(0.7rem, 2vw, 0.8rem)",
            letterSpacing: "0.05em",
            color: sectionData.color,
            opacity: 0.7,
            marginBottom: "clamp(1.2rem, 3vw, 2rem)",
          }}
        >
          {linkData.subtitle}
        </div>
        <p
          style={{
            fontSize: "clamp(0.9rem, 2.5vw, 1.15rem)",
            lineHeight: 1.7,
            color: "#444",
            fontWeight: 400,
            maxWidth: "480px",
          }}
        >
          {linkData.description}
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: "clamp(1.5rem, 3vw, 2.5rem)",
            background: "transparent",
            border: `1px solid ${sectionData.color}33`,
            color: sectionData.color,
            padding: "0.7rem 2rem",
            fontSize: "clamp(0.65rem, 1.8vw, 0.72rem)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "'EB Garamond', Georgia, serif",
            borderRadius: "6px",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = sectionData.color;
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = sectionData.color;
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

// ============================================================
// NAV BAR (with dropdown)
// ============================================================
function NavBar({
  onClickSection,
  activeSection,
  activeLink,
  onBack,
  onBackToSection,
  onClickSubSphere,
  showConstellation,
  onToggleConstellation,
}) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "clamp(0.8rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2.5rem)",
        fontFamily: "'EB Garamond', Georgia, serif",
        background:
          "linear-gradient(to bottom, rgba(248,248,248,0.92) 0%, rgba(248,248,248,0) 100%)",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <div
          onClick={() => {
            if (activeLink) onBackToSection();
            else if (activeSection) onBack();
          }}
          style={{
            fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)",
            fontWeight: 400,
            letterSpacing: "clamp(0.1em, 0.5vw, 0.2em)",
            textTransform: "uppercase",
            color: "#1a1a1a",
            cursor: activeSection || activeLink ? "pointer" : "default",
          }}
        >
          Mica Oz
        </div>
        {!activeSection && (
          <div
            onClick={onToggleConstellation}
            style={{
              fontSize: "clamp(0.5rem, 1.2vw, 0.58rem)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: showConstellation ? "#1a1a1a" : "#aaa",
              cursor: "pointer",
              marginTop: "0.25rem",
              transition: "color 0.2s ease",
              userSelect: "none",
            }}
          >
            ✦ {showConstellation ? "hide" : "show"} constellation
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "clamp(1rem, 4vw, 2.5rem)" }}>
        {SECTIONS.map((section) => (
          <div key={section.id} style={{ position: "relative" }}>
            <div
              onClick={() => {
                if (activeLink && activeSection === section.id)
                  onBackToSection();
                else if (activeSection === section.id) onBack();
                else onClickSection(section.id);
              }}
              style={{
                fontSize: "clamp(0.65rem, 1.8vw, 0.8rem)",
                letterSpacing: "clamp(0.06em, 0.3vw, 0.15em)",
                textTransform: "uppercase",
                color: "#1a1a1a",
                cursor: "pointer",
                padding: "0.25rem 0",
                borderBottom:
                  activeSection === section.id
                    ? `1px solid ${section.color}`
                    : "1px solid transparent",
                opacity:
                  activeSection && activeSection !== section.id ? 0.35 : 1,
                transition: "all 0.3s ease",
              }}
            >
              {section.label}
            </div>
            {activeSection === section.id && !activeLink && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  paddingTop: "0.6rem",
                  minWidth: "120px",
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderRadius: "6px",
                    padding: "0.5rem 0",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  {section.links.map((link) => (
                    <div
                      key={link.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClickSubSphere(section.id, link.id);
                      }}
                      style={{
                        padding: "0.55rem 1.2rem",
                        fontSize: "clamp(0.62rem, 1.6vw, 0.68rem)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: section.color,
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {link.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const [activeLink, setActiveLink] = useState(null);
  const [subSpherePositions, setSubSpherePositions] = useState([]);
  const [cameraPhase, setCameraPhase] = useState("idle");
  const [cameraProgress, setCameraProgress] = useState(0);
  const [showConstellation, setShowConstellation] = useState(false);
  const pendingLinkRef = useRef(null);

  const handleToggleConstellation = useCallback(() => {
    setShowConstellation((prev) => !prev);
  }, []);

  const handleClickSection = useCallback(
    (id) => {
      if (activeSection === id && !activeLink) return;
      pendingLinkRef.current = null;
      setActiveLink(null);
      setActiveSection(id);
    },
    [activeSection, activeLink],
  );

  const handleBack = useCallback(() => {
    pendingLinkRef.current = null;
    setActiveLink(null);
    setActiveSection(null);
    setSubSpherePositions([]);
  }, []);

  const handleBackToSection = useCallback(() => {
    pendingLinkRef.current = null;
    setActiveLink(null);
  }, []);

  const handleCameraProgress = useCallback((phase, progress) => {
    setCameraPhase(phase);
    setCameraProgress(progress);
  }, []);

  // When parent fly completes and we're parked, fire any queued link
  useEffect(() => {
    if (
      pendingLinkRef.current &&
      activeSection &&
      cameraPhase === "parkedAtParent"
    ) {
      const linkId = pendingLinkRef.current;
      pendingLinkRef.current = null;
      setActiveLink(linkId);
    }
  }, [cameraPhase, activeSection]);

  const handleClickSubSphere = useCallback(
    (sectionId, linkId) => {
      if (activeSection !== sectionId) {
        // Need to fly to parent first, then queue the link
        pendingLinkRef.current = linkId;
        setActiveLink(null);
        setActiveSection(sectionId);
      } else if (cameraPhase === "flyToParent") {
        // Parent fly is still in progress — queue it
        pendingLinkRef.current = linkId;
      } else {
        // Already parked at parent, go straight to sub
        setActiveLink(linkId);
      }
    },
    [activeSection, cameraPhase],
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#f8f8f8",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { overflow: hidden; overscroll-behavior: none; }
        html { overflow: hidden; }
        @supports (padding: env(safe-area-inset-bottom)) {
          body { padding-bottom: env(safe-area-inset-bottom); }
        }
      `}</style>

      <Scene3D
        activeSection={activeSection}
        activeLink={activeLink}
        showConstellation={showConstellation}
        onCameraProgress={handleCameraProgress}
        onSubSphereScreenPositions={setSubSpherePositions}
        onClickSection={handleClickSection}
        onClickSubSphere={handleClickSubSphere}
      />

      <SubSphereLabels
        activeSection={activeSection}
        activeLink={activeLink}
        positions={subSpherePositions}
        cameraPhase={cameraPhase}
        cameraProgress={cameraProgress}
        onClickSubSphere={handleClickSubSphere}
      />

      <NavBar
        onClickSection={handleClickSection}
        activeSection={activeSection}
        activeLink={activeLink}
        onBack={handleBack}
        onBackToSection={handleBackToSection}
        onClickSubSphere={handleClickSubSphere}
        showConstellation={showConstellation}
        onToggleConstellation={handleToggleConstellation}
      />

      <LinkPanel
        activeSection={activeSection}
        activeLink={activeLink}
        cameraPhase={cameraPhase}
        cameraProgress={cameraProgress}
        onBack={handleBackToSection}
      />

      {/* Back to section button (Level 1) */}
      {activeSection && !activeLink && cameraPhase !== "flyToParent" && (
        <button
          onClick={handleBack}
          style={{
            position: "fixed",
            bottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(0,0,0,0.08)",
            color: "#1a1a1a",
            padding: "0.6rem clamp(1.2rem, 4vw, 2rem)",
            fontSize: "clamp(0.62rem, 1.8vw, 0.72rem)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "'EB Garamond', Georgia, serif",
            borderRadius: "6px",
            zIndex: 25,
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1a1a1a";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.9)";
            e.currentTarget.style.color = "#1a1a1a";
          }}
        >
          ← Back
        </button>
      )}

      {!activeSection && (
        <div
          style={{
            position: "fixed",
            bottom: "max(2rem, env(safe-area-inset-bottom, 2rem))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5,
            fontFamily: "'EB Garamond', Georgia, serif",
            textAlign: "center",
            color: "#1a1a1a",
            opacity: 0.35,
            fontSize: "clamp(0.58rem, 1.6vw, 0.7rem)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Drag to explore · Click a sphere to enter
        </div>
      )}
    </div>
  );
}

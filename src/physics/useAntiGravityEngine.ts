import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import type {
  AntiGravityConfig,
  EngineEntity,
  PhysicsTelemetry,
} from '../types/engine';

const { Engine, Bodies, Body, Composite, Constraint } = Matter;

interface UseAntiGravityEngineProps {
  config: AntiGravityConfig;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function useAntiGravityEngine({ config, containerRef: _containerRef }: UseAntiGravityEngineProps) {
  // Current runtime configuration state
  const [worldGravityY, setWorldGravityY] = useState<number>(config.world.gravity.y);
  const [worldGravityX, setWorldGravityX] = useState<number>(config.world.gravity.x);
  const [frictionAir, setFrictionAirState] = useState<number>(config.world.frictionAir);
  const [restitution, setRestitutionState] = useState<number>(config.world.restitution);
  const [repulsionEnabled, setRepulsionEnabled] = useState<boolean>(
    config.interaction.cursorRepulsion.enabled
  );
  const [repulsionRadius, setRepulsionRadius] = useState<number>(
    config.interaction.cursorRepulsion.radius
  );
  const [repulsionForce, setRepulsionForce] = useState<number>(
    config.interaction.cursorRepulsion.forceMagnitude
  );

  const [entities, setEntities] = useState<EngineEntity[]>(config.entities);
  const [telemetry, setTelemetry] = useState<PhysicsTelemetry>({
    fps: 60,
    bodyCount: config.entities.length,
    activeGravityY: config.world.gravity.y,
    activeGravityX: config.world.gravity.x,
    airFriction: config.world.frictionAir,
    restitution: config.world.restitution,
    cursorDistance: 0,
    cursorSpeed: 0,
    engineTime: 0,
    isRepelling: false,
  });

  const [shockwaveWave, setShockwaveWave] = useState<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  // Matter references
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesMapRef = useRef<Map<string, Matter.Body>>(new Map());
  const domRefsMap = useRef<Map<string, HTMLElement>>(new Map());
  const boundariesRef = useRef<Matter.Body[]>([]);

  // Dragging state and mouse dummy body for physical constraints
  const mouseBodyRef = useRef<Matter.Body | null>(null);
  const dragConstraintRef = useRef<Matter.Constraint | null>(null);
  const draggedEntityIdRef = useRef<string | null>(null);

  // Cursor state
  const cursorRef = useRef<{
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    active: boolean;
    speed: number;
  }>({
    x: -9999,
    y: -9999,
    prevX: -9999,
    prevY: -9999,
    active: false,
    speed: 0,
  });

  // Telemetry frame counter refs
  const frameCountRef = useRef<number>(0);
  const lastFpsTimestampRef = useRef<number>(performance.now());
  const lastFrameTimeRef = useRef<number>(performance.now());
  const reqAnimFrameRef = useRef<number | null>(null);

  // Ref registration for DOM elements
  const registerDomRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      domRefsMap.current.set(id, el);
    } else {
      domRefsMap.current.delete(id);
    }
  }, []);

  // Update perimeter boundary walls matching viewport
  const updateBoundaries = useCallback((width: number, height: number, thickness: number) => {
    if (!engineRef.current) return;
    const world = engineRef.current.world;

    // Remove existing boundaries
    if (boundariesRef.current.length > 0) {
      Composite.remove(world, boundariesRef.current);
      boundariesRef.current = [];
    }

    const wallOptions: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      restitution: restitution,
      friction: 0.05,
      render: { visible: false },
    };

    // Invisible perimeter walls enclosing the viewport
    const topWall = Bodies.rectangle(
      width / 2,
      -thickness / 2,
      width * 2,
      thickness,
      wallOptions
    );
    const bottomWall = Bodies.rectangle(
      width / 2,
      height + thickness / 2,
      width * 2,
      thickness,
      wallOptions
    );
    const leftWall = Bodies.rectangle(
      -thickness / 2,
      height / 2,
      thickness,
      height * 2,
      wallOptions
    );
    const rightWall = Bodies.rectangle(
      width + thickness / 2,
      height / 2,
      thickness,
      height * 2,
      wallOptions
    );

    boundariesRef.current = [topWall, bottomWall, leftWall, rightWall];
    Composite.add(world, boundariesRef.current);
  }, [restitution]);

  // Create Matter body for an entity
  const createEntityBody = useCallback(
    (entity: EngineEntity, viewportWidth: number, viewportHeight: number): Matter.Body => {
      const posX = Math.max(80, Math.min(viewportWidth - 80, viewportWidth * entity.spawnRatio.x));
      const posY = Math.max(80, Math.min(viewportHeight - 80, viewportHeight * entity.spawnRatio.y));

      const commonOptions: Matter.IChamferableBodyDefinition = {
        mass: entity.mass,
        frictionAir: frictionAir,
        restitution: restitution,
        friction: 0.04,
        label: entity.id,
      };

      let body: Matter.Body;
      if (entity.type === 'orb') {
        const radius = entity.dimensions?.radius || 50;
        body = Bodies.circle(posX, posY, radius, commonOptions);
      } else {
        const width = entity.dimensions?.width || 320;
        const height = entity.dimensions?.height || 240;
        body = Bodies.rectangle(posX, posY, width, height, commonOptions);
      }

      // Add gentle initial orbital angular velocity
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.006);
      return body;
    },
    [frictionAir, restitution]
  );

  // Initialize headless Matter engine
  useEffect(() => {
    const engine = Engine.create({
      enableSleeping: false,
    });

    // Upward Anti-Gravity Drift
    engine.gravity.x = worldGravityX;
    engine.gravity.y = worldGravityY;
    engine.gravity.scale = config.world.gravity.scale;

    engineRef.current = engine;

    // Create a kinematic mouse body for spring drag constraints
    const mouseBody = Bodies.circle(-9999, -9999, 10, {
      isStatic: true,
      collisionFilter: { mask: 0 },
    });
    mouseBodyRef.current = mouseBody;
    Composite.add(engine.world, mouseBody);

    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;

    // Boundaries
    if (config.world.boundaries.enabled) {
      updateBoundaries(vpWidth, vpHeight, config.world.boundaries.thickness);
    }

    // Entities
    entities.forEach((entity) => {
      const body = createEntityBody(entity, vpWidth, vpHeight);
      bodiesMapRef.current.set(entity.id, body);
      Composite.add(engine.world, body);
    });

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (config.world.boundaries.enabled) {
        updateBoundaries(w, h, config.world.boundaries.thickness);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqAnimFrameRef.current) {
        cancelAnimationFrame(reqAnimFrameRef.current);
      }
      Composite.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []); // Run once on mount

  // Sync runtime gravity changes to engine
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.gravity.x = worldGravityX;
    engineRef.current.gravity.y = worldGravityY;
  }, [worldGravityX, worldGravityY]);

  // Sync runtime frictionAir & restitution to existing bodies
  useEffect(() => {
    bodiesMapRef.current.forEach((body) => {
      body.frictionAir = frictionAir;
      body.restitution = restitution;
    });
    boundariesRef.current.forEach((wall) => {
      wall.restitution = restitution;
    });
  }, [frictionAir, restitution]);

  // Main high-performance physics & DOM synchronization loop
  useEffect(() => {
    let active = true;

    const physicsLoop = (timestamp: number) => {
      if (!active) return;

      const engine = engineRef.current;
      if (engine) {
        const delta = Math.min(timestamp - lastFrameTimeRef.current, 32); // Clamp to prevent delta spikes
        lastFrameTimeRef.current = timestamp;

        // 1. Calculate cursor velocity
        const cursor = cursorRef.current;
        if (cursor.active && cursor.prevX !== -9999) {
          const cdx = cursor.x - cursor.prevX;
          const cdy = cursor.y - cursor.prevY;
          cursor.speed = Math.sqrt(cdx * cdx + cdy * cdy);
        } else {
          cursor.speed = 0;
        }
        cursor.prevX = cursor.x;
        cursor.prevY = cursor.y;

        // 2. Cursor Vector Field Repulsion: F = (1 - distance / radius) * forceMagnitude
        let isAnyRepelled = false;
        let minCursorDist = 9999;

        if (repulsionEnabled && cursor.active) {
          bodiesMapRef.current.forEach((body) => {
            const dx = body.position.x - cursor.x;
            const dy = body.position.y - cursor.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minCursorDist) {
              minCursorDist = dist;
            }

            if (dist < repulsionRadius && dist > 1) {
              isAnyRepelled = true;
              const nx = dx / dist;
              const ny = dy / dist;
              // Radial distance repulsion formula
              const F = (1 - dist / repulsionRadius) * repulsionForce;
              Body.applyForce(body, body.position, {
                x: nx * F,
                y: ny * F,
              });

              // Apply small spin torque from off-center repulsion
              Body.applyForce(body, { x: body.position.x + 10, y: body.position.y }, {
                x: 0,
                y: ny * F * 0.15,
              });
            }
          });
        }

        // 3. Move drag constraint if currently dragging
        if (mouseBodyRef.current && cursor.active && dragConstraintRef.current) {
          Body.setPosition(mouseBodyRef.current, { x: cursor.x, y: cursor.y });
        }

        // 4. Advance headless physics engine
        Engine.update(engine, delta);

        // 5. High-Performance DOM Synchronization
        // Direct CSS transform mutations via translate3d and rotate radians
        entities.forEach((entity) => {
          const body = bodiesMapRef.current.get(entity.id);
          const domEl = domRefsMap.current.get(entity.id);

          if (body && domEl) {
            let halfW = 0;
            let halfH = 0;

            if (entity.type === 'orb') {
              const r = entity.dimensions?.radius || 50;
              halfW = r;
              halfH = r;
            } else {
              halfW = (entity.dimensions?.width || 320) / 2;
              halfH = (entity.dimensions?.height || 240) / 2;
            }

            const x = body.position.x - halfW;
            const y = body.position.y - halfH;
            const angleRad = body.angle;

            // Direct transform mutation - avoids React reconciliation overhead
            domEl.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0px) rotate(${angleRad.toFixed(4)}rad)`;
          }
        });

        // 6. Calculate FPS and sample telemetry every 15 frames
        frameCountRef.current++;
        if (timestamp - lastFpsTimestampRef.current >= 250) {
          const computedFps = Math.round(
            (frameCountRef.current * 1000) / (timestamp - lastFpsTimestampRef.current)
          );
          setTelemetry({
            fps: Math.min(144, computedFps),
            bodyCount: bodiesMapRef.current.size,
            activeGravityY: worldGravityY,
            activeGravityX: worldGravityX,
            airFriction: frictionAir,
            restitution: restitution,
            cursorDistance: minCursorDist === 9999 ? 0 : Math.round(minCursorDist),
            cursorSpeed: Math.round(cursor.speed),
            engineTime: Math.round(timestamp / 1000),
            isRepelling: isAnyRepelled,
          });
          frameCountRef.current = 0;
          lastFpsTimestampRef.current = timestamp;
        }
      }

      reqAnimFrameRef.current = requestAnimationFrame(physicsLoop);
    };

    reqAnimFrameRef.current = requestAnimationFrame(physicsLoop);

    return () => {
      active = false;
      if (reqAnimFrameRef.current) {
        cancelAnimationFrame(reqAnimFrameRef.current);
      }
    };
  }, [
    entities,
    repulsionEnabled,
    repulsionRadius,
    repulsionForce,
    worldGravityX,
    worldGravityY,
    frictionAir,
    restitution,
  ]);

  // Pointer event tracking for repulsion field & dragging
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    cursorRef.current.x = e.clientX;
    cursorRef.current.y = e.clientY;
    cursorRef.current.active = true;
  }, []);

  const handlePointerLeave = useCallback(() => {
    cursorRef.current.active = false;
    cursorRef.current.x = -9999;
    cursorRef.current.y = -9999;
    endDrag();
  }, []);

  // Initiate drag on an entity
  const startDrag = useCallback(
    (entityId: string, clientX: number, clientY: number) => {
      const body = bodiesMapRef.current.get(entityId);
      const engine = engineRef.current;
      const mouseBody = mouseBodyRef.current;

      if (!body || !engine || !mouseBody) return;

      // Clean up previous constraint if any
      if (dragConstraintRef.current) {
        Composite.remove(engine.world, dragConstraintRef.current);
        dragConstraintRef.current = null;
      }

      Body.setPosition(mouseBody, { x: clientX, y: clientY });

      // Local offset from body center
      const localPoint = {
        x: clientX - body.position.x,
        y: clientY - body.position.y,
      };

      const constraint = Constraint.create({
        bodyA: mouseBody,
        bodyB: body,
        pointB: localPoint,
        stiffness: config.interaction.dragConstraint.stiffness,
        damping: 0.12,
        render: { visible: false },
      });

      dragConstraintRef.current = constraint;
      draggedEntityIdRef.current = entityId;
      Composite.add(engine.world, constraint);
    },
    [config.interaction.dragConstraint]
  );

  // End drag and release body with physics momentum
  const endDrag = useCallback(() => {
    const engine = engineRef.current;
    if (dragConstraintRef.current && engine) {
      Composite.remove(engine.world, dragConstraintRef.current);
      dragConstraintRef.current = null;
    }
    draggedEntityIdRef.current = null;
  }, []);

  // Gravitational Shockwave Pulse
  const triggerShockwave = useCallback(
    (originX?: number, originY?: number, strength: number = 0.18) => {
      const centerX = originX ?? window.innerWidth / 2;
      const centerY = originY ?? window.innerHeight / 2;

      setShockwaveWave({ id: Date.now(), x: centerX, y: centerY });
      setTimeout(() => setShockwaveWave(null), 1200);

      bodiesMapRef.current.forEach((body) => {
        const dx = body.position.x - centerX;
        const dy = body.position.y - centerY;
        const dist = Math.max(15, Math.sqrt(dx * dx + dy * dy));

        const nx = dx / dist;
        const ny = dy / dist;
        const impulseMagnitude = (1 / (dist * 0.005 + 1)) * strength * body.mass;

        Body.applyForce(body, body.position, {
          x: nx * impulseMagnitude,
          y: ny * impulseMagnitude,
        });

        // Add random rotational torque
        Body.setAngularVelocity(body, body.angularVelocity + (Math.random() - 0.5) * 0.08);
      });
    },
    []
  );

  // Re-center / re-orbit all entities back to spawn ratios
  const resetPositions = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    entities.forEach((entity) => {
      const body = bodiesMapRef.current.get(entity.id);
      if (body) {
        const targetX = w * entity.spawnRatio.x;
        const targetY = h * entity.spawnRatio.y;
        Body.setPosition(body, { x: targetX, y: targetY });
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);
        Body.setAngle(body, 0);
      }
    });
  }, [entities]);

  // Invert Gravity between Upward Anti-G (-0.04) and Standard Gravity (+0.04)
  const toggleGravityInversion = useCallback(() => {
    setWorldGravityY((prev) => (prev < 0 ? 0.04 : -0.04));
  }, []);

  // Spawn new dynamic entity
  const spawnEntity = useCallback(
    (newEntity: EngineEntity) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const engine = engineRef.current;
      if (!engine) return;

      const body = createEntityBody(newEntity, w, h);
      bodiesMapRef.current.set(newEntity.id, body);
      Composite.add(engine.world, body);

      setEntities((prev) => [...prev, newEntity]);
    },
    [createEntityBody]
  );

  // Remove entity
  const removeEntity = useCallback((id: string) => {
    const engine = engineRef.current;
    const body = bodiesMapRef.current.get(id);
    if (engine && body) {
      Composite.remove(engine.world, body);
      bodiesMapRef.current.delete(id);
      domRefsMap.current.delete(id);
      setEntities((prev) => prev.filter((e) => e.id !== id));
    }
  }, []);

  return {
    entities,
    telemetry,
    registerDomRef,
    handlePointerMove,
    handlePointerLeave,
    startDrag,
    endDrag,
    draggedEntityIdRef,
    cursorRef,
    shockwaveWave,
    // Controls
    worldGravityY,
    setWorldGravityY,
    worldGravityX,
    setWorldGravityX,
    frictionAir,
    setFrictionAir: setFrictionAirState,
    restitution,
    setRestitution: setRestitutionState,
    repulsionEnabled,
    setRepulsionEnabled,
    repulsionRadius,
    setRepulsionRadius,
    repulsionForce,
    setRepulsionForce,
    // Actions
    triggerShockwave,
    resetPositions,
    toggleGravityInversion,
    spawnEntity,
    removeEntity,
  };
}

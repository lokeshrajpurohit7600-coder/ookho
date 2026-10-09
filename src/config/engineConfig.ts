import type { AntiGravityConfig } from '../types/engine';

export const defaultEngineConfig: AntiGravityConfig = {
  world: {
    gravity: {
      x: 0,
      y: -0.04, // Negative y creates upward anti-gravity drift
      scale: 0.001,
    },
    frictionAir: 0.018, // Zero-G spatial resistance
    restitution: 0.82, // Boundary bounce elasticity
    boundaries: {
      enabled: true,
      thickness: 100,
    },
  },
  interaction: {
    cursorRepulsion: {
      enabled: true,
      radius: 180,
      forceMagnitude: 0.05,
    },
    dragConstraint: {
      stiffness: 0.15,
      angularStiffness: 0.1,
    },
  },
  entities: [
    {
      id: 'term-orbital-defense',
      type: 'terminal',
      title: 'ORBITAL DEFENSE // KERNEL SYS',
      category: 'TACTICAL TELEMETRY',
      mass: 5.5,
      dimensions: {
        width: 440,
        height: 310,
      },
      spawnRatio: {
        x: 0.32,
        y: 0.45,
      },
      styleClasses: 'glass-cyber',
      metadata: {
        status: 'ONLINE',
        badge: 'ACTIVE DAEMON',
        accentColor: 'cyan',
        initialLogs: [
          '[SYS_INIT] Quantum core booted at 0.001 scale gravity.',
          '[NET_SEC] Zero-G spatial resistance locked: frictionAir 0.018.',
          '[REPULSION] Vector field radar active (R: 180px, F: 0.05).',
          '[ALERT] Orbital upward drift detected: y = -0.04 G.',
          '[READY] Type "help" to list interactive subroutines.',
        ],
      },
    },
    {
      id: 'card-quantum-cipher',
      type: 'card',
      title: 'QUANTUM CIPHER VAULT',
      category: 'CRYPTOGRAPHY NODE',
      mass: 4.2,
      dimensions: {
        width: 320,
        height: 250,
      },
      spawnRatio: {
        x: 0.76,
        y: 0.34,
      },
      styleClasses: 'glass-cyber-violet',
      metadata: {
        status: 'ENCRYPTED',
        badge: 'SHA3-512 SECURED',
        accentColor: 'purple',
        subtitle: 'ROTATING AES-GCM ENTROPY KEY',
        metrics: [
          { label: 'Entropy Flux', value: '99.98%', change: '+0.04%' },
          { label: 'Cipher Key', value: '0x8F..4B2A' },
          { label: 'Qubit Coherence', value: '412 ps' },
        ],
      },
    },
    {
      id: 'card-neural-firewall',
      type: 'card',
      title: 'NEURAL FIREWALL V4',
      category: 'THREAT MITIGATION',
      mass: 4.0,
      dimensions: {
        width: 320,
        height: 250,
      },
      spawnRatio: {
        x: 0.16,
        y: 0.72,
      },
      styleClasses: 'glass-cyber-emerald',
      metadata: {
        status: 'ACTIVE',
        badge: 'PORT 443 ARMORED',
        accentColor: 'emerald',
        subtitle: 'DEEP PACKET INSPECTION ARRAY',
        metrics: [
          { label: 'Blocked Attacks', value: '42,910', change: '+12/s' },
          { label: 'Filter Velocity', value: '1.2 TB/s' },
          { label: 'Heuristic Drift', value: '0.002%' },
        ],
      },
    },
    {
      id: 'card-satellite-uplink',
      type: 'card',
      title: 'DEEP SPACE UPLINK',
      category: 'COMM ARRAY',
      mass: 3.8,
      dimensions: {
        width: 310,
        height: 240,
      },
      spawnRatio: {
        x: 0.82,
        y: 0.78,
      },
      styleClasses: 'glass-cyber-amber',
      metadata: {
        status: 'ONLINE',
        badge: 'GEO-SYNC 35,786 KM',
        accentColor: 'amber',
        subtitle: 'CARRIER FREQUENCY 34.2 GHZ',
        metrics: [
          { label: 'Carrier SNR', value: '42.8 dB', change: 'Optimal' },
          { label: 'Uplink Ping', value: '14.2 ms' },
          { label: 'Doppler Shift', value: '-0.018 MHz' },
        ],
      },
    },
    {
      id: 'orb-zero-g-core',
      type: 'orb',
      title: 'ANTI-G SINGULARITY',
      category: 'GRAV ANOMALY',
      mass: 5.0,
      dimensions: {
        radius: 64,
      },
      spawnRatio: {
        x: 0.54,
        y: 0.28,
      },
      styleClasses: 'glass-cyber',
      metadata: {
        status: 'ACTIVE',
        badge: 'ZERO-G FLUX',
        accentColor: 'cyan',
      },
    },
    {
      id: 'orb-plasma-relay',
      type: 'orb',
      title: 'ION RELAY PROBE',
      category: 'MICRONODE',
      mass: 2.5,
      dimensions: {
        radius: 46,
      },
      spawnRatio: {
        x: 0.48,
        y: 0.72,
      },
      styleClasses: 'glass-cyber-emerald',
      metadata: {
        status: 'ONLINE',
        badge: 'BEACON ON',
        accentColor: 'emerald',
      },
    },
  ],
};

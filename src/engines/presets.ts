import { DynamicVariable, EnginePresetInfo, EngineType, ParameterCategory, RandomizeIntensity } from '../types';

// Curated aesthetic palettes for Look randomization
export const COLOR_PALETTES = [
  { name: 'Cyber Neon', colors: ['#00f0ff', '#ff0077', '#7928ca', '#00ff88', '#0a0a14'] },
  { name: 'Solar Flare', colors: ['#ff4d00', '#ffaa00', '#ffd000', '#ff0055', '#160805'] },
  { name: 'Deep Sea Bioluminescence', colors: ['#00e5ff', '#0077ff', '#00ffa3', '#4d7cff', '#030c1e'] },
  { name: 'Tokyo Twilight', colors: ['#ff3366', '#33ccff', '#9933ff', '#ffcc00', '#0e0b16'] },
  { name: 'Emerald Mirage', colors: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#021e14'] },
  { name: 'Monochrome Velvet', colors: ['#ffffff', '#e2e8f0', '#94a3b8', '#475569', '#0a0a0c'] },
  { name: 'Cosmic Nebula', colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#f43f5e', '#090814'] },
];

export const ENGINE_PRESETS: Record<EngineType, EnginePresetInfo> = {
  particle_swarm: {
    id: 'particle_swarm',
    name: 'Kinetic Particle Swarm',
    description: 'Autonomous flocking particles guided by spring tension, noise currents, and mouse gravitational forces.',
    defaultVariables: [
      // Physics
      {
        id: 'ps_speed',
        key: 'speed',
        name: 'Max Velocity',
        category: 'physics',
        type: 'number',
        value: 4.5,
        defaultValue: 4.5,
        min: 0.5,
        max: 12.0,
        step: 0.1,
        unit: 'px/f',
        isLocked: false,
        description: 'Maximum travel speed of active particles',
      },
      {
        id: 'ps_damping',
        key: 'damping',
        name: 'Inertia Damping',
        category: 'physics',
        type: 'number',
        value: 0.94,
        defaultValue: 0.94,
        min: 0.8,
        max: 0.99,
        step: 0.01,
        isLocked: false,
        description: 'Velocity retention per frame (drag factor)',
      },
      {
        id: 'ps_gravity',
        key: 'gravity',
        name: 'Pointer Gravity',
        category: 'physics',
        type: 'number',
        value: 0.65,
        defaultValue: 0.65,
        min: -1.5,
        max: 2.0,
        step: 0.05,
        unit: 'G',
        isLocked: false,
        description: 'Attraction (positive) or repulsion (negative) to cursor',
      },
      {
        id: 'ps_spring',
        key: 'springStiffness',
        name: 'Spring Tension',
        category: 'physics',
        type: 'number',
        value: 0.04,
        defaultValue: 0.04,
        min: 0.005,
        max: 0.15,
        step: 0.005,
        isLocked: false,
        description: 'Restorative pull towards origin or target',
      },
      {
        id: 'ps_collision',
        key: 'bounceWall',
        name: 'Boundary Bounce',
        category: 'physics',
        type: 'boolean',
        value: true,
        defaultValue: true,
        isLocked: false,
        description: 'Reflect off canvas edges rather than wrapping',
      },

      // Function
      {
        id: 'ps_noise_scale',
        key: 'noiseScale',
        name: 'Curl Noise Scale',
        category: 'function',
        type: 'number',
        value: 0.004,
        defaultValue: 0.004,
        min: 0.0005,
        max: 0.02,
        step: 0.0005,
        isLocked: false,
        description: 'Spatial frequency of curl noise vector field',
      },
      {
        id: 'ps_wander_freq',
        key: 'wanderStrength',
        name: 'Wander Turbulence',
        category: 'function',
        type: 'number',
        value: 0.45,
        defaultValue: 0.45,
        min: 0.0,
        max: 1.5,
        step: 0.05,
        isLocked: false,
        description: 'Brownian random jitter force applied each step',
      },
      {
        id: 'ps_orbit_function',
        key: 'mathMode',
        name: 'Flow Field Mode',
        category: 'function',
        type: 'select',
        value: 'curl',
        defaultValue: 'curl',
        options: [
          { label: 'Curl Vector Field', value: 'curl' },
          { label: 'Harmonic Spiral', value: 'spiral' },
          { label: 'Orbital Dipole', value: 'dipole' },
          { label: 'Perlin Wave Grid', value: 'perlin' },
        ],
        isLocked: false,
        description: 'Underlying mathematical vector flow geometry',
      },

      // Look
      {
        id: 'ps_primary_color',
        key: 'primaryColor',
        name: 'Primary Tint',
        category: 'look',
        type: 'color',
        value: '#00f0ff',
        defaultValue: '#00f0ff',
        isLocked: false,
        description: 'Dominant glow color of fast particles',
      },
      {
        id: 'ps_secondary_color',
        key: 'secondaryColor',
        name: 'Secondary Tint',
        category: 'look',
        type: 'color',
        value: '#ff0077',
        defaultValue: '#ff0077',
        isLocked: false,
        description: 'Accent tint for slow or clustered particles',
      },
      {
        id: 'ps_bg_color',
        key: 'bgColor',
        name: 'Background Tone',
        category: 'look',
        type: 'color',
        value: '#08090d',
        defaultValue: '#08090d',
        isLocked: true, // Often users prefer keeping dark canvas locked
        description: 'Canvas backdrop color',
      },
      {
        id: 'ps_trail_opacity',
        key: 'trailFade',
        name: 'Trail Persistence',
        category: 'look',
        type: 'number',
        value: 0.18,
        defaultValue: 0.18,
        min: 0.02,
        max: 0.6,
        step: 0.02,
        isLocked: false,
        description: 'Canvas fade rate controlling motion blur trail length',
      },
      {
        id: 'ps_glow',
        key: 'glowRadius',
        name: 'Glow Bloom',
        category: 'look',
        type: 'number',
        value: 12,
        defaultValue: 12,
        min: 0,
        max: 30,
        step: 1,
        unit: 'px',
        isLocked: false,
        description: 'Photonic shadow blur around active points',
      },

      // Attributes
      {
        id: 'ps_count',
        key: 'particleCount',
        name: 'Particle Density',
        category: 'attributes',
        type: 'number',
        value: 160,
        defaultValue: 160,
        min: 30,
        max: 450,
        step: 10,
        unit: 'pts',
        isLocked: false,
        description: 'Total number of simulated kinetic points',
      },
      {
        id: 'ps_radius',
        key: 'particleRadius',
        name: 'Node Radius',
        category: 'attributes',
        type: 'number',
        value: 3.5,
        defaultValue: 3.5,
        min: 1.0,
        max: 12.0,
        step: 0.5,
        unit: 'px',
        isLocked: false,
        description: 'Base radius of particle bodies',
      },
      {
        id: 'ps_connect_dist',
        key: 'connectDistance',
        name: 'Connection Radius',
        category: 'attributes',
        type: 'number',
        value: 75,
        defaultValue: 75,
        min: 0,
        max: 180,
        step: 5,
        unit: 'px',
        isLocked: false,
        description: 'Proximity threshold to draw web lines between points',
      },
      {
        id: 'ps_shape',
        key: 'shapeType',
        name: 'Geometry Form',
        category: 'attributes',
        type: 'select',
        value: 'circle',
        defaultValue: 'circle',
        options: [
          { label: 'Glowing Discs', value: 'circle' },
          { label: 'Diamond Shards', value: 'diamond' },
          { label: 'Velocity Vectors', value: 'line' },
          { label: 'Delta Triangles', value: 'triangle' },
        ],
        isLocked: false,
        description: 'Visual vertex representation for nodes',
      },
    ],
  },

  harmonic_mesh: {
    id: 'harmonic_mesh',
    name: 'Harmonic Wave Ribbons',
    description: 'Mathematical Fourier resonance ribbons and sine-curved harmonic lattices generated with Pts.js Curve & Geom.',
    defaultVariables: [
      // Physics
      {
        id: 'hm_velocity',
        key: 'speed',
        name: 'Wave Propagation',
        category: 'physics',
        type: 'number',
        value: 1.8,
        defaultValue: 1.8,
        min: 0.2,
        max: 5.0,
        step: 0.1,
        unit: 'rad/s',
        isLocked: false,
        description: 'Temporal progression speed through harmonic phases',
      },
      {
        id: 'hm_damping',
        key: 'damping',
        name: 'Resonance Damp',
        category: 'physics',
        type: 'number',
        value: 0.96,
        defaultValue: 0.96,
        min: 0.7,
        max: 0.99,
        step: 0.01,
        isLocked: false,
        description: 'Spatial attenuation along ribbon length',
      },
      {
        id: 'hm_tension',
        key: 'tension',
        name: 'Ribbon Tension',
        category: 'physics',
        type: 'number',
        value: 0.5,
        defaultValue: 0.5,
        min: 0.1,
        max: 1.5,
        step: 0.05,
        isLocked: false,
        description: 'Bezier interpolation smoothness and tautness',
      },

      // Function
      {
        id: 'hm_waveform',
        key: 'waveFunction',
        name: 'Oscillation Kernel',
        category: 'function',
        type: 'select',
        value: 'sine_fourier',
        defaultValue: 'sine_fourier',
        options: [
          { label: 'Fourier Harmonic Blend', value: 'sine_fourier' },
          { label: 'Complex Chebyshev Waves', value: 'chebyshev' },
          { label: 'Lissajous Resonance', value: 'lissajous' },
          { label: 'Interfering Ripple Rings', value: 'ripple' },
        ],
        isLocked: false,
        description: 'Harmonic generator governing ribbon curvature',
      },
      {
        id: 'hm_frequency',
        key: 'frequency',
        name: 'Spatial Frequency',
        category: 'function',
        type: 'number',
        value: 3.2,
        defaultValue: 3.2,
        min: 0.5,
        max: 8.0,
        step: 0.1,
        isLocked: false,
        description: 'Number of wave crests across the viewport span',
      },
      {
        id: 'hm_amplitude',
        key: 'amplitude',
        name: 'Oscillation Amplitude',
        category: 'function',
        type: 'number',
        value: 90,
        defaultValue: 90,
        min: 20,
        max: 220,
        step: 5,
        unit: 'px',
        isLocked: false,
        description: 'Peak vertical displacement of harmonic waves',
      },
      {
        id: 'hm_phase_shift',
        key: 'phaseShift',
        name: 'Phase Rib Offset',
        category: 'function',
        type: 'number',
        value: 0.35,
        defaultValue: 0.35,
        min: 0.05,
        max: 1.2,
        step: 0.05,
        unit: 'rad',
        isLocked: false,
        description: 'Incremental phase shift between neighboring ribbons',
      },

      // Look
      {
        id: 'hm_color1',
        key: 'primaryColor',
        name: 'Crest Tone',
        category: 'look',
        type: 'color',
        value: '#38bdf8',
        defaultValue: '#38bdf8',
        isLocked: false,
        description: 'Color of positive wave displacement peaks',
      },
      {
        id: 'hm_color2',
        key: 'secondaryColor',
        name: 'Trough Tone',
        category: 'look',
        type: 'color',
        value: '#a855f7',
        defaultValue: '#a855f7',
        isLocked: false,
        description: 'Color of negative wave displacement troughs',
      },
      {
        id: 'hm_bg_color',
        key: 'bgColor',
        name: 'Background Tone',
        category: 'look',
        type: 'color',
        value: '#080b12',
        defaultValue: '#080b12',
        isLocked: true,
        description: 'Canvas backdrop tone',
      },
      {
        id: 'hm_line_width',
        key: 'strokeWidth',
        name: 'Ribbon Stroke Width',
        category: 'look',
        type: 'number',
        value: 2.2,
        defaultValue: 2.2,
        min: 0.5,
        max: 8.0,
        step: 0.1,
        unit: 'px',
        isLocked: false,
        description: 'Line thickness of rendering ribs',
      },
      {
        id: 'hm_fill_mesh',
        key: 'fillMesh',
        name: 'Translucent Fill Ribs',
        category: 'look',
        type: 'boolean',
        value: true,
        defaultValue: true,
        isLocked: false,
        description: 'Fill polygonal surface mesh between adjacent strands',
      },

      // Attributes
      {
        id: 'hm_ribbon_count',
        key: 'ribbonCount',
        name: 'Strand Count',
        category: 'attributes',
        type: 'number',
        value: 18,
        defaultValue: 18,
        min: 4,
        max: 48,
        step: 1,
        isLocked: false,
        description: 'Total number of interleaved ribbons',
      },
      {
        id: 'hm_segments',
        key: 'segments',
        name: 'Interpolation Steps',
        category: 'attributes',
        type: 'number',
        value: 65,
        defaultValue: 65,
        min: 20,
        max: 140,
        step: 5,
        isLocked: false,
        description: 'Vertex count per ribbon curve for smooth rendering',
      },
      {
        id: 'hm_symmetry',
        key: 'radialSymmetry',
        name: 'Radial Symmetry',
        category: 'attributes',
        type: 'number',
        value: 1,
        defaultValue: 1,
        min: 1,
        max: 8,
        step: 1,
        isLocked: false,
        description: 'Rotational symmetry repetition around center',
      },
    ],
  },

  geometric_delaunay: {
    id: 'geometric_delaunay',
    name: 'Delaunay & Voronoi Web',
    description: 'Dynamic computational geometry mesh with Delaunay triangulation, Voronoi cells, and elastic kinetic nodes.',
    defaultVariables: [
      // Physics
      {
        id: 'gd_wander',
        key: 'wanderSpeed',
        name: 'Thermal Drift Speed',
        category: 'physics',
        type: 'number',
        value: 1.4,
        defaultValue: 1.4,
        min: 0.2,
        max: 4.5,
        step: 0.1,
        unit: 'px/f',
        isLocked: false,
        description: 'Natural kinetic drift of triangulation nodes',
      },
      {
        id: 'gd_mouse_repel',
        key: 'repelForce',
        name: 'Pointer Disruption',
        category: 'physics',
        type: 'number',
        value: 120,
        defaultValue: 120,
        min: 0,
        max: 300,
        step: 10,
        unit: 'px',
        isLocked: false,
        description: 'Elastic displacement radius surrounding the mouse cursor',
      },
      {
        id: 'gd_elasticity',
        key: 'springRestore',
        name: 'Mesh Elasticity',
        category: 'physics',
        type: 'number',
        value: 0.08,
        defaultValue: 0.08,
        min: 0.01,
        max: 0.25,
        step: 0.01,
        isLocked: false,
        description: 'Spring stiffness returning disturbed nodes to home',
      },

      // Function
      {
        id: 'gd_dist_metric',
        key: 'distanceMetric',
        name: 'Distance Metric',
        category: 'function',
        type: 'select',
        value: 'euclidean',
        defaultValue: 'euclidean',
        options: [
          { label: 'Euclidean Space (L2)', value: 'euclidean' },
          { label: 'Manhattan Grid (L1)', value: 'manhattan' },
          { label: 'Chebyshev Hex (L-Inf)', value: 'chebyshev' },
          { label: 'Minkowski Hyperbolic', value: 'minkowski' },
        ],
        isLocked: false,
        description: 'Proximity topology calculating facet triangulation',
      },
      {
        id: 'gd_jitter_seed',
        key: 'noisePerturb',
        name: 'Lattice Irregularity',
        category: 'function',
        type: 'number',
        value: 0.7,
        defaultValue: 0.7,
        min: 0.1,
        max: 1.5,
        step: 0.05,
        isLocked: false,
        description: 'Asymmetry multiplier breaking rigid grid regularity',
      },

      // Look
      {
        id: 'gd_wire_color',
        key: 'primaryColor',
        name: 'Edge Wireframe Tint',
        category: 'look',
        type: 'color',
        value: '#10b981',
        defaultValue: '#10b981',
        isLocked: false,
        description: 'Color of connecting Delaunay wireframe struts',
      },
      {
        id: 'gd_cell_color',
        key: 'secondaryColor',
        name: 'Facet Shading Tint',
        category: 'look',
        type: 'color',
        value: '#064e3b',
        defaultValue: '#064e3b',
        isLocked: false,
        description: 'Base color shading internal triangular facets',
      },
      {
        id: 'gd_bg_color',
        key: 'bgColor',
        name: 'Background Tone',
        category: 'look',
        type: 'color',
        value: '#05110d',
        defaultValue: '#05110d',
        isLocked: true,
        description: 'Canvas backdrop color',
      },
      {
        id: 'gd_facet_alpha',
        key: 'facetOpacity',
        name: 'Facet Opacity',
        category: 'look',
        type: 'number',
        value: 0.35,
        defaultValue: 0.35,
        min: 0.0,
        max: 0.9,
        step: 0.05,
        isLocked: false,
        description: 'Transparency of filled triangular facets',
      },
      {
        id: 'gd_circumcircles',
        key: 'drawCircumcircles',
        name: 'Circumcircle Ghosting',
        category: 'look',
        type: 'boolean',
        value: false,
        defaultValue: false,
        isLocked: false,
        description: 'Faintly render geometric Delaunay circumscribed circles',
      },

      // Attributes
      {
        id: 'gd_node_count',
        key: 'nodeCount',
        name: 'Lattice Nodes',
        category: 'attributes',
        type: 'number',
        value: 60,
        defaultValue: 60,
        min: 15,
        max: 180,
        step: 5,
        unit: 'nodes',
        isLocked: false,
        description: 'Quantity of generating seed points for the mesh',
      },
      {
        id: 'gd_node_size',
        key: 'nodeRadius',
        name: 'Vertex Pivot Radius',
        category: 'attributes',
        type: 'number',
        value: 3.0,
        defaultValue: 3.0,
        min: 0.5,
        max: 8.0,
        step: 0.5,
        unit: 'px',
        isLocked: false,
        description: 'Radius of vertices pinned to triangulation nodes',
      },
      {
        id: 'gd_max_edge',
        key: 'maxEdgeLength',
        name: 'Max Triangulation Reach',
        category: 'attributes',
        type: 'number',
        value: 190,
        defaultValue: 190,
        min: 70,
        max: 350,
        step: 10,
        unit: 'px',
        isLocked: false,
        description: 'Distance cut-off avoiding overly long edge struts',
      },
    ],
  },

  kinetic_ribbons: {
    id: 'kinetic_ribbons',
    name: 'Vector Flow Ribbons',
    description: 'Silken ribbon strips threading through dynamic vector fields, with centrifugal inertia and gradient color flow.',
    defaultVariables: [
      // Physics
      {
        id: 'kr_flow_speed',
        key: 'speed',
        name: 'Stream Flow Speed',
        category: 'physics',
        type: 'number',
        value: 3.0,
        defaultValue: 3.0,
        min: 0.5,
        max: 8.0,
        step: 0.2,
        isLocked: false,
        description: 'Downstream travel velocity of ribbon streamers',
      },
      {
        id: 'kr_centrifugal',
        key: 'centrifugalForce',
        name: 'Centrifugal Curl',
        category: 'physics',
        type: 'number',
        value: 1.2,
        defaultValue: 1.2,
        min: 0.0,
        max: 3.0,
        step: 0.1,
        isLocked: false,
        description: 'Vorticity pushing ribbons into swirling loops',
      },
      {
        id: 'kr_drag',
        key: 'damping',
        name: 'Fluid Viscosity',
        category: 'physics',
        type: 'number',
        value: 0.92,
        defaultValue: 0.92,
        min: 0.8,
        max: 0.99,
        step: 0.01,
        isLocked: false,
        description: 'Hydrodynamic resistance to rapid steering changes',
      },

      // Function
      {
        id: 'kr_vector_field',
        key: 'fieldAlgorithm',
        name: 'Field Algorithm',
        category: 'function',
        type: 'select',
        value: 'simplex_flow',
        defaultValue: 'simplex_flow',
        options: [
          { label: 'Simplex Fluid Turbulence', value: 'simplex_flow' },
          { label: 'Gravitational Vortex', value: 'vortex' },
          { label: 'Perpendicular Sinusoid', value: 'sinusoid' },
          { label: 'Attractor Sink & Source', value: 'sink_source' },
        ],
        isLocked: false,
        description: 'Equation driving stream angles across space',
      },
      {
        id: 'kr_scale',
        key: 'fieldScale',
        name: 'Field Zoom Scale',
        category: 'function',
        type: 'number',
        value: 0.003,
        defaultValue: 0.003,
        min: 0.001,
        max: 0.01,
        step: 0.0005,
        isLocked: false,
        description: 'Scale of vector swirls across the canvas',
      },

      // Look
      {
        id: 'kr_primary',
        key: 'primaryColor',
        name: 'Leading Ribbon Edge',
        category: 'look',
        type: 'color',
        value: '#f43f5e',
        defaultValue: '#f43f5e',
        isLocked: false,
        description: 'Head tint of the moving stream',
      },
      {
        id: 'kr_secondary',
        key: 'secondaryColor',
        name: 'Trailing Ribbon Wake',
        category: 'look',
        type: 'color',
        value: '#e11d48',
        defaultValue: '#e11d48',
        isLocked: false,
        description: 'Tail tint of ribbon wake',
      },
      {
        id: 'kr_bg_color',
        key: 'bgColor',
        name: 'Background Tone',
        category: 'look',
        type: 'color',
        value: '#130408',
        defaultValue: '#130408',
        isLocked: true,
        description: 'Dark backdrop color',
      },
      {
        id: 'kr_ribbon_width',
        key: 'ribbonWidth',
        name: 'Ribbon Breadth',
        category: 'look',
        type: 'number',
        value: 16,
        defaultValue: 16,
        min: 2,
        max: 45,
        step: 1,
        unit: 'px',
        isLocked: false,
        description: 'Span between outer edge rails of ribbon bands',
      },
      {
        id: 'kr_glow',
        key: 'glowEffect',
        name: 'Luminescent Edge',
        category: 'look',
        type: 'boolean',
        value: true,
        defaultValue: true,
        isLocked: false,
        description: 'Illuminate ribbon contour borders with neon glow',
      },

      // Attributes
      {
        id: 'kr_streamer_count',
        key: 'streamerCount',
        name: 'Active Streamers',
        category: 'attributes',
        type: 'number',
        value: 24,
        defaultValue: 24,
        min: 6,
        max: 75,
        step: 2,
        isLocked: false,
        description: 'Count of concurrent ribbons traversing the canvas',
      },
      {
        id: 'kr_tail_length',
        key: 'historyLength',
        name: 'Ribbon Trail Length',
        category: 'attributes',
        type: 'number',
        value: 40,
        defaultValue: 40,
        min: 15,
        max: 90,
        step: 5,
        unit: 'pts',
        isLocked: false,
        description: 'Memory buffer size per ribbon trajectory',
      },
      {
        id: 'kr_segments',
        key: 'bezierSmoothing',
        name: 'Spline Smoothing',
        category: 'attributes',
        type: 'number',
        value: 8,
        defaultValue: 8,
        min: 3,
        max: 16,
        step: 1,
        isLocked: false,
        description: 'Pts.js Curve Catmull-Rom interpolation subdivision',
      },
    ],
  },

  cosmic_attractor: {
    id: 'cosmic_attractor',
    name: 'Cosmic Gravity Wells',
    description: 'Multi-body celestial gravitational orbiters orbiting multiple moving attractors with relativistic event horizons.',
    defaultVariables: [
      // Physics
      {
        id: 'ca_g_constant',
        key: 'gravitationalG',
        name: 'Gravitational Constant G',
        category: 'physics',
        type: 'number',
        value: 850,
        defaultValue: 850,
        min: 200,
        max: 2500,
        step: 50,
        isLocked: false,
        description: 'Central gravitational pull force of well singularities',
      },
      {
        id: 'ca_friction',
        key: 'damping',
        name: 'Cosmic Friction',
        category: 'physics',
        type: 'number',
        value: 0.992,
        defaultValue: 0.992,
        min: 0.95,
        max: 1.0,
        step: 0.002,
        isLocked: false,
        description: 'Vacuum drag slowing orbital debris over epochs',
      },
      {
        id: 'ca_orbit_kick',
        key: 'orbitalKick',
        name: 'Initial Orbital Velocity',
        category: 'physics',
        type: 'number',
        value: 2.6,
        defaultValue: 2.6,
        min: 0.5,
        max: 6.0,
        step: 0.2,
        isLocked: false,
        description: 'Tangential velocity injecting stable elliptic orbits',
      },

      // Function
      {
        id: 'ca_singularity_mode',
        key: 'attractorMode',
        name: 'Attractor Architecture',
        category: 'function',
        type: 'select',
        value: 'binary',
        defaultValue: 'binary',
        options: [
          { label: 'Binary Core Dance', value: 'binary' },
          { label: 'Single Solar Singularity', value: 'single' },
          { label: 'Troika Chaotic 3-Body', value: 'troika' },
          { label: 'Mouse Singularity Follower', value: 'cursor_well' },
        ],
        isLocked: false,
        description: 'Configuration of central gravitational mass centers',
      },
      {
        id: 'ca_time_warp',
        key: 'timeScale',
        name: 'Time Warp Factor',
        category: 'function',
        type: 'number',
        value: 1.2,
        defaultValue: 1.2,
        min: 0.2,
        max: 3.5,
        step: 0.1,
        isLocked: false,
        description: 'Simulation delta time multiplier',
      },

      // Look
      {
        id: 'ca_core_color',
        key: 'primaryColor',
        name: 'Singularity Core',
        category: 'look',
        type: 'color',
        value: '#fbbf24',
        defaultValue: '#fbbf24',
        isLocked: false,
        description: 'Accretion disk radiant color',
      },
      {
        id: 'ca_particle_color',
        key: 'secondaryColor',
        name: 'Debris Stellar Dust',
        category: 'look',
        type: 'color',
        value: '#60a5fa',
        defaultValue: '#60a5fa',
        isLocked: false,
        description: 'Color of orbiting dust and comets',
      },
      {
        id: 'ca_bg_color',
        key: 'bgColor',
        name: 'Deep Cosmos Void',
        category: 'look',
        type: 'color',
        value: '#04050a',
        defaultValue: '#04050a',
        isLocked: true,
        description: 'Deep black background tone',
      },
      {
        id: 'ca_trail_fade',
        key: 'trailFade',
        name: 'Orbital Path Fade',
        category: 'look',
        type: 'number',
        value: 0.08,
        defaultValue: 0.08,
        min: 0.01,
        max: 0.35,
        step: 0.01,
        isLocked: false,
        description: 'Persistence of long relativistic orbit ellipses',
      },

      // Attributes
      {
        id: 'ca_debris_count',
        key: 'particleCount',
        name: 'Orbiting Debris',
        category: 'attributes',
        type: 'number',
        value: 200,
        defaultValue: 200,
        min: 50,
        max: 600,
        step: 25,
        unit: 'bodies',
        isLocked: false,
        description: 'Number of discrete celestial orbital particles',
      },
      {
        id: 'ca_well_size',
        key: 'coreRadius',
        name: 'Event Horizon Radius',
        category: 'attributes',
        type: 'number',
        value: 18,
        defaultValue: 18,
        min: 6,
        max: 50,
        step: 2,
        unit: 'px',
        isLocked: false,
        description: 'Visual diameter of the gravitational core sink',
      },
      {
        id: 'ca_ring_spokes',
        key: 'showGravRings',
        name: 'Equipotential Gravity Rings',
        category: 'attributes',
        type: 'boolean',
        value: true,
        defaultValue: true,
        isLocked: false,
        description: 'Render concentric harmonic gravitational field contours',
      },
    ],
  },
};

/**
 * Randomize a single dynamic variable value according to its type, min, max, options,
 * and the chosen randomization intensity.
 */
export function randomizeSingleValue(
  variable: DynamicVariable,
  intensity: RandomizeIntensity = 'wild'
): number | string | boolean {
  if (variable.type === 'number') {
    const min = variable.min ?? 0;
    const max = variable.max ?? 100;
    const step = variable.step ?? 1;
    const current = typeof variable.value === 'number' ? variable.value : (variable.defaultValue as number);
    const range = max - min;

    let targetValue: number;

    if (intensity === 'gentle') {
      // Gentle: nudge ±15-20% of range from current value
      const delta = (Math.random() * 2 - 1) * 0.2 * range;
      targetValue = Math.min(max, Math.max(min, current + delta));
    } else if (intensity === 'balanced') {
      // Balanced: interpolate between current and random point or ±45%
      const delta = (Math.random() * 2 - 1) * 0.5 * range;
      targetValue = Math.min(max, Math.max(min, current + delta));
    } else {
      // Wild: full uniform random over entire range
      targetValue = min + Math.random() * range;
    }

    // Snap to step precision
    if (step > 0) {
      const inverse = 1 / step;
      targetValue = Math.round(targetValue * inverse) / inverse;
      // Round to prevent floating point inaccuracies
      const decimals = step.toString().split('.')[1]?.length || 0;
      targetValue = Number(targetValue.toFixed(decimals));
    }

    return targetValue;
  }

  if (variable.type === 'color') {
    // Pick from curated harmonic palettes or generate aesthetic vibrant hex
    const palette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
    if (variable.key === 'bgColor') {
      // If background color is unlocked, keep it dark/subtle
      const darkOptions = ['#08090d', '#05070f', '#0a050d', '#05110d', '#110609', '#0d0e15'];
      return darkOptions[Math.floor(Math.random() * darkOptions.length)];
    }
    // For primary/secondary colors
    const vibrantColors = palette.colors.slice(0, 4);
    return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
  }

  if (variable.type === 'select') {
    if (variable.options && variable.options.length > 0) {
      const randomIndex = Math.floor(Math.random() * variable.options.length);
      return variable.options[randomIndex].value;
    }
    return variable.value;
  }

  if (variable.type === 'boolean') {
    return Math.random() > 0.5;
  }

  return variable.value;
}

/**
 * Randomize dynamic variables, strictly preserving any variable marked as isLocked = true.
 */
export function randomizeVariables(
  variables: DynamicVariable[],
  intensity: RandomizeIntensity = 'wild',
  filterCategory?: ParameterCategory
): { updated: DynamicVariable[]; changedCount: number } {
  let changedCount = 0;

  const updated = variables.map((v) => {
    // If locked, NEVER change!
    if (v.isLocked) {
      return v;
    }

    // If category filter provided, only randomize that category
    if (filterCategory && v.category !== filterCategory) {
      return v;
    }

    const newValue = randomizeSingleValue(v, intensity);
    changedCount++;
    return {
      ...v,
      value: newValue,
    };
  });

  return { updated, changedCount };
}

/**
 * Helper to convert array of dynamic variables to a key-value record for the renderer
 */
export function variablesToMap(variables: DynamicVariable[]): Record<string, any> {
  const map: Record<string, any> = {};
  for (const v of variables) {
    map[v.key] = v.value;
  }
  return map;
}

/**
 * Default sample favorites to preload so user immediately sees rich examples
 */
export const DEFAULT_PRESET_FAVORITES = [
  {
    id: 'fav-cyber-drift',
    name: 'Cyberpunk Vector Drift',
    createdAt: Date.now() - 3600000 * 24,
    engine: 'particle_swarm' as EngineType,
    previewPalette: ['#00f0ff', '#ff0077', '#08090d'],
    tags: ['Neon', 'Kinetic', 'Fast'],
    notes: 'High velocity curl vectors with maximum spring recoil',
  },
  {
    id: 'fav-harmonic-chords',
    name: 'Sine Fourier Chords',
    createdAt: Date.now() - 3600000 * 12,
    engine: 'harmonic_mesh' as EngineType,
    previewPalette: ['#38bdf8', '#a855f7', '#080b12'],
    tags: ['Waves', 'Lattice', 'Symmetric'],
    notes: 'Interleaved 24-strand Fourier resonance',
  },
  {
    id: 'fav-emerald-crystal',
    name: 'Emerald Delaunay Shards',
    createdAt: Date.now() - 3600000 * 4,
    engine: 'geometric_delaunay' as EngineType,
    previewPalette: ['#10b981', '#064e3b', '#05110d'],
    tags: ['Geometry', 'Voronoi', 'Reactive'],
    notes: 'Elastic interactive mesh with circumcircle ghosting',
  },
];

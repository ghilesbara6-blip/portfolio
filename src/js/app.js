// ===================== APP BOOTSTRAP =====================
document.addEventListener('DOMContentLoaded', () => {

  // ---------- SmoothCursor ----------
  initSmoothCursor();

  // ---------- Noise overlay ----------
  initNoise(document.getElementById('noise-canvas'), { patternRefreshInterval: 2, patternAlpha: 10 });

  // ---------- Hero Strands background ----------
  initStrands(document.getElementById('hero-strands'), {
    colors: ['#045992', '#7C3AED', '#06B6D4'],
    count: 4,
    speed: 0.35,
    amplitude: 1.1,
    waviness: 1.1,
    thickness: 0.6,
    glow: 2.4,
    taper: 2.6,
    spread: 1.1,
    intensity: 0.55,
    saturation: 1.4,
    opacity: 0.9,
    scale: 1.6
  });

  // ---------- Hero SideRays ----------
  initSideRays(document.getElementById('hero-rays'), {
    speed:      2.5,
    rayColor1:  '#7C3AED',
    rayColor2:  '#06B6D4',
    intensity:  2,
    spread:     2.8,
    origin:     'top-right',
    tilt:       0,
    saturation: 1.5,
    blend:      0.75,
    falloff:    1.6,
    opacity:    0.85,
  });

  // ---------- Hero name — Text3DFlip ----------
  initText3DFlip(document.getElementById('flip-bara'), {
    text: 'Bara',
    rotateDirection: 'top',
    staggerFrom: 'first',
    staggerDuration: 0.06
  });
  initText3DFlip(document.getElementById('flip-ghiles'), {
    text: 'Ghiles',
    rotateDirection: 'top',
    staggerFrom: 'first',
    staggerDuration: 0.06
  });

  // ---------- Hero role — MorphingText ----------
  initMorphingText(document.getElementById('hero-morph'), [
    'Web Developer',
    'Cross-Platform Dev',
    'Reverse Engineer',
    'Systems Programmer',
    'Offensive Security',
    'Local AI Researcher'
  ]);

  // ---------- BubbleMenu ----------
  document.getElementById('bubble-menu')._overlay = document.getElementById('bubble-menu-overlay');
  initBubbleMenu(
    document.getElementById('bubble-menu'),
    [
      { label: 'about', href: '#about', rotation: -6, hoverStyles: { bgColor: '#7C3AED', textColor: '#fff' } },
      { label: 'work', href: '#work', rotation: 6, hoverStyles: { bgColor: '#06B6D4', textColor: '#fff' } },
      { label: 'gallery', href: '#gallery', rotation: -6, hoverStyles: { bgColor: '#EAB308', textColor: '#111' } },
      { label: 'showcase', href: '#showcase', rotation: 6, hoverStyles: { bgColor: '#FF4242', textColor: '#fff' } },
      { label: 'lab', href: '#lab', rotation: -6, hoverStyles: { bgColor: '#7C3AED', textColor: '#fff' } },
      { label: 'contact', href: '#contact', rotation: 6, hoverStyles: { bgColor: '#06B6D4', textColor: '#fff' } }
    ]
  );

  // ---------- Counters (About stats) ----------
  initCounter(document.getElementById('counter-years'), 3, { fontSize: 52, textColor: '#f0eee8', fontWeight: 700, places: [1] });
  initCounter(document.getElementById('counter-projects'), 20, { fontSize: 52, textColor: '#f0eee8', fontWeight: 700, places: [10, 1] });
  initCounter(document.getElementById('counter-stack'), 15, { fontSize: 52, textColor: '#f0eee8', fontWeight: 700, places: [10, 1] });

  // ---------- BorderGlow (About card) ----------
  initBorderGlow(document.getElementById('about-glow-card'), {
    glowColor: '262 83% 68%',
    backgroundColor: '#15131d',
    borderRadius: 24,
    colors: ['#7C3AED', '#06B6D4', '#FF4242']
  });

  // ---------- MagicBento (Work grid) ----------
  initMagicBento(document.getElementById('bento-grid'), [
    { label: 'Web App', title: 'Cross-Platform Dev', description: 'Flutter + Dart apps that run everywhere — mobile, desktop, and web — from a single codebase.' },
    { label: 'Systems', title: 'Reverse Engineering', description: 'Binary analysis, disassembly, and understanding how software works at the instruction level.' },
    { label: 'Security', title: 'Offensive Cybersecurity', description: 'Penetration testing mindset baked into every layer — because knowing how to break it means building it right.' },
    { label: 'Research', title: 'Local AI Models', description: 'Exploring local inference, fine-tuning, and building AI systems that run entirely on-device, no cloud required.' },
    { label: 'Platform', title: 'OS Development', description: 'Low-level C and C++ — bootloaders, kernel modules, and systems that live close to the metal.' },
    { label: 'Terminal', title: 'CLI & Automation', description: 'PowerShell, CMD, and Bash. The terminal is where the work actually happens — scripts, pipelines, and discipline.' }
  ], { glowColor: '124, 58, 237', particleCount: 6, spotlightRadius: 260 });

  // ---------- CircularGallery ----------
  initCircularGallery(document.getElementById('circular-gallery'), {
    bend: 3,
    textColor: '#f0eee8',
    borderRadius: 0.06,
    font: '600 22px Space Grotesk, sans-serif',
    items: [
      { image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=80&auto=format&fit=crop', text: 'Web Development' },
      { image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80&auto=format&fit=crop', text: 'Systems & C/C++' },
      { image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=80&auto=format&fit=crop', text: 'Reverse Engineering' },
      { image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=900&q=80&auto=format&fit=crop', text: 'Cybersecurity' },
      { image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=900&q=80&auto=format&fit=crop', text: 'Flutter / Mobile' },
      { image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900&q=80&auto=format&fit=crop', text: 'Local AI Research' }
    ]
  });

  // ---------- CardSwap ----------
  initCardSwap(document.getElementById('card-swap'), [
    { tag: 'Systems', title: 'C / C++ / Rust', desc: 'Low-level programming — OS modules, memory management, and code that lives close to the hardware.' },
    { tag: 'Mobile', title: 'Flutter / Dart', desc: 'Cross-platform apps with a single codebase — native performance on Android, iOS, desktop, and web.' },
    { tag: 'Web', title: 'React / JS / Python', desc: 'Frontend interfaces and backend scripts — fast, interactive, and built to last.' },
    { tag: 'Security', title: 'Offensive Mindset', desc: 'Reverse engineering and pentesting background — building software with an attacker\'s eye.' }
  ], { width: 340, height: 230, cardDistance: 46, verticalDistance: 50, delay: 4200 });

  // ---------- TiltedCard ----------
  initTiltedCard(document.getElementById('tilted-card'), {
    imageSrc: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&q=80&auto=format&fit=crop',
    altText: 'Code on a screen',
    captionText: 'PharmaciN — backend core',
    containerHeight: '320px',
    containerWidth: '100%',
    imageHeight: '320px',
    imageWidth: '320px',
    rotateAmplitude: 10,
    scaleOnHover: 1.05,
    displayOverlayContent: true,
    overlayHtml: '<p>C · Rust · Flutter · Python</p>'
  });

  // ---------- ShapeBlur ----------
  initShapeBlur(document.getElementById('shapeblur-card'), {
    variation: 1,
    shapeSize: 0.55,
    roundness: 0.5,
    borderSize: 0.04,
    circleSize: 0.42,
    circleEdge: 0.6
  });

  // ---------- ImageTrail ----------
  initImageTrail(document.getElementById('image-trail'), [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=70&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&q=70&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&q=70&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=70&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=70&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=70&auto=format&fit=crop'
  ]);

  // ---------- ColorBends (Lab) ----------
  initColorBends(document.getElementById('colorbends'), {
    colors: ['#7C3AED', '#06B6D4', '#FF4242'],
    rotation: 90,
    autoRotate: 5,
    speed: 0.22,
    scale: 1,
    frequency: 1,
    warpStrength: 1,
    mouseInfluence: 1.1,
    parallax: 0.5,
    noise: 0.12,
    iterations: 2,
    intensity: 1.4,
    bandWidth: 6
  });

  // ---------- GooeyNav (Lab) ----------
  initGooeyNav(document.getElementById('gooey-nav'), [
    { label: 'C / C++', href: '#' },
    { label: 'Rust', href: '#' },
    { label: 'Flutter', href: '#' },
    { label: 'SQL Srv', href: '#' },
    { label: 'Access', href: '#' }
  ], { particleCount: 12, animationTime: 500, timeVariance: 250 });

  // ---------- IconCloud (Lab) ----------
  initIconCloud(document.getElementById('icon-cloud'), {
    size: 380,
    images: [
      'https://cdn.simpleicons.org/c/f0eee8',
      'https://cdn.simpleicons.org/cplusplus/659AD2',
      'https://cdn.simpleicons.org/rust/f0eee8',
      'https://cdn.simpleicons.org/python/3776AB',
      'https://cdn.simpleicons.org/dart/0175C2',
      'https://cdn.simpleicons.org/flutter/02569B',
      'https://cdn.simpleicons.org/react/61DAFB',
      'https://cdn.simpleicons.org/javascript/F7DF1E',
      'https://cdn.simpleicons.org/html5/E34F26',
      'https://cdn.simpleicons.org/css3/1572B6',
      'https://cdn.simpleicons.org/gnubash/4EAA25',
      'https://cdn.simpleicons.org/powershell/5391FE',
      'https://cdn.simpleicons.org/linux/f0eee8',
      'https://cdn.simpleicons.org/git/F05032',
      'https://cdn.simpleicons.org/docker/2496ED',
      'https://cdn.simpleicons.org/microsoftsqlserver/CC2927',
      'https://cdn.simpleicons.org/microsoftaccess/A4373A',
      'https://cdn.simpleicons.org/ollama/f0eee8',
      'https://cdn.simpleicons.org/wireshark/1679A7',
      'https://cdn.simpleicons.org/visualstudiocode/007ACC'
    ],
    labels: ['C','C++','Rust','Python','Dart','Flutter','React','JS','HTML','CSS','Bash','PowerShell','Linux','Git','Docker','SQL Server','MS Access','Ollama','Wireshark','VS Code']
  });

  // ---------- Scroll reveal ----------
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));

  // ---------- Contact CTA ----------
  const ctaBtn = document.getElementById('contact-cta');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      window.location.href = 'mailto:hello@baraghiles.dev';
    });
  }

  // ---------- Testimonials ----------
  initTestimonials(document.getElementById('testimonials-stage'), [
    {
      text: "Bara dug into our codebase like he wrote it himself. He spotted a vulnerability we'd missed for months, explained exactly how it could be exploited, and patched it the same day. That's a rare combination.",
      name: "Yacine Aït Amar",
      role: "CTO, SecureNet DZ",
      stars: 5
    },
    {
      text: "He built our Flutter app across Android and web from scratch. Clean architecture, zero dependencies we didn't need, and the thing actually ran fast. Refreshing to work with someone who thinks before they type.",
      name: "Lina Boudaoud",
      role: "Product Lead, Tiziapp",
      stars: 5
    },
    {
      text: "What got me was his research pace. He showed up not knowing a library we needed, and by the next day he'd read the source, understood the internals, and had a working implementation. Motivated doesn't cover it.",
      name: "Mehdi Ouali",
      role: "Senior Engineer, DeepTech Béjaïa",
      stars: 5
    },
    {
      text: "Bara reversed a closed binary for us when we couldn't find documentation anywhere. He found the protocol, wrote us a clean parser in Python, and documented everything. Honestly impressive.",
      name: "Raouf Meziane",
      role: "R&D Director, EmbeddedALG",
      stars: 5
    },
    {
      text: "He's the kind of developer who reads the error, not just Googles it. We had a memory corruption bug in a C module that had stumped the team for a week. Bara found it in an afternoon.",
      name: "Samir Khelif",
      role: "Systems Lead, OpenKernel Labs",
      stars: 5
    }
  ]);

  // ---------- SpotlightCards (Lab — stack grid) ----------
  initSpotlightCards(document.getElementById('spotlight-cards'), [
    {
      title: 'C / C++',
      description: 'Systems programming, OS-level code, and anything that needs to run fast and close to the hardware.',
      color: '#7C3AED',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>'
    },
    {
      title: 'Rust',
      description: 'Memory-safe systems code — for building tools, CLIs, and backends where correctness is non-negotiable.',
      color: '#06B6D4',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/><path d="m4.93 4.93 1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>'
    },
    {
      title: 'Flutter / Dart',
      description: 'Cross-platform apps from a single codebase — native feel on mobile, desktop, and web.',
      color: '#FF4242',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 20 2 20"/><line x1="12" y1="9" x2="12" y2="15"/></svg>'
    },
    {
      title: 'Python',
      description: 'Scripting, automation, data pipelines, and the go-to language for AI/ML experimentation and local model work.',
      color: '#EAB308',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 6 4 6 7v2h6v1H4s-2 .5-2 5 2 5 2 5h3v-2.5S7 16 9 16h6c2 0 3-1.5 3-3V9c0-2-1-7-6-7z"/><path d="M12 22c4 0 6-2 6-5v-2h-6v-1h8s2-.5 2-5-2-5-2-5h-3v2.5S17 8 15 8H9C7 8 6 9.5 6 11v4c0 2 1 7 6 7z"/></svg>'
    },
    {
      title: 'SQL Server',
      description: 'Relational database design, complex queries, stored procedures, and production-grade data modelling.',
      color: '#CC2927',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>'
    },
    {
      title: 'MS Access',
      description: 'Rapid database applications, forms, and reports — desktop data management built fast and reliably.',
      color: '#A4373A',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17l3-10 3 10"/><path d="M10.5 13h3"/></svg>'
    },
    {
      title: 'Reverse Engineering',
      description: 'Binary analysis, disassembly, and figuring out how software works when the source code isn\'t available.',
      color: '#38bdf8',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>'
    },
    {
      title: 'Local AI Models',
      description: 'Running, fine-tuning, and building inference pipelines that live on-device. No cloud dependency, no latency.',
      color: '#a78bfa',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="19" cy="5" r="3"/></svg>'
    }
  ]);

  // ---------- SiteSearchBar (always-visible, top of page) ----------
  initSiteSearchBar(document.getElementById('site-search'), [
    {
      id: 'nav-about', label: 'About', description: 'Background and stats', end: 'Section', color: '#7C3AED',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path></svg>',
      onSelect: () => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: 'nav-work', label: 'Work', description: 'Systems shipped', end: 'Section', color: '#06B6D4',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
      onSelect: () => document.getElementById('work').scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: 'nav-gallery', label: 'Process', description: 'Schema to screen', end: 'Section', color: '#EAB308',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path></svg>',
      onSelect: () => document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: 'nav-showcase', label: 'Showcase', description: 'A closer look at the stack', end: 'Section', color: '#FF4242',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      onSelect: () => document.getElementById('showcase').scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: 'nav-lab', label: 'Lab', description: 'The stack, in motion', end: 'Section', color: '#7C3AED',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6.5L4.5 17a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L15 8.5V2"></path><line x1="9" y1="2" x2="15" y2="2"></line></svg>',
      onSelect: () => document.getElementById('lab').scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: 'nav-testimonials', label: 'Testimonials', description: 'What collaborators say', end: 'Section', color: '#06B6D4',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20l1.1-5.6A8.5 8.5 0 1 1 21 11.5z"></path></svg>',
      onSelect: () => document.getElementById('testimonials').scrollIntoView({ behavior: 'smooth' })
    },
    {
      id: 'action-email', label: 'Email Bara', description: 'ghilesbara6@gmail.com', short: '⌘E', end: 'Contact', color: '#EA4335',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M22 6 12 13 2 6"></path></svg>',
      onSelect: () => { window.location.href = 'mailto:ghilesbara6@gmail.com'; }
    },
    {
      id: 'action-top', label: 'Back to top', description: 'Jump to the hero', end: 'Action', color: '#a8a4b8',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>',
      onSelect: () => document.getElementById('hero').scrollIntoView({ behavior: 'smooth' })
    }
  ]);

  // ---------- FallingText (Hero physics text) ----------
  initFallingText(
    document.getElementById('falling-text-wrap'),
    document.getElementById('falling-text-target'),
    document.getElementById('falling-text-canvas'),
    document.getElementById('ft-hint'),
    {
      text: 'Reverse engineering · OS development · Cybersecurity · Local AI · Flutter · Rust · C · Web · Mobile · Systems · Béjaïa · Algeria',
      highlightWords: ['Reverse', 'OS', 'Cybersecurity', 'Local', 'Flutter', 'Rust', 'Web', 'Mobile', 'Systems'],
      highlightClass: 'highlighted',
      trigger: 'hover',
      gravity: 0.56,
      mouseConstraintStiffness: 0.9,
      fontSize: 'clamp(0.78rem, 1.3vw, 1rem)'
    }
  );
  // Mark wrap as active for CSS pointer-events once hovered
  document.getElementById('falling-text-wrap').addEventListener('mouseenter', function onFirst() {
    this.classList.add('ft-active');
    this.removeEventListener('mouseenter', onFirst);
  });
  document.getElementById('falling-text-wrap').addEventListener('touchstart', function onFirstT() {
    this.classList.add('ft-active');
    this.removeEventListener('touchstart', onFirstT);
  }, { passive: true });

  // ---------- SoftAurora (Footer background) ----------
  initSoftAurora(document.getElementById('footer-aurora'), {
    speed:                 0.7,
    scale:                 1.5,
    brightness:            1.0,
    color1:                '#7C3AED',
    color2:                '#06B6D4',
    noiseFrequency:        6,
    noiseAmplitude:        1.0,
    bandHeight:            0.5,
    bandSpread:            0.7,
    octaveDecay:           0.1,
    layerOffset:           0,
    colorSpeed:            0.8,
    enableMouseInteraction: true,
    mouseInfluence:        0.25,
  });

  // ---------- DockNavbar (footer) ----------
  initDockNavbar(document.getElementById('dock-navbar'), [
    { label: 'Search (⌘K)', icon: 'https://cdn.simpleicons.org/searxng/f0eee8', onClick: () => window.focusSiteSearch() },
    { label: 'About', icon: 'https://cdn.simpleicons.org/aboutdotme/f0eee8', href: '#about' },
    { label: 'Work', icon: 'https://cdn.simpleicons.org/briefcase/f0eee8', href: '#work' },
    { label: 'Lab', icon: 'https://cdn.simpleicons.org/flask/f0eee8', href: '#lab' },
    { label: 'GitHub', icon: 'https://cdn.simpleicons.org/github/f0eee8', href: 'https://github.com' },
    { label: 'Email', icon: 'https://cdn.simpleicons.org/gmail/EA4335', href: 'mailto:ghilesbara6@gmail.com' }
  ]);
});

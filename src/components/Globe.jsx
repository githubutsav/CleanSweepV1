import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';

export default function GlobeComponent({ className = "w-full h-full min-h-[400px] md:min-h-[500px] cursor-grab active:cursor-grabbing" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof Globe === 'undefined') return;

    // Clear any existing children before initializing to prevent duplicates
    root.innerHTML = '';

    const globe = Globe()
      .backgroundColor('rgba(0,0,0,0)')
      .pointColor((d) => 'rgba(58, 255, 134, ' + (d.opacity ?? 1) + ')')
      .pointRadius((d) => d.r)
      .pointAltitude((d) => d.altitude)
      .htmlElementsData([])
      .htmlLat((d) => d.lat)
      .htmlLng((d) => d.lng)
      .htmlAltitude((d) => {
        const a = (d.altitude ?? d.maxAltitude ?? 0) * 0.002 + 0.06;
        return Math.min(0.35, Math.max(0.06, a));
      })
      .htmlElement((d) => d.htmlEl || makeHtmlLabel(d))
      .pointsMerge(false)
      .pointOfView({ altitude: 2.3, lat: 20, lng: -20 }, 0)
      .pointsData([])
      (root);

    const renderer = globe.renderer();
    if (renderer && typeof renderer.setClearColor === 'function') {
      renderer.setClearColor(0x000000, 0);
    }

    const material = globe.globeMaterial();
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let lineColor = 'rgba(8, 14, 24, 0.98)';

    function resolveDarkMode() {
      const doc = document.documentElement;
      const body = document.body;
      const classDark = (doc && doc.classList.contains('dark')) || (body && body.classList.contains('dark'));
      return classDark || darkQuery.matches;
    }

    function applyThemeToGlobe() {
      const isDark = resolveDarkMode();
      globe.backgroundColor('rgba(0,0,0,0)');
      material.transparent = true;
      if (isDark) {
        material.color.set('#173d2a');
        material.emissive.set('#0a1f15');
        material.emissiveIntensity = 0.12;
        material.shininess = 0.18;
        material.opacity = 0.42;
        globe.atmosphereColor('#3AFF86');
        globe.atmosphereAltitude(0.07);
        lineColor = 'rgba(58, 255, 134, 0.8)';
      } else {
        material.color.set('#eceef0');
        material.emissive.set('#d4d8dd');
        material.emissiveIntensity = 0.03;
        material.shininess = 0.02;
        material.opacity = 0.3;
        globe.atmosphereColor('#dfe3e8');
        globe.atmosphereAltitude(0.03);
        lineColor = 'rgba(8, 14, 24, 0.98)';
      }
      
      globe
        .polygonCapColor(() => 'rgba(0, 0, 0, 0)')
        .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
        .polygonStrokeColor(() => lineColor)
        .polygonAltitude(0.006);
    }
    
    applyThemeToGlobe();
    darkQuery.addEventListener('change', applyThemeToGlobe);
    const themeObserver = new MutationObserver(applyThemeToGlobe);
    if (document.documentElement) {
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    }
    if (document.body) {
      themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    }

    let isMounted = true;
    fetch('https://cdn.jsdelivr.net/gh/vasturiano/three-globe@master/example/country-polygons/ne_110m_admin_0_countries.geojson')
      .then((res) => res.json())
      .then((countries) => {
        if (!isMounted) return;
        if (countries && Array.isArray(countries.features)) {
          globe.polygonsData(countries.features);
        }
      })
      .catch(() => {});

    function fitGlobe() {
      if (!root) return;
      const rect = root.getBoundingClientRect();
      globe.width(Math.max(240, rect.width));
      globe.height(Math.max(240, rect.height));
    }

    fitGlobe();
    window.addEventListener('resize', fitGlobe, { passive: true });

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.28;
    controls.enableRotate = true;
    controls.enableZoom = false;
    controls.enablePan = false;

    const pointGrowMs = 200;
    const pointHoldMs = 2000;
    const pointFadeMs = 5000;
    const pointRadius = 0.12;
    const activePoints = [];
    let lastSeen = 0;
    let pullInFlight = false;

    function shortAgentId(value) {
      if (!value && value !== 0) return 'agent-????';
      const str = String(value);
      const marker = 'agent-';
      const idx = str.indexOf(marker);
      if (idx !== -1) {
        const after = str.slice(idx + marker.length);
        return 'agent-' + after.slice(0, 4).padEnd(4, '?');
      }
      return 'agent-' + str.slice(0, 4).padEnd(4, '?');
    }

    function shortKid(value) {
      if (!value && value !== 0) return 'kid:????';
      const str = String(value);
      return 'kid:' + str.slice(0, 4).padEnd(4, '?');
    }

    function formatMeta(d) {
      const lat = d.lat != null ? d.lat.toFixed(2) : '--';
      const lng = d.lng != null ? d.lng.toFixed(2) : '--';
      const ts = d.ts
        ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
        : '--';
      return 'loc ' + lat + ',' + lng + ' · ' + ts;
    }

    function makeHtmlLabel(d) {
      const rootEl = document.createElement('div');
      rootEl.className = 'geo-label';
      rootEl.style.opacity = String(d.opacity ?? 1);

      const title = document.createElement('div');
      title.className = 'geo-label__title';
      title.textContent = 'id: ' + (d.id ?? '??');

      const agent = document.createElement('div');
      agent.className = 'geo-label__agent';
      agent.textContent = d.label || 'agent-????';

      const kid = document.createElement('div');
      kid.className = 'geo-label__kid';
      kid.textContent = d.kidShort || 'kid:????';

      const meta = document.createElement('div');
      meta.className = 'geo-label__meta';
      meta.textContent = formatMeta(d);

      rootEl.appendChild(title);
      rootEl.appendChild(agent);
      rootEl.appendChild(kid);
      rootEl.appendChild(meta);

      d.htmlEl = rootEl;
      return rootEl;
    }

    async function pullGeos() {
      if (pullInFlight || !isMounted) return;
      pullInFlight = true;
      try {
        const res = await fetch('https://geo.vestauth.com/geos?since=' + encodeURIComponent(lastSeen));
        if (!res.ok) return;
        const batch = await res.json();
        if (!Array.isArray(batch) || batch.length === 0) return;

        let maxSeen = lastSeen;
        for (let i = 0; i < batch.length; i += 1) {
          const geo = batch[i];
          if (typeof geo.ts === 'number' && geo.ts > maxSeen) maxSeen = geo.ts;
          if (typeof geo.id === 'number' && geo.id > maxSeen) maxSeen = geo.id;
          activePoints.push({
            lat: geo.lat,
            lng: geo.lng,
            altitude: 0,
            maxAltitude: geo.altitude ?? 90,
            r: pointRadius,
            opacity: 1,
            born: performance.now(),
            grown: false,
            label: shortAgentId(geo.agent_id),
            kidShort: shortKid(geo.agent_kid),
            id: geo.id,
            ts: geo.ts,
            htmlEl: null
          });
        }
        lastSeen = maxSeen;
      } catch (_) {
      } finally {
        pullInFlight = false;
      }
    }

    let animFrameId;
    function animatePoints() {
      if (!isMounted) return;
      const now = performance.now();
      let changed = false;
      for (let i = 0; i < activePoints.length; i += 1) {
        const p = activePoints[i];
        const age = now - p.born;
        const lifeMs = pointGrowMs + pointHoldMs + pointFadeMs;
        if (age >= lifeMs) {
          activePoints.splice(i, 1);
          i -= 1;
          changed = true;
          continue;
        }

        if (age <= pointGrowMs) {
          const growT = Math.min(1, age / pointGrowMs);
          const nextAltitude = p.maxAltitude * growT;
          if (nextAltitude !== p.altitude) {
            p.altitude = nextAltitude;
            changed = true;
          }
        } else if (!p.grown) {
          p.altitude = p.maxAltitude;
          p.grown = true;
          changed = true;
        }

        const fadeStart = pointGrowMs + pointHoldMs;
        if (age >= fadeStart) {
          const fadeT = Math.min(1, (age - fadeStart) / pointFadeMs);
          const nextOpacity = Math.max(0, 1 - fadeT);
          const nextAltitude = Math.max(0, p.maxAltitude * (1 - fadeT));
          if (nextOpacity !== p.opacity) {
            p.opacity = nextOpacity;
            changed = true;
          }
          if (nextAltitude !== p.altitude) {
            p.altitude = nextAltitude;
            changed = true;
          }
        }
      }

      if (changed) {
        const next = activePoints.slice();
        globe.pointsData(next);
        globe.htmlElementsData(next);
      }

      for (let i = 0; i < activePoints.length; i += 1) {
        const p = activePoints[i];
        if (p.htmlEl) p.htmlEl.style.opacity = String(p.opacity ?? 1);
      }
      animFrameId = requestAnimationFrame(animatePoints);
    }

    pullGeos();
    const intervalId = setInterval(pullGeos, 1000);
    animatePoints();

    return () => {
      isMounted = false;
      window.removeEventListener('resize', fitGlobe);
      darkQuery.removeEventListener('change', applyThemeToGlobe);
      themeObserver.disconnect();
      clearInterval(intervalId);
      cancelAnimationFrame(animFrameId);
      if (root) {
        root.innerHTML = '';
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}

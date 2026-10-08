/* ==========================================================================
   NEXUS — Three.js 3D Hero Centerpiece & GSAP ScrollTrigger Integration
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('hero-3d-canvas');
    if (!canvas) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    
    const container = canvas.parentElement;
    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // Load the supplied animated character instead of generating a placeholder mesh.
    const mainMesh = new THREE.Group();
    scene.add(mainMesh);
    let mixer = null;
    const modelUrl = canvas.dataset.modelUrl;
    if (typeof THREE.FBXLoader !== 'undefined' && modelUrl) {
        const loader = new THREE.FBXLoader();
        loader.load(modelUrl, (model) => {
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.frustumCulled = false;
                }
            });
            const bounds = new THREE.Box3().setFromObject(model);
            const size = bounds.getSize(new THREE.Vector3());
            const center = bounds.getCenter(new THREE.Vector3());
            const scale = 3.4 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.set(-center.x * scale, -center.y * scale - 0.35, -center.z * scale);
            mainMesh.add(model);
            if (model.animations && model.animations.length) {
                mixer = new THREE.AnimationMixer(model);
                mixer.clipAction(model.animations[0]).play();
            }
        }, undefined, (error) => {
            console.warn('Unable to load hero FBX model.', error);
        });
    }

    // Outer Orbit Ring
    const ringGeo = new THREE.TorusGeometry(2.6, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.35
    });
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.rotation.x = Math.PI / 3;
    scene.add(orbitRing);

    // 3. 3-Point Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x2563eb, 2.2);
    keyLight.position.set(5, 5, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7c3aed, 1.6);
    fillLight.position.set(-5, -3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 2.0, 10);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // 4. Mouse Parallax Dampening
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        const halfX = window.innerWidth / 2;
        const halfY = window.innerHeight / 2;
        mouseX = (e.clientX - halfX) / halfX;
        mouseY = (e.clientY - halfY) / halfY;
    });

    // 5. GSAP ScrollTrigger Integration
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        gsap.to(mainMesh.rotation, {
            y: Math.PI * 2,
            x: Math.PI * 0.5,
            ease: "none",
            scrollTrigger: {
                trigger: container,
                start: "top top",
                end: "bottom top",
                scrub: 1.2
            }
        });

        gsap.to(mainMesh.position, {
            y: -1.5,
            z: -1,
            ease: "none",
            scrollTrigger: {
                trigger: container,
                start: "top top",
                end: "bottom top",
                scrub: 1.2
            }
        });
    }

    // 6. Responsive Resize Listener
    window.addEventListener('resize', () => {
        width = container.clientWidth || 500;
        height = container.clientHeight || 500;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    const clock = new THREE.Clock();

    // 7. IntersectionObserver RAF Loop Pause for Performance
    let isRendering = true;
    let animFrameId = null;

    function renderLoop() {
        if (!isRendering) return;

        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);

        // Dampened mouse tilt
        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        mainMesh.rotation.y += 0.004;
        mainMesh.rotation.x += 0.002;

        orbitRing.rotation.z += 0.003;

        // Apply mouse tilt to container
        scene.rotation.y = targetX * 0.35;
        scene.rotation.x = -targetY * 0.35;

        renderer.render(scene, camera);
        animFrameId = requestAnimationFrame(renderLoop);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!isRendering) {
                    isRendering = true;
                    renderLoop();
                }
            } else {
                isRendering = false;
                if (animFrameId) cancelAnimationFrame(animFrameId);
            }
        });
    }, { threshold: 0.1 });

    observer.observe(canvas);
    renderLoop();
});

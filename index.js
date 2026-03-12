import * as THREE from "three";
import { GLTFLoader } from "jsm/loaders/GLTFLoader.js";

// Global variables
let mesh;
let mixer;
const clock = new THREE.Clock();
let isFinished = false;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10
);
camera.position.z = 3;

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x404040);

// Capsule
const gltfLoader = new GLTFLoader();
gltfLoader.load("./assets/Capsule.glb", (gltf) => {
  const capsule = gltf.scene;
  capsule.scale.set(1.75, 1.75, 1.75);
  capsule.position.y = 0;
  scene.add(capsule);

  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(capsule);
    const action = mixer.clipAction(gltf.animations[0]);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();

    mixer.addEventListener("finished", () => {
    scene.remove(capsule);
    isFinished = true;});
    
}});

// Mesh Options
const models = [
  "./assets/bird.glb",
  "./assets/CowboyCat.glb",
  "./assets/Ganglios.glb",
  "./assets/lowpolypatrick.glb"
];


// Mesh
const selectedMesh = models[Math.floor(Math.random() * models.length)];

gltfLoader.load(selectedMesh, (gltf) => {
  mesh = gltf.scene;

  mesh.traverse((child) => {
    if (child.isMesh) {
      child.geometry.center();
      child.geometry.computeVertexNormals();

      // --- Outline Shader Material ---
      const outlineMat = new THREE.ShaderMaterial({
        uniforms: {
          thickness: { value: 0.01 } // outline thickness
        },
        vertexShader: `
          uniform float thickness;

          void main() {
            vec3 newPosition = position + normal * thickness;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragmentShader: `
          void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          }
        `,
        side: THREE.BackSide
      });

      // --- Outline Mesh ---
      const outlineMesh = new THREE.Mesh(child.geometry, outlineMat);

      // Copy transforms so it matches the original mesh perfectly
      outlineMesh.position.copy(child.position);
      outlineMesh.rotation.copy(child.rotation);
      outlineMesh.scale.copy(child.scale);

      // Add outline beside the mesh (same parent)
      child.parent.add(outlineMesh);
    }
  });

  mesh.scale.set(2, 2, 2);
  scene.add(mesh);

});

// Rotation variables
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationVelocity = { x: 0, y: 0 };
const dampingFactor = 0.95;

// --- Mouse Events ---
renderer.domElement.addEventListener("mousedown", () => {
  isDragging = true;
});

renderer.domElement.addEventListener("mouseup", () => {
  isDragging = false;
});

renderer.domElement.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const deltaMove = {
    x: e.movementX || e.mozMovementX || e.webkitMovementX || 0,
    y: e.movementY || e.mozMovementY || e.webkitMovementY || 0
  };

  rotationVelocity.y = deltaMove.x * 0.01;
  rotationVelocity.x = deltaMove.y * 0.01;
});

// --- Touch Events ---
renderer.domElement.addEventListener(
  "touchstart",
  (e) => {
    isDragging = true;
    if (e.touches.length === 1) {
      previousMousePosition.x = e.touches[0].clientX;
      previousMousePosition.y = e.touches[0].clientY;
    }
  },
  { passive: false }
);

renderer.domElement.addEventListener("touchend", () => {
  isDragging = false;
});

renderer.domElement.addEventListener(
  "touchmove",
  (e) => {
    if (!isDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaMove = {
      x: touch.clientX - previousMousePosition.x,
      y: touch.clientY - previousMousePosition.y
    };

    rotationVelocity.y = deltaMove.x * 0.01;
    rotationVelocity.x = deltaMove.y * 0.01;

    previousMousePosition.x = touch.clientX;
    previousMousePosition.y = touch.clientY;

    e.preventDefault();
  },
  { passive: false }
);

// Animate loop
function animate() {
  requestAnimationFrame(animate);

  const spinSpeed = Math.sqrt(
    rotationVelocity.x * rotationVelocity.x +
    rotationVelocity.y * rotationVelocity.y
  );

  if (mesh && isFinished) {
    mesh.rotation.x += rotationVelocity.x;
    mesh.rotation.y += rotationVelocity.y;
  }

  rotationVelocity.x *= dampingFactor;
  rotationVelocity.y *= dampingFactor;

  if (mixer) {
  mixer.update(clock.getDelta());
  }

  renderer.render(scene, camera);
}

animate();


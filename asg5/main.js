/*
Notes to Grader:
The skybox image is a view from the starting straight of the Zwartkops Raceway in South Africa
I got it from the website https://polyhaven.com/a/zwartkops_start_afternoon
The cube texture is a picture of the clash of clans barbarian, which I found on the internet
I used ChatGPT to help me with the code
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1 Scence Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;
camera.position.y = 20;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 5 Add More Light Sources
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// DirectionalLight
const directionalLight = new THREE.DirectionalLight(0xfffff0, 1);
directionalLight.position.set(8, 3, 1.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// PointLight
const pointLight = new THREE.PointLight(0xffffff, 50, 100);
pointLight.position.set(-5, -5, -40);
scene.add(pointLight);

// 6 Skybox
const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
    'assets/posx.png',
    'assets/negx.png',
    'assets/posy.png',
    'assets/negy.png',
    'assets/posz.png',
    'assets/negz.png',
]);
scene.background = texture;

// 2 Add textures and cube
const textureLoader = new THREE.TextureLoader();
const cubeTexture = textureLoader.load('assets/barbarian.png');
cubeTexture.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.MeshStandardMaterial({ map: cubeTexture });
const geometry = new THREE.BoxGeometry(2, 2, 2);
const cube = new THREE.Mesh(geometry, material);

cube.position.z = -40;
cube.position.y = -2.5;
cube.castShadow = true;
cube.receiveShadow = true;

scene.add(cube);

// 3 Add 3D Models
const gltfLoader = new GLTFLoader();
// Toyota AE86
gltfLoader.load('assets/ae86.glb', (gltf) => {
    const car1 = gltf.scene;
    car1.position.set(-20, -9.8, -5);
    car1.scale.set(0.7, 0.7, 0.7);
    car1.rotation.y = Math.PI / 3.5;

    car1.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    car1.castShadow = true;
    car1.receiveShadow = true;
    scene.add(car1);
});

// Mazda RX-7
gltfLoader.load('assets/mazda.glb', (gltf) => {
    const car2 = gltf.scene;
    car2.position.set(9, -10, -5);
    car2.scale.set(3, 3, 3);

    car2.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    car2.castShadow = true;
    car2.receiveShadow = true;
    scene.add(car2);
});

// Lamborghini Aventador
gltfLoader.load('assets/lambo.glb', (gltf) => {
    const car3 = gltf.scene;
    car3.position.set(20, -10, -5);
    car3.rotation.y = -Math.PI / 3.5;
    car3.scale.set(0.03, 0.03, 0.03);

    car3.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    car3.castShadow = true;
    car3.receiveShadow = true;
    scene.add(car3);
});

// Floor
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);

plane.rotation.x = -Math.PI / 2;
plane.position.y = -10;
plane.receiveShadow = true;

scene.add(plane);

// Concert
const stageGroup = new THREE.Group();
const stageBaseGeometry = new THREE.BoxGeometry(40, 3, 12);
const stageBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const stageBase = new THREE.Mesh(stageBaseGeometry, stageBaseMaterial);

stageBase.position.set(0, -8.5, -40);
stageBase.receiveShadow = true;

stageGroup.add(stageBase);

// Stage Corners
for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
        const truss = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 10, 0.7),
            new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        truss.position.set(i * 18, -3, -40 + j * 5);
        truss.castShadow = true;
        stageGroup.add(truss);
    }
}

// Top Beam
const beam = new THREE.Mesh(
    new THREE.BoxGeometry(36, 0.5, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x444444 })
);
beam.position.set(0, 2, -35);
beam.castShadow = true;

stageGroup.add(beam);

// Spotlights
for (let i = -15; i <= 15; i += 6) {
    const spotlight = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 1, 16),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    spotlight.rotation.x = Math.PI / 2;
    spotlight.position.set(i, 2, -34.5);
    spotlight.castShadow = true;
    stageGroup.add(spotlight);

    const light = new THREE.PointLight(0xffffcc, 1.5, 20);
    light.position.set(i, 1.5, -34.5);
    stageGroup.add(light);
}

// Crowd
for (let i = -18; i <= 18; i += 3) {
    for (let j = 0; j < 4; j++) {
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 1.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x3333ff })
        );
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffcccc })
        );
        const zPos = -25 + j * 2;
        body.position.set(i, -9.4, zPos);
        head.position.set(i, -8.4, zPos);
        body.castShadow = true;
        head.castShadow = true;
        stageGroup.add(body);
        stageGroup.add(head);
    }
}

scene.add(stageGroup);

// Drift Car
let driftCar;
let speed = 0;

gltfLoader.load('assets/gtr.glb', (gltf) => {
    driftCar = gltf.scene;
    driftCar.scale.set(2, 2, 2);
    driftCar.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });
    scene.add(driftCar);
});

// 4 Camera Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function animate() {
    controls.update();

    // Animate the cube
    cube.rotation.y += 0.005;
    cube.rotation.z += 0.005;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    
    if (driftCar) {
        speed += 0.02;

        const radius = -10;
        const centerX = 0;
        const centerZ = 20;

        driftCar.position.x = centerX + radius * Math.cos(speed);
        driftCar.position.z = centerZ + radius * Math.sin(speed);
        driftCar.position.y = -8.3;

        // Rotate the drift direction
        driftCar.rotation.y = -speed + Math.PI / 2;
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
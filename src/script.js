import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'
import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {
    firefliesCount: 35
}
const gui = new GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

// Textures
const bakedTexture = textureLoader.load('baked.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

// Material
const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture
})

// Pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFE0C0
})

// Portal light material
const portalLightMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTime: { value: 0 },
        uColorStart: { value: new THREE.Color(0x2bc582) },
        uColorEnd: { value: new THREE.Color(0x274277) }
    }
})

debugObject.portalColorStart = '#2bc582'
debugObject.portalColorEnd = '#274277'
portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)

gui.addColor(debugObject, 'portalColorStart').onChange(() => {
    portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart)
})
gui.addColor(debugObject, 'portalColorEnd').onChange(() => {
    portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd)
})

// Model
gltfLoader.load(
    'portal-baked.glb',
    (gltf) => {
        // gltf.scene.traverse((child) => {
            const bakedMesh = gltf.scene.children.find((child) => child.name === 'baked')
            bakedMesh.material = bakedMaterial
            const poleLightA = gltf.scene.children.find((child) => child.name === 'Cube004')
            poleLightA.material = poleLightMaterial
            const poleLightB = gltf.scene.children.find((child) => child.name === 'Cube028')
            poleLightB.material = poleLightMaterial
            const portalLightMesh = gltf.scene.children.find((child) => child.name === 'Circle')
            portalLightMesh.material = portalLightMaterial
                
            
        // })
        scene.add(gltf.scene)
    }
)

// Fireflies
const firefliesGeometry = new THREE.BufferGeometry()

const updateFireflies = () => {
    const firefliesCount = debugObject.firefliesCount
    const firefliesPositionsArray = new Float32Array(firefliesCount * 3)
    const scaleArray = new Float32Array(firefliesCount)

    for (let i = 0; i < firefliesCount; i++) {
        firefliesPositionsArray[i * 3 + 0] = (Math.random() - 0.5) * 4
        firefliesPositionsArray[i * 3 + 1] = Math.random() * 1.5
        firefliesPositionsArray[i * 3 + 2] = (Math.random() - 0.5) * 4

        scaleArray[i] = Math.random()
    }
    firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(firefliesPositionsArray, 3))
    firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))
}

updateFireflies()

const firefliesShaderMaterial = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 200.0 },
        uTime: { value: 0 }
    }
})

gui.add(firefliesShaderMaterial.uniforms.uSize, 'value').min(10).max(500).step(1).name('firefliesSize')
gui.add(debugObject, 'firefliesCount').min(1).max(100).step(1).name('firefliesCount').onChange(() => {
    updateFireflies()
})

const fireflies = new THREE.Points(firefliesGeometry, firefliesShaderMaterial)
scene.add(fireflies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    firefliesShaderMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
debugObject.clearColor = '#18161d'

renderer.setClearColor(debugObject.clearColor)

gui.addColor(debugObject, 'clearColor').onChange(() => {
    renderer.setClearColor(debugObject.clearColor)
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Update fireflies
    firefliesShaderMaterial.uniforms.uTime.value = elapsedTime

    // Update portal
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
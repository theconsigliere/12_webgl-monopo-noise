import * as THREE from "three"
import backgroundFragment from "./shader/backgroundFragment.glsl"
import foregroundFragment from "./shader/foregroundFragment.glsl"
import backgroundVertex from "./shader/backgroundVertex.glsl"
import foregroundVertex from "./shader/foregroundVertex.glsl"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import gui from "lil-gui"
import gsap from "gsap"

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene()

    this.container = options.dom
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0xeeeeee, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    )

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 1.3)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.time = 0

    this.isPlaying = true

    this.addObjects()
    this.resize()
    this.render()
    this.setupResize()
    // this.settings()
  }

  settings() {
    let that = this
    this.settings = {
      progress: 0,
    }
    this.gui = new dat.GUI()
    this.gui.add(this.settings, "progress", 0, 1, 0.01)
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this))
  }

  resize() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
  }

  addObjects() {
    this.backgroundMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: backgroundVertex,
      fragmentShader: backgroundFragment,
    })

    this.backgroundGeometry = new THREE.SphereGeometry(5, 32, 32)

    this.backgroundSphere = new THREE.Mesh(
      this.backgroundGeometry,
      this.backgroundMaterial
    )
    this.scene.add(this.backgroundSphere)

    this.foregroundMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: foregroundVertex,
      fragmentShader: foregroundFragment,
    })

    this.foregroundGeometry = new THREE.SphereGeometry(0.4, 32, 32)

    this.foregroundSphere = new THREE.Mesh(
      this.foregroundGeometry,
      this.foregroundMaterial
    )
    this.scene.add(this.foregroundSphere)
  }

  stop() {
    this.isPlaying = false
  }

  play() {
    if (!this.isPlaying) {
      this.render()
      this.isPlaying = true
    }
  }

  render() {
    if (!this.isPlaying) return
    this.time += 0.01
    this.foregroundMaterial.uniforms.time.value = this.time
    this.backgroundMaterial.uniforms.time.value = this.time
    requestAnimationFrame(this.render.bind(this))
    this.renderer.render(this.scene, this.camera)
  }
}

new Sketch({
  dom: document.getElementById("container"),
})

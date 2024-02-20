import * as THREE from "three"
import backgroundFragment from "./shader/backgroundFragment.glsl"
import fresnelFragment from "./shader/fresnelFragment.glsl"
import backgroundVertex from "./shader/backgroundVertex.glsl"
import fresnelVertex from "./shader/fresnelVertex.glsl"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import gui from "lil-gui"
import gsap from "gsap"

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"
import { postProcessingShader } from "./postProcessingShader"

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene()

    this.container = options.dom
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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
    this.initPostprocessing()
    this.resize()
    this.render()
    this.setupResize()
    this.settings()
  }

  initPostprocessing() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    const effect1 = new ShaderPass(postProcessingShader)
    effect1.uniforms["scale"].value = 4
    this.composer.addPass(effect1)
  }

  settings() {
    this.settings = {
      mRefractionRatio: 1.02,
      mFresnelBias: 0.1,
      mFresnelScale: 4,
      mFresnelPower: 2,
      uZoom: 0.1,
    }
    this.gui = new gui()

    this.gui.add(this.settings, "mRefractionRatio", 0, 3, 0.01).onChange(() => {
      this.fresnelMaterial.uniforms.mRefractionRatio.value =
        this.settings.mRefractionRatio
    })
    this.gui.add(this.settings, "mFresnelBias", 0, 3, 0.01).onChange(() => {
      this.fresnelMaterial.uniforms.mFresnelBias.value =
        this.settings.mFresnelBias
    })
    this.gui.add(this.settings, "mFresnelScale", 0, 3, 0.01).onChange(() => {
      this.fresnelMaterial.uniforms.mFresnelScale.value =
        this.settings.mFresnelScale
    })
    this.gui.add(this.settings, "mFresnelPower", 0, 3, 0.01).onChange(() => {
      this.fresnelMaterial.uniforms.mFresnelPower.value =
        this.settings.mFresnelPower
    })

    this.gui.add(this.settings, "uZoom", 0, 1, 0.01).onChange(() => {
      this.backgroundMaterial.uniforms.uZoom.value = this.settings.uZoom
    })
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
    // fresnel cube texture
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter,
      colorSpace: THREE.SRGBColorSpace,
    })

    // render scene from sphere to use as texture
    this.cubeCamera = new THREE.CubeCamera(0.1, 10, this.cubeRenderTarget)

    this.backgroundMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uZoom: { value: 0.1 },
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

    this.fresnelMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        tCube: { value: 0 },
        mRefractionRatio: { value: 1.02 },
        mFresnelBias: { value: 0.1 },
        mFresnelScale: { value: 4 },
        mFresnelPower: { value: 2 },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: fresnelVertex,
      fragmentShader: fresnelFragment,
    })

    this.fresnelGeometry = new THREE.SphereGeometry(0.4, 32, 32)

    this.fresnelSphere = new THREE.Mesh(
      this.fresnelGeometry,
      this.fresnelMaterial
    )
    this.scene.add(this.fresnelSphere)
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
    this.time += 0.005
    this.fresnelSphere.visible = false
    this.cubeCamera.update(this.renderer, this.scene)
    this.fresnelSphere.visible = true
    this.fresnelMaterial.uniforms.tCube.value = this.cubeRenderTarget.texture
    this.backgroundMaterial.uniforms.time.value = this.time
    requestAnimationFrame(this.render.bind(this))
    this.renderer.render(this.scene, this.camera)
    this.composer.render(this.scene, this.camera)
  }
}

new Sketch({
  dom: document.getElementById("container"),
})

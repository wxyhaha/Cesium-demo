<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { TileMapServiceImageryProvider, Viewer, buildModuleUrl,Ion} from 'cesium'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import * as Cesium from "cesium";
import {handleDraw} from './utils/drawFun'

const viewerDivRef = ref<HTMLDivElement>()
window.CESIUM_BASE_URL = 'libs/cesium/'

Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZmNlZDU1MS01YTQ5LTQ1MmUtYWEwNy1mODE0ZmVkNGRjNjkiLCJpZCI6NjQ2MzksImlhdCI6MTYyOTM1NzA4N30.2j6cvbNnE4Y9q1vpkUgefr35Gw9anPiuWegkPPpIl1I'

const cesiumOption={
  animation: false, // 隐藏动画控件
  baseLayerPicker: false, // 隐藏图层选择控件
  fullscreenButton: false, // 隐藏全屏按钮
  vrButton: false, // 隐藏VR按钮，默认false
  geocoder: false, // 隐藏地名查找控件
  homeButton: false, // 隐藏Home按钮
  infoBox: false, // 隐藏点击要素之后显示的信息窗口
  sceneModePicker: false, // 隐藏场景模式选择控件
  selectionIndicator: true, // 显示实体对象选择框，默认true
  timeline: false, // 隐藏时间线控件
  navigationHelpButton: false, // 隐藏帮助按钮
  scene3DOnly: true, // 每个几何实例将只在3D中呈现，以节省GPU内存
  shouldAnimate: true, // 开启动画自动播放
  sceneMode: 3, // 初始场景模式 1：2D 2：2D循环 3：3D，默认3
  requestRenderMode: false, // 减少Cesium渲染新帧总时间并减少Cesium在应用程序中总体CPU使用率
  // 如场景中的元素没有随仿真时间变化，请考虑将设置maximumRenderTimeChange为较高的值，例如Infinity
  maximumRenderTimeChange: Infinity,
  terrainProvider: undefined,
  imageryProvider: undefined,
  contextOptions: {
    webgl: {
      alpha: true,
      depth: true,
      stencil: true,
      antialias: true,
      premultipliedAlpha: true,
      //通过canvas.toDataURL()实现截图需要将该项设置为true
      preserveDrawingBuffer: true,
      failIfMajorPerformanceCaveat: true,
    },
  },
}

const mapViewer=ref()

onMounted(() => {
  mapViewer.value=new Viewer(viewerDivRef.value as HTMLElement, {
    imageryProvider: new TileMapServiceImageryProvider({
      url: 'libs/cesium/Assets/Textures/NaturalEarthII',
    }),
    ...cesiumOption
  })

  mapViewer.value.scene.globe.depthTestAgainstTerrain = true
  mapViewer.value.cesiumWidget._creditContainer.style.display = 'none'
})

</script>

<template>
  <div id="cesium-viewer" ref="viewerDivRef">
    <div class="handleButtons">
      <el-button @click="handleDraw('point',mapViewer)">画点</el-button>
      <el-button @click="handleDraw('Polyline',mapViewer)">画线</el-button>
      <el-button @click="handleDraw('Polygon',mapViewer)">画面</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#cesium-viewer {
  width: 100%;
  height: 100%;
  position: relative;
}
.handleButtons{
  position: absolute;
  top: 25px;
  left: 25px;
  display: flex;
  z-index: 99;
  >button{
    margin: 0 10px;
  }
}
</style>

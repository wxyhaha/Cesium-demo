<script setup>
import { onMounted, ref } from 'vue'
import { TileMapServiceImageryProvider, Viewer,Ion} from 'cesium'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'
import * as Cesium from "cesium";
import {has} from "lodash-es";
import axios from "axios";
import { parseFromWK } from 'wkt-parser-helper'
import { Cartesian3 } from 'cesium'
import {addImagery, removeOtherRemoteImg} from "../utils/mapUtils";

const dataSource = new Cesium.CzmlDataSource();
const mapViewer=ref()


window.CESIUM_BASE_URL = 'libs/cesium/'


Ion.defaultAccessToken =
    'xxx'

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

onMounted(() => {
  initMap()
})

const loadRemoteImgToMap=(imgInfo)=>{
  removeOtherRemoteImg(mapViewer.value)

  const {properties} = imgInfo
  const filePathArr = properties.filepath.split(';')
  const tifFilePath = filePathArr.find((path) => /\.tif(f)?|\.TIF(F)?/.test(path)) || filePathArr?.[0] || ''
  const filepath = has(properties, 'rootpath') ? properties.rootpath + tifFilePath : tifFilePath
  const params = {
    RequestType: 'OpenImage',
    enhanceImage: 'none',
    filepath,
    isdb: "false"
  }
  const url = 'http://xxx/preview2/rscloud/wmts/InstructServer/*'
  axios.post(url, params).then((res) => {
    const imgUrl = `http://xxx/preview2/rscloud/wmts/MapServer?sid=${res.data.sid}&service=wmts&request=getTile&tileMatrix={z}&TileRow={x}&TileCol={y}&format=image/jpg`
    const west=imgInfo.geometry.coordinates[0][0][0]
    const south=imgInfo.geometry.coordinates[0][1][1]
    const east=imgInfo.geometry.coordinates[0][2][0]
    const north=imgInfo.geometry.coordinates[0][0][1]
    addImagery(mapViewer.value,{
      options: {
        url: imgUrl,
        rectangle: Cesium.Rectangle.fromDegrees(west,south,east,north),
      },
      providerName: 'UrlTemplateImageryProvider',
      uuid:properties.uuid ,
      type: 'remoteSensingImagery',
      properties: imgInfo,
    })

    const {metainfo} = res.data
    if (metainfo && metainfo.geo_latlon_rect) {
      let wkt = metainfo.geo_latlon_rect.wkt
      if (wkt) {
        const geojson = parseFromWK(wkt)
        const center = getImageryCenter(geojson.coordinates[0][0], geojson.coordinates[0][2])
        mapViewer.value.camera.flyTo({
          destination: Cartesian3.fromDegrees(center[0], center[1], (properties.height ? properties.height :1500)),
        })
      }
    }
  })
}

const initMap=()=>{
  mapViewer.value=new Viewer('cesium-viewer', {
    imageryProvider: new TileMapServiceImageryProvider({
      url: 'libs/cesium/Assets/Textures/NaturalEarthII',
    }),
    ...cesiumOption
  })

  mapViewer.value.scene.globe.depthTestAgainstTerrain = true
  mapViewer.value.cesiumWidget._creditContainer.style.display = 'none'

  mapViewer.value.dataSources.add(dataSource);
}

const getImageryCenter=(p1, p2)=>{
  const x = p1[0] + (p2[0] - p1[0]) / 2
  const y = p1[1] + (p2[1] - p1[1]) / 2
  return [x, y]
}

defineExpose({loadRemoteImgToMap,mapViewer})
</script>

<template>
  <div id="cesium-viewer"/>
</template>

<style lang="scss" scoped>
#cesium-viewer {
  height: 100%;
  width: 100%;
  position: relative;
}
</style>

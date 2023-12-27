<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { TileMapServiceImageryProvider, Viewer, buildModuleUrl,Ion} from 'cesium'
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'

const viewerDivRef = ref<HTMLDivElement>()
window.CESIUM_BASE_URL = 'libs/cesium/'

Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZmNlZDU1MS01YTQ5LTQ1MmUtYWEwNy1mODE0ZmVkNGRjNjkiLCJpZCI6NjQ2MzksImlhdCI6MTYyOTM1NzA4N30.2j6cvbNnE4Y9q1vpkUgefr35Gw9anPiuWegkPPpIl1I'

onMounted(() => {
  new Viewer(viewerDivRef.value as HTMLElement, {
    imageryProvider: new TileMapServiceImageryProvider({
      url: 'libs/cesium/Assets/Textures/NaturalEarthII',
    })
  })
})
</script>

<template>
  <div id="cesium-viewer" ref="viewerDivRef"></div>
</template>

<style scoped>
#cesium-viewer {
  width: 100%;
  height: 100%;
}
</style>

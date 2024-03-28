<template>
  <div class="contentWrapper">
    <div class="remoteImgList">
      <el-table :data="remoteImgList" class="remoteImgList_table" @row-click="handleRow" border highlight-current-row>
        <el-table-column prop="properties.title" label="影像名称" width="300"/>
      </el-table>
      <el-pagination small layout="prev, pager, next" :total="remoteImgListCount"
                     @current-change="handleChangePageNum"/>
    </div>
    <CesiumMap ref="cesiumMapRef"/>
    <div class="handleButtons">
      <el-button @click="handleDraw('point',cesiumMapRef.mapViewer)">画点</el-button>
      <el-button @click="handleDraw('Polyline',cesiumMapRef.mapViewer)">画线</el-button>
      <el-button @click="handleDraw('Polygon',cesiumMapRef.mapViewer)">画面</el-button>
      <el-button @click="handleEdit(cesiumMapRef.mapViewer)">编辑</el-button>
      <el-button @click="handleLoadCzml">加载CZML</el-button>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import axios from "axios";
import {calcFromTo} from "../utils/tools";
import CesiumMap from '../components/cesiumMap.vue'
import {handleDraw,handleEdit} from '../utils/drawFun'
import * as Cesium from "cesium";
import {czml} from "../../public/test";

const remoteImgListCount = ref(0)
const tablePageNum = ref(1)
const remoteImgList = ref([])
const cesiumMapRef = ref()

const dataSource = new Cesium.CzmlDataSource();

onMounted(() => {
  getRemoteListCount()
  getRemoteList()
})

function handleChangePageNum(val) {
  tablePageNum.value = val
}

function handleRow(val) {
  cesiumMapRef.value.loadRemoteImgToMap(val)
}

function getRemoteListCount() {
  axios.get(window._CONFIG.remoteImgListQuery + '&geoformat=count').then((res) => {
    remoteImgListCount.value = res.data.count
  })
}

function getRemoteList() {
  const {from, to} = calcFromTo(remoteImgListCount.value, tablePageNum.value, 10)
  axios.get(window._CONFIG.remoteImgListQuery + `&from=${from}&to=${to}`).then((res) => {
    remoteImgList.value = res.data.features
  })
}

const handleLoadCzml=()=>{
  Cesium.CzmlDataSource.load(czml).then((data) => {
    dataSource.value = data
    cesiumMapRef.value.mapViewer.dataSources.add(data)
  })
  cesiumMapRef.value.mapViewer.clock.shouldAnimate = true
  cesiumMapRef.value.mapViewer.camera.flyTo({
    destination : Cesium.Cartesian3.fromDegrees(120.1905, 30.2509, 5000),
    duration : 3
  });
}
</script>

<style lang="scss" scoped>
.contentWrapper {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.remoteImgList {
  height: 100%;
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}

.remoteImgList_table {
  width: 100%;
  height: 95%;
  border-radius: 5px;
}
.handleButtons{
  position: absolute;
  top: 25px;
  right: 25px;
  display: flex;
  z-index: 99;
  >button{
    margin: 0 10px;
  }
}
</style>

import * as Cesium from "cesium";
import { Cartesian3 } from 'cesium'
import {ElMessage} from "element-plus";
import {
    addArea,
    addLabel,
    drawPoint,
    drawPointLabel,
    drawPolygon,
    drawPolyline,
    getArea,
    getLength,
    getMidpoint
} from "./measureOnMap";
import {ref} from "vue";
import {guid} from "./tools";

const tempEntities = ref([])
const pointNum = ref(0)
const floatingPoint = ref()
const activeShape = ref()

export const handleDraw=(type,viewer)=>{
    let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    let tempEntities1 = tempEntities.value
    let floatingPoint1 = floatingPoint.value
    let activeShape1 = activeShape.value
    let position = []
    let tempPoints = []
    let activeShapePoints = []

    viewer.entities.removeAll()

    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    if(type==='point'){
        ElMessage({message: '点击鼠标左键选点，选点结束须点击鼠标右键', type: 'success'})
        tempEntities.value = []
        pointNum.value = 0

        // 监听鼠标移动
        handler.setInputAction(function (movement) {
            if (Cesium.defined(floatingPoint1)) {
                let newPosition = viewer.scene.pickPosition(movement.endPosition)
                if (Cesium.defined(newPosition)) {
                    floatingPoint1.position.setValue(newPosition)
                    activeShapePoints.pop()
                    activeShapePoints.push(newPosition)
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

        handler.setInputAction(function (click) {
            viewer.entities.removeAll()
            let earthPosition = viewer.scene.pickPosition(click.position)
            if (Cesium.defined(earthPosition)) {
                floatingPoint1 = drawPoint(viewer, earthPosition)
            }
            // 获取位置信息
            // 从相机位置创建一条射线，这条射线通过世界中movement.position像素所在的坐标,返回Cartesian3坐标
            let ray = viewer.camera.getPickRay(click.position)
            // 找到射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3坐标
            position = viewer.scene.globe.pick(ray, viewer.scene)
            console.log('position555', position)
            const cartographic = Cesium.Cartographic.fromCartesian(
                position
            );
            const longitudeString = Cesium.Math.toDegrees(
                cartographic.longitude
            ).toFixed(4);
            const latitudeString = Cesium.Math.toDegrees(
                cartographic.latitude
            ).toFixed(4);
            tempPoints.push(position) // 记录点位
            pointNum.value += 1
            let tempLength = tempPoints.length // 记录点数
            // 调用绘制点的接口
            const text = `经度: ${`${longitudeString}°`}` + `\n纬度: ${`${latitudeString}°`}`
            let point = drawPointLabel(viewer, tempPoints[tempPoints.length - 1], text)
            // asyncDrawPoint(tempPoints[tempPoints.length - 1], text)
            tempEntities1.push(point)
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        // 右键单击结束画线
        handler.setInputAction(function (click) {
            activeShapePoints.pop()
            viewer.entities.remove(activeShapePoints)
            viewer.entities.remove(floatingPoint1)
            tempPoints = [] // 清空点位记录
            handler.destroy()
            handler = null
            floatingPoint1 = undefined
            activeShape1 = undefined
            activeShapePoints = []
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }else if(type==='Polyline'){
        ElMessage({message: '点击鼠标左键选点进行距离量测，量测结束必须点击鼠标右键以结束流程', type: 'success'})
        handler.setInputAction(function (movement) {
            if (Cesium.defined(floatingPoint1)) {
                let newPosition = viewer.scene.pickPosition(movement.endPosition)
                if (Cesium.defined(newPosition)) {
                    floatingPoint1.position.setValue(newPosition)
                    activeShapePoints.pop()
                    activeShapePoints.push(newPosition)
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        // 左键单击开始画线
        handler.setInputAction(function (click) {
            let earthPosition = viewer.scene.pickPosition(click.position)
            if (Cesium.defined(earthPosition)) {
                floatingPoint1 = drawPoint(viewer, earthPosition)
            }
            // 获取位置信息
            // 从相机位置创建一条射线，这条射线通过世界中movement.position像素所在的坐标,返回Cartesian3坐标
            let ray = viewer.camera.getPickRay(click.position)
            // 找到射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3坐标
            position = viewer.scene.globe.pick(ray, viewer.scene)
            tempPoints.push(position) // 记录点位
            pointNum.value += 1
            let tempLength = tempPoints.length // 记录点数
            // 调用绘制点的接口
            let point = drawPointLabel(viewer, tempPoints[tempPoints.length - 1])
            tempEntities1.push(point)
            // 存在超过一个点时
            if (tempLength > 1) {
                // 绘制线
                let pointLength = getLength(tempPoints[tempPoints.length - 2], tempPoints[tempPoints.length - 1])
                let midPosition = getMidpoint(tempPoints[tempPoints.length - 2], tempPoints[tempPoints.length - 1])
                let pointline = drawPolyline(viewer, [tempPoints[tempPoints.length - 2], tempPoints[tempPoints.length - 1]])
                let pointLabel = addLabel(viewer, midPosition, pointLength)
                tempEntities1.push(pointline) // 保存记录
                tempEntities1.push(pointLabel)
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        // 右键单击结束画线
        handler.setInputAction(function (click) {
            activeShapePoints.pop()
            viewer.entities.remove(activeShapePoints)
            viewer.entities.remove(floatingPoint1)
            tempPoints = [] // 清空点位记录
            handler.destroy()
            handler = null
            floatingPoint1 = undefined
            activeShape1 = undefined
            activeShapePoints = []
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }else if(type==='Polygon'){
        const associatedId=guid()
        ElMessage({message: '点击鼠标左键选点，选点数量须为3个及以上，选点结束点击鼠标右键计算面积', type: 'success'})
        // 取消鼠标双击事件
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        // 监听鼠标移动
        handler.setInputAction(function (movement) {
            if (Cesium.defined(floatingPoint1)) {
                let newPosition = viewer.scene.pickPosition(movement.endPosition)
                if (Cesium.defined(newPosition)) {
                    floatingPoint1.position.setValue(newPosition)
                    activeShapePoints.pop()
                    activeShapePoints.push(newPosition)
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        // 左键单击开始画线
        handler.setInputAction(function (click) {
            let earthPosition = viewer.scene.pickPosition(click.position)
            // if (Cesium.defined(earthPosition)) {
            //     if (activeShapePoints.length === 0) {
            //         floatingPoint1 = drawPoint(viewer, earthPosition)
            //         activeShapePoints.push(earthPosition)
            //         const dynamicPositions = new Cesium.CallbackProperty(function () {
            //             return new Cesium.PolygonHierarchy(activeShapePoints)
            //         }, false)
            //         activeShape1 = drawPolygon(viewer, dynamicPositions,associatedId)
            //     }
            //     activeShapePoints.push(earthPosition)
            // }
            // 获取位置信息
            let ray = viewer.camera.getPickRay(click.position)
            position = viewer.scene.globe.pick(ray, viewer.scene)
            tempPoints.push(position) // 记录点位
            let tempLength = tempPoints.length // 记录点数
            pointNum.value += 1
            // 调用绘制点的接口
            let point = drawPointLabel(viewer, tempPoints[tempPoints.length - 1],associatedId)
            tempEntities1.push(point)
            // 存在超过一个点时
            if (tempLength > 1) {
                // 绘制线
                let pointline = drawPolyline(viewer, [tempPoints[tempPoints.length - 2], tempPoints[tempPoints.length - 1]])
                tempEntities1.push(pointline) // 保存记录
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        // 右键单击结束画面
        handler.setInputAction(function (click) {
            // 选择一个椭球或地图
            let cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid)
            if (cartesian) {
                let tempLength = tempPoints.length
                if (tempLength < 3) {
                    ElMessage.error("画面需要至少3个点")
                } else {
                    // 闭合最后一条线
                    let pointline = drawPolyline(viewer, [tempPoints[0], tempPoints[tempPoints.length - 1]])
                    tempEntities1.push(pointline)
                    console.log('tempPoints',tempPoints)
                    drawPolygon(viewer, tempPoints,associatedId)
                    let pointArea = getArea(tempPoints)
                    addArea(viewer, JSON.stringify(pointArea), tempPoints)
                    tempEntities1.push(tempPoints)
                    tempEntities1.forEach(e=>viewer.entities.remove(e))
                    handler.destroy()
                    handler = null
                }
            }
            activeShapePoints.pop()
            viewer.entities.remove(activeShapePoints)
            viewer.entities.remove(floatingPoint1)
            floatingPoint1 = undefined
            activeShapePoints = []
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
}



export const handleEdit=(viewer)=>{
    const {scene}=viewer
    let handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
    let onEditPoint=[]
    let newVertexs=[]
    let pickEntity

    let leftDownFlag=false
    let pointDraged

    handler.setInputAction(function (movement) {
        pickEntity = scene.pick(movement.position);
        if(pickEntity.id.polygon){
            pickEntity.id.polygon.hierarchy._value.positions.forEach(e=>{
                onEditPoint.push(drawPointLabel(viewer,e))
            })
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(function (evt) {
        pointDraged = scene.pick(evt.position);
        leftDownFlag = true;
        if (Cesium.defined(pointDraged) && pointDraged.id) {
            scene.screenSpaceCameraController.enableRotate = false;//锁定相机
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(function (evt) {
        leftDownFlag = false;
        pointDraged=null;
        scene.screenSpaceCameraController.enableRotate = true;//解锁相机
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.setInputAction(function (evt) {
        newVertexs=[]
        if (leftDownFlag && pointDraged != null) {
            const startPoint=scene.pick(evt.startPosition);
            if(!startPoint) return
            let ray = viewer.camera.getPickRay(evt.endPosition);
            startPoint.id.position._value=scene.globe.pick(ray, scene)
            onEditPoint.forEach(e=>{
                newVertexs.push(e.position._value)
            })
            pickEntity.id.polygon.hierarchy._value.positions=newVertexs
            viewer.entities.values.forEach(entity => {
                if (entity.polygon && entity.id===pickEntity?.id.id) {
                    entity.polygon.hierarchy = newVertexs;
                }
            });
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function () {
        handler.destroy()
        onEditPoint.forEach(e=>viewer.entities.remove(e))
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

import * as Cesium from "cesium";
// 测距部分
/* 空间两点距离计算函数 */

export function getLength (start:any, end:any) {
    // 将起点与终点位置信息从笛卡尔坐标形式转换为Cartographic形式
    let startCartographic = Cesium.Cartographic.fromCartesian(start)
    let endCartographic = Cesium.Cartographic.fromCartesian(end)
    // 初始化测地线
    let geodesic = new Cesium.EllipsoidGeodesic()
    // 设置测地线起点和终点，EllipsoidGeodesic中setEndPoints常与surfaceDistance搭配使用
    geodesic.setEndPoints(startCartographic, endCartographic)
    // 获取起点和终点之间的表面距离，单位为km，规定四舍五入保留两位小数
    // surfaceDistance返回number 单位为m，带小数
    // console.log((geodesic.surfaceDistance / 1000).toFixed(2))
    return (geodesic.surfaceDistance/1000).toFixed(2)
}
/* 空间两点计算中点函数 */
export function getMidpoint (start, end) {
    let startPoint = Cesium.Cartographic.fromCartesian(start)
    let endPoint = Cesium.Cartographic.fromCartesian(end)
    let geodesic = new Cesium.EllipsoidGeodesic()
    geodesic.setEndPoints(startPoint, endPoint)
    let geoPoint = geodesic.interpolateUsingFraction(0.5)
    console.log(Cesium.Ellipsoid.WGS84.cartographicToCartesian(geoPoint))
    return Cesium.Ellipsoid.WGS84.cartographicToCartesian(geoPoint)
}
/* 在线段中点处添加标签，显示长度 */
export function addLabel (viewer,midPoint, labelLength) {
    return viewer.entities.add({
        name: '中点',
        position: midPoint,
        label: {
            text: labelLength*1000 + 'm',
            font: '20px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            backgroundColor: Cesium.Color.BLACK,
            showBackground: true,
            style: Cesium.LabelStyle.FILL,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
    })
}

//测面部分
/* 测量空间面积 */
// 方向
export function Bearing (from, to) {
    let fromCartographic = Cesium.Cartographic.fromCartesian(from)
    let toCartographic = Cesium.Cartographic.fromCartesian(to)
    let lat1 = fromCartographic.latitude
    let lon1 = fromCartographic.longitude
    let lat2 = toCartographic.latitude
    let lon2 = toCartographic.longitude
    let angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2))
    if (angle < 0) {
        angle += Math.PI * 2.0
    }
    return angle
}
// 角度
export function pointAngle (point1, point2, point3) {
    let bearing21 = Bearing(point2, point1)
    let bearing23 = Bearing(point2, point3)
    let angle = bearing21 - bearing23
    if (angle < 0) {
        angle += Math.PI * 2.0
    }
    return angle
}
/* 计算空间面积 */
export function getArea (positions) {
    let res = 0
    for (let i = 0; i < positions.length - 2; i++) {
        let j = (i + 1) % positions.length
        let k = (i + 2) % positions.length
        let totalAngle = pointAngle(positions[i], positions[j], positions[k])
        let tempLength1 = getLength(positions[j], positions[0])
        let tempLength2 = getLength(positions[k], positions[0])
        res += tempLength1 * tempLength2 * Math.sin(totalAngle) / 2
    }
    res = res.toFixed(6)
    // console.log(res)
    res = parseFloat(res)
    // console.log(Math.abs(res))
    return Math.abs(res)
}
/* 在最后一个点处添加标签，显示面积 */
export function addArea (viewer,area, positions) {
    return viewer.entities.add({
        name: '多边形面积',
        position: positions[positions.length - 1],
        label: {
            text: area + '平方公里',
            font: '20px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            backgroundColor: Cesium.Color.BLACK,
            showBackground: true,
            style: Cesium.LabelStyle.FILL,
            pixelOffset: new Cesium.Cartesian2(60, -60),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
    })
}

/* 绘制函数 */
export function drawPointLabel (viewer,position,associatedId?, pointNum?) {
    // 本质上就是添加一个点的实体
    return viewer.entities.add({
        name: '点几何对象',
        position: position,
        associatedId:associatedId,
        point: {
            color: Cesium.Color.WHEAT,
            pixelSize: 10,
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY, //
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 规定贴地
            eyeOffset: new Cesium.Cartesian3(0, 0, -10000)
        },
        label: {
            text: pointNum,
            font: '15px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineWidth: 1,
            backgroundColor: Cesium.Color.BLACK,
            showBackground: true,
            style: Cesium.LabelStyle.FILL,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            eyeOffset: new Cesium.Cartesian3(0, 0, -50000)
        }
    })
}
export function drawPoint (viewer,position) {
    // 本质上就是添加一个点的实体
    return viewer.entities.add({
        position: position,
        point: {
            color: Cesium.Color.WHEAT,
            pixelSize: 10,
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND // 规定贴地
        }
    })
}
export function drawPolyline (viewer,positions) {
    if (positions.length < 1) return
    return viewer.entities.add({
        name: '线几何对象',
        polyline: {
            positions: positions,
            width: 5.0,
            material: new Cesium.PolylineGlowMaterialProperty({
                // eslint-disable-next-line new-cap
                color: Cesium.Color.WHEAT
            }),
            depthFailMaterial: new Cesium.PolylineGlowMaterialProperty({
                // eslint-disable-next-line new-cap
                color: Cesium.Color.WHEAT
            }),
            clampToGround: true
        }
    })
}
export function drawPolygon (viewer,positions,associatedId?) {
    if (positions.length < 2) return
    return viewer.entities.add({
        name: '面几何对象',
        associatedId:associatedId,
        polygon: {
            hierarchy: positions,
            // eslint-disable-next-line new-cap
            material: new Cesium.ColorMaterialProperty(
                Cesium.Color.WHEAT.withAlpha(0.4)
            )
        }
    })
}

// 实时显示鼠标坐标
export function showPosition(viewer:any){
    const entity = viewer.viewer.entities.add({
        label: {
            show: false,
            showBackground: true,
            font: "14px monospace",
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(15, 0),
        },
    });
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.viewer.scene.canvas);
    handler.setInputAction(function (movement) {
        const cartesian = viewer.viewer.camera.pickEllipsoid(
            movement.endPosition,
            viewer.viewer.scene.globe.ellipsoid
        );
        if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(
                cartesian
            );
            const longitudeString = Cesium.Math.toDegrees(
                cartographic.longitude
            ).toFixed(4);
            const latitudeString = Cesium.Math.toDegrees(
                cartographic.latitude
            ).toFixed(4);
            entity.position = cartesian;
            entity.label.show = true;
            entity.label.text =
                `经度: ${`${longitudeString}°`}` +
                `\n纬度: ${`${latitudeString}°`}`;
            entity.label.eyeOffset= new Cesium.Cartesian3(0, 0, -10000)
        } else {
            entity.label.show = false;
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}
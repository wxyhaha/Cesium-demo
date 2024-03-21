import * as Cesium from 'cesium'
import { Viewer, ImageryLayer } from 'cesium'

export const syncImageries=(viewer)=>{
    const imageries=[]
    const ils = viewer.imageryLayers
    const len = ils.length
    for (let i = 0; i < len; i++) {
        const layer = ils.get(i)
        imageries.push({
            name: layer.name || '<Unknown>',
            uuid: layer.uuid || '<Unknown>',
            providerName: layer.imageryProvider.constructor.name,
            show: layer.show,
            type: layer.type,
            properties: layer.properties,
        })
    }
    return imageries
}

export const addImagery=(viewer,item)=>{
    const provider = new Cesium[item.providerName]({
        ...(item.options || {}),
    })
    provider.readyPromise.then((success)=> {
        item.afterReady && item.afterReady(viewer, success)
    })
    const layer = new ImageryLayer(provider)
    layer.name = item?.name
    layer.uuid = item?.uuid
    layer.type = item?.type
    layer.properties = item?.properties
    const ils = viewer.imageryLayers
    ils.add(layer)
    return layer
}

export const removeOtherRemoteImg=(viewer)=>{
    const layers=viewer.imageryLayers._layers
    for(let i=0;i<layers.length;i++){
        if(layers[i].type==='remoteSensingImagery'){
            viewer.imageryLayers.remove(layers[i])
        }
    }
}
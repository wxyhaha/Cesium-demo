import * as Cesium from 'cesium'

type ResultImage = Promise<HTMLImageElement | HTMLCanvasElement> | undefined

const templateRegex = /{[^}]+}/g
const tags: Record<string, Function> = { x: xTag, y: yTag, z: zTag }

function xTag(
  imageryProvider: GeTileImageryProvider,
  x: string,
  _: string,
  __: string,
) {
  return padWithZerosIfNecessary(imageryProvider, '{x}', x)
}

function yTag(
  imageryProvider: GeTileImageryProvider,
  _: string,
  y: string,
  __: string,
) {
  return padWithZerosIfNecessary(imageryProvider, '{y}', y)
}

function zTag(
  imageryProvider: GeTileImageryProvider,
  _: string,
  __: string,
  level: string,
) {
  return padWithZerosIfNecessary(imageryProvider, '{z}', level)
}

function padWithZerosIfNecessary(
  imageryProvider: GeTileImageryProvider,
  key: string,
  value: string,
) {
  if (imageryProvider.urlSchemeZeroPadding && Object.hasOwnProperty.call(imageryProvider.urlSchemeZeroPadding, key)) {
    const paddingTemplate = imageryProvider.urlSchemeZeroPadding[key]
    if (typeof paddingTemplate === 'string') {
      const paddingTemplateWidth = paddingTemplate.length
      if (paddingTemplateWidth > 1) {
        value
          = value.length >= paddingTemplateWidth
            ? value
            : new Array(
              paddingTemplateWidth - value.toString().length + 1,
            ).join('0') + value
      }
    }
  }
  return value
}

interface GeTileImageryProviderOptions {
  url: string
  timeUrl: string
  clock?: Cesium.Clock
  times?: Cesium.TimeIntervalCollection
  tileWidth?: number
  tileHeight?: number
  minimumLevel?: number
  maximumLevel?: number
}

export default class GeTileImageryProvider implements Cesium.ImageryProvider {
  defaultAlpha: number | undefined
  defaultNightAlpha: number | undefined
  defaultDayAlpha: number | undefined
  defaultBrightness: number | undefined
  defaultContrast: number | undefined
  defaultHue: number | undefined
  defaultSaturation: number | undefined
  defaultGamma: number | undefined
  // @ts-expect-error defaultMinificationFilter
  defaultMinificationFilter: Cesium.TextureMinificationFilter
  // @ts-expect-error defaultMinificationFilter
  defaultMagnificationFilter: Cesium.TextureMagnificationFilter

  private options: GeTileImageryProviderOptions
  timeResource: Cesium.Resource

  public get ready(): boolean {
    return (
      Cesium.defined(this._resource) && Cesium.defined(this._timeDynamicImagery)
    )
  }

  rectangle: Cesium.Rectangle
  tileWidth: number
  tileHeight: number
  maximumLevel: number | undefined
  minimumLevel: number
  tilingScheme: Cesium.TilingScheme
  errorEvent: Cesium.Event
  // @ts-expect-error defaultMinificationFilter
  credit: Cesium.Credit
  hasAlphaChannel: boolean
  readyPromise: Promise<boolean>
  public get proxy(): Cesium.Proxy {
    return this._resource.proxy
  }

  public set proxy(value: Cesium.Proxy) {
    this._resource.proxy = value
  }

  // @ts-expect-error defaultMinificationFilter
  tileDiscardPolicy: Cesium.TileDiscardPolicy

  private readonly _resource: Cesium.Resource
  private _timeDynamicImagery: Cesium.TimeDynamicImagery | undefined
  private _reload: undefined | Function

  private _urlSchemeZeroPadding: Record<string, string> | undefined
  public get urlSchemeZeroPadding() {
    return this._urlSchemeZeroPadding
  }

  public set urlSchemeZeroPadding(value) {
    this._urlSchemeZeroPadding = value
  }

  public clock: Cesium.Clock | undefined
  public times: Cesium.TimeIntervalCollection | undefined

  constructor(options: GeTileImageryProviderOptions) {
    if (!Cesium.defined(options.url))
      throw new Cesium.DeveloperError('options.url is required')

    if (!Cesium.defined(options.timeUrl))
      throw new Cesium.DeveloperError('options.timeUrl is required')

    this.options = options

    this.tileWidth = Cesium.defaultValue(options.tileWidth, 256)
    this.tileHeight = Cesium.defaultValue(options.tileHeight, 256)

    this.minimumLevel = Cesium.defaultValue(options.minimumLevel, 0)
    this.maximumLevel = options.maximumLevel

    this.tilingScheme = new Cesium.GeographicTilingScheme({
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 2,
      rectangle: new Cesium.Rectangle(-Math.PI, -Math.PI, Math.PI, Math.PI),
    })
    this.errorEvent = new Cesium.Event()
    this.hasAlphaChannel = true

    this.rectangle = this.tilingScheme.rectangle
    this._resource = new Cesium.Resource({ url: options.url })
    this.timeResource = new Cesium.Resource({ url: this.options.timeUrl })

    this._reload = undefined
    this.initTimeDynamicImagery()
    this.readyPromise = Promise.resolve(true)
  }

  public async reloadTimeDynamicImagery(
    x = 0,
    y = 0,
    z = 0,
  ) {
    const { startTimeISO, endTimeISO } = await this.getTimeInterval(x, y, z)
    if (this.clock) {
      this.clock.currentTime = Cesium.JulianDate.fromIso8601(startTimeISO)
      this.clock.startTime = Cesium.JulianDate.fromIso8601(startTimeISO)
      this.clock.stopTime = Cesium.JulianDate.fromIso8601(endTimeISO)
      this.times = this.createTimes(startTimeISO, endTimeISO)
    }
    return { startTimeISO, endTimeISO }
  }

  private async getTimeInterval(x = 0, y = 0, z = 0) {
    this.timeResource.setTemplateValues({
      x,
      y,
      z,
    })
    const timeRes: number[] = await this.timeResource.fetchJson()
    if (!Cesium.defined(timeRes))
      throw new Cesium.DeveloperError('tile Interval request error')

    timeRes.sort((a, b) => a - b)
    const startTimeISO = new Date(timeRes[0] * 1000).toISOString()
    const endTimeISO = new Date(
      timeRes[timeRes.length - 1] * 1000,
    ).toISOString()

    return { startTimeISO, endTimeISO }
  }

  private async initTimeDynamicImagery() {
    const now = new Date()
    const _startTimeISO: string = now.toISOString()
    const _endTimeISO: string = new Date(
      now.getTime() - 7 * 24 * 3600 * 1000,
    ).toISOString()

    // 时间段
    if (Cesium.defined(this.options.timeUrl)) {
      const { startTimeISO, endTimeISO } = await this.getTimeInterval()
      this.times = this.createTimes(startTimeISO, endTimeISO)
    }
    else {
      this.times
        = this.options.times || this.createTimes(_startTimeISO, _endTimeISO)
    }

    // 钟
    if (this.options.clock) {
      this.clock = this.options.clock
      this.clock.startTime = Cesium.JulianDate.fromIso8601(_startTimeISO)
      this.clock.stopTime = Cesium.JulianDate.fromIso8601(_endTimeISO)
      this.clock.currentTime = Cesium.JulianDate.fromIso8601(_startTimeISO)
    }
    else {
      this.clock = new Cesium.Clock({
        startTime: Cesium.JulianDate.fromIso8601(_startTimeISO),
        stopTime: Cesium.JulianDate.fromIso8601(_endTimeISO),
        currentTime: Cesium.JulianDate.fromIso8601(_startTimeISO),
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this
    this._timeDynamicImagery = new Cesium.TimeDynamicImagery({
      clock: this.clock,
      times: this.times,
      requestImageFunction(x, y, level, request, interval) {
        return geTileRequestImage(that, x, y, level, request, interval)
      },
      reloadFunction() {
        if (Cesium.defined(that._reload))
          that._reload?.()
      },
    })

    return { startTimeISO: _startTimeISO, endTimeISO: _endTimeISO }
  }

  getResource() {
    return this._resource
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTileCredits(x: number, y: number, level: number): Cesium.Credit[] {
    // @ts-expect-error getTileCredits
    return undefined
  }

  // 选取瓦片调用的方法，
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pickFeatures(x: number, y: number, level: number, longitude: number, latitude: number): Promise<Cesium.ImageryLayerFeatureInfo[]> | undefined {
    return undefined
  }

  requestImage(
    x: number,
    y: number,
    level: number,
    request: Cesium.Request,
  ): ResultImage {
    let result: ResultImage
    let currentInterval
    const timeDynamicImagery = this._timeDynamicImagery
    // Try and load from cache
    if (timeDynamicImagery) {
      currentInterval = timeDynamicImagery.currentInterval
      result = timeDynamicImagery.getFromCache(x, y, level, request)
    }

    // Couldn't load from cache
    if (!Cesium.defined(result))
      result = geTileRequestImage(this, x, y, level, request, currentInterval)

    // If we are approaching an interval, preload this tile in the next interval
    if (Cesium.defined(result) && timeDynamicImagery)
      timeDynamicImagery.checkApproachingInterval(x, y, level, request)

    return result
  }

  createTimes(startTimeISO: string, _endTimeISO: string) {
    return Cesium.TimeIntervalCollection.fromIso8601({
      iso8601: `${startTimeISO}/2998-12-31T16:00:00.000Z/P1D`,
      leadingInterval: true,
      trailingInterval: true,
      isStopIncluded: false,
      dataCallback: (interval, index) => {
        let time: string
        if (index === 0)
          time = Cesium.JulianDate.toIso8601(interval.stop)

        else
          time = Cesium.JulianDate.toIso8601(interval.start)

        return {
          Time: time,
        }
      },
    })
  }
}

function geTileRequestImage(
  imageryProvider: GeTileImageryProvider,
  x: number,
  y: number,
  level: number,
  request: Cesium.Request,
  interval?: Cesium.TimeInterval,
): ResultImage {
  const _resource = imageryProvider.getResource()
  const url = _resource.getUrlComponent(true)
  const allTags = tags
  const templateValues: Record<string, string | number> = {}
  const match = url.match(templateRegex)

  if (interval) {
    templateValues.time = Math.floor(
      Cesium.JulianDate.toDate(
        Cesium.JulianDate.fromIso8601(interval.data.Time),
      ).getTime() / 1000,
    )
  }
  if (match) {
    match.forEach((tag) => {
      const key = tag.substring(1, tag.length - 1)
      if (Cesium.defined(allTags[key]))
        templateValues[key] = allTags[key](imageryProvider, x, y, level)
    })
  }

  const resource = _resource.getDerivedResource({
    request,
    templateValues,
  })

  return Cesium.ImageryProvider.loadImage(imageryProvider, resource)
}

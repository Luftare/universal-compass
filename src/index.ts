type HeadingCallback = (heading: number) => void;

export class UniversalCompass {
  private headingCallback?: HeadingCallback;
  private handleAbsolute: (e: DeviceOrientationEvent) => void;
  private handleWebkit: (e: any) => void;
  private listenersAdded = false;

  constructor() {
    this.handleAbsolute = this.onDeviceOrientationAbsolute.bind(this);
    this.handleWebkit = this.onDeviceOrientationWebkit.bind(this);
  }

  async requestPermission(): Promise<void> {
    if (!window.DeviceOrientationEvent) {
      throw new Error("DeviceOrientation API is not available");
    }

    const requestPermissionFn = (DeviceOrientationEvent as any)
      .requestPermission;

    if (typeof requestPermissionFn === "function") {
      const response = await requestPermissionFn();
      if (response !== "granted") {
        throw new Error("Permission for DeviceOrientationEvent not granted");
      }
    }

    this.addListeners();
  }

  onHeading(callback: HeadingCallback): void {
    this.headingCallback = callback;

    if (!this.listenersAdded) {
      this.addListeners();
    }
  }

  stop(): void {
    window.removeEventListener(
      "deviceorientationabsolute",
      this.handleAbsolute
    );
    window.removeEventListener("deviceorientation", this.handleWebkit);
    this.listenersAdded = false;
    this.headingCallback = undefined;
  }

  private addListeners() {
    window.addEventListener("deviceorientationabsolute", this.handleAbsolute);
    window.addEventListener("deviceorientation", this.handleWebkit);
    this.listenersAdded = true;
  }

  private onDeviceOrientationAbsolute(e: DeviceOrientationEvent): void {
    if (!e.absolute || e.alpha == null || e.beta == null || e.gamma == null)
      return;

    let compass = -(e.alpha + (e.beta * e.gamma) / 90);
    compass -= Math.floor(compass / 360) * 360; // Wrap into range [0,360].

    this.headingCallback?.(compass);
  }

  private onDeviceOrientationWebkit(e: any): void {
    const compass = e.webkitCompassHeading;
    if (typeof compass === "number" && !isNaN(compass)) {
      this.headingCallback?.(compass);
    }
  }
}

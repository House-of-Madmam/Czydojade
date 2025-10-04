class GeolocationService {
  // Check if geolocation is supported
  static isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  }

  // Get the current position
  static getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!this.isGeolocationSupported()) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  // Watch the position
  static watchPosition(
    successCallback: (position: GeolocationPosition) => void,
    errorCallback?: (error: GeolocationPositionError) => void,
    options?: PositionOptions,
  ): number {
    if (!this.isGeolocationSupported()) {
      throw new Error('Geolocation is not supported by this browser.');
    }

    return navigator.geolocation.watchPosition(successCallback, errorCallback, options);
  }

  // Clear a watcher
  static clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }
}


export default GeolocationService;

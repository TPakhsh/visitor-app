export function seedCoords() {
  try {
    const saved = localStorage.getItem("last_known_coords");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { lat: 35.6892, lng: 51.3890 }; // Tehran fallback
}

export function rememberCoords(coords) {
  try {
    localStorage.setItem("last_known_coords", JSON.stringify(coords));
  } catch {}
}

export function usePlatformLocation() {
  let state = { loading: false, error: "" };

  async function getCurrent() {
    state.loading = true;
    state.error = "";

    const timeout = (p, ms = 12000) =>
      Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms)),
      ]);

    try {
      if (!navigator.geolocation)
        throw new Error("مرورگر از موقعیت مکانی پشتیبانی نمی‌کند");

      const pos = await timeout(
        new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          })
        )
      );
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, source: "web" };
    } catch (e) {
      state.error = e?.message || "خطا در دریافت موقعیت";
      throw e;
    } finally {
      state.loading = false;
    }
  }

  return {
    getCurrent,
    get loading() {
      return state.loading;
    },
    get error() {
      return state.error;
    },
  };
}

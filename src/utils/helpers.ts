export const randomCharacters = (length: number) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const randomNumber = (length: number) => {
    const chars = "0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export interface BoundingBox {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

exports.getBoundingBox = (latitude: number, longitude: number, radiusKm = 10): BoundingBox => {
    const earthRadiusKm = 6371;

    // Approximate degree difference for 1 km
    const deltaLat = radiusKm / 111; // 1° lat ≈ 111 km
    const deltaLng = radiusKm / (111 * Math.cos(latitude * Math.PI / 180)); // adjusted for latitude

    const result = {
        minLat: latitude - deltaLat,
        maxLat: latitude + deltaLat,
        minLng: longitude - deltaLng,
        maxLng: longitude + deltaLng
    };
    console.log(result);
    return result
}

export const validateGeolocation = (geoLocation: unknown): [number, number] | null => {
    try {

        if (!geoLocation) {
            console.log('Empty or null geoLocation');
            return null;
        }

        const parsedLocation = typeof geoLocation === 'string'
            ? JSON.parse(geoLocation)
            : geoLocation;

        if (
          Array.isArray(parsedLocation) &&
          parsedLocation.length === 2 &&
          typeof parsedLocation[0] === "number" &&
          typeof parsedLocation[1] === "number"
        ) {
          console.log("Valid coordinates:", parsedLocation);
          return parsedLocation as [number, number];
        }
        console.log(geoLocation);

        return null;


    } catch (error) {
        console.error('Error parsing geoLocation:', error);
        return null;
    }
}
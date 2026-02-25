


export interface DailyWeather {
    date: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
    precipitation: number;
}

export interface WeatherData {
    current: {
        temp: number;
        code: number;
        humidity: number;
    };
    daily: DailyWeather[];
}

const LAT = -34.5175; // Exact user location
const LON = -58.5331;

export const weatherService = {
    async getForecast(): Promise<WeatherData | null> {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FArgentina%2FBuenos_Aires`
            );
            const data = await response.json();

            if (!data || !data.daily || !data.current) return null;

            const { time, temperature_2m_max, temperature_2m_min, weathercode, precipitation_sum } = data.daily;

            const daily = time.map((date: string, index: number) => ({
                date,
                maxTemp: temperature_2m_max[index],
                minTemp: temperature_2m_min[index],
                weatherCode: weathercode[index],
                precipitation: precipitation_sum[index]
            })).slice(0, 7);

            return {
                current: {
                    temp: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m,
                    code: data.current.weather_code
                },
                daily
            };
        } catch (error) {
            console.error('Error fetching weather:', error);
            return null;
        }
    }
};

// Reemplaza esto con tu API Key real
const API_KEY = "REDACTED_OLD_API_KEY";

async function listarModelosCompatibles() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        console.log("Consultando la API de Google...");
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status} - ${respuesta.statusText}`);
        }

        const datos = await respuesta.json();

        console.log("\n✅ Modelos disponibles para tu API Key:\n");

        // Filtramos solo los nombres para que sea más fácil de leer
        const nombresDeModelos = datos.models.map(modelo => modelo.name);
        console.table(nombresDeModelos);

    } catch (error) {
        console.error("Hubo un error al consultar los modelos:", error.message);
    }
}

listarModelosCompatibles();
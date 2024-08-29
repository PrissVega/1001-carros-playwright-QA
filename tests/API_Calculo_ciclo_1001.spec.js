const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Función combinada para leer y convertir datos de Excel a una estructura similar a la API
const readAndConvertExcelDataToAPIFormat = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    // Convertir datos a una estructura similar a la de la API
    const excelData = { plazos: {} };

    jsonData.forEach(row => {
      const plazoKey = `p_${row.Plazo}`;
      excelData.plazos[plazoKey] = {
        pvp_vehiculo: row.pvp_vehiculo.toString(),
        accesorios: row.accesorios.toString(),
        Años_Adicionales_Titania: row.Años_Adicionales_Titania.toString(),
        Gastos_Legales: row.Gastos_Legales.toString(),
        Monto_Total: row.Monto_Total.toString(),
        Cuota_de_entrada: row.Cuota_de_entrada.toString(),
        Cuota_final: row.Cuota_final.toString(),
        Monto_a_financiar_pago_final: row.Monto_a_financiar_pago_final.toString(),
        Monto_a_financiar_pagos_mensuales: row.Monto_a_financiar_pagos_mensuales.toString(),
        Monto_a_financiar: row.Monto_a_financiar.toString(),
        Plazo: row.Plazo.toString(),
        Tasa_de_Financiamiento: row.Tasa_de_Financiamiento.toString(),
        Interes: row.Interes.toString(),
        Cuota_Mensual: row.Cuota_Mensual.toString(),
        Seguro_de_vehículo: row.Seguro_de_vehículo.toString(),
        Cuota_seguro: row.Cuota_seguro.toString(),
        Cuota_Total: row.Cuota_Total.toString(),
        Depreciación_estimada: row.Depreciación_estimada.toString(),
        Porcentaje_de_entrada: row.Porcentaje_de_entrada.toString(),
        Porcentaje_de_cuota_final: row.Porcentaje_de_cuota_final.toString(),
        VALOR_TOTAL_PAGADO_1: row.VALOR_TOTAL_PAGADO_1.toString(),
        ME_QUEDO_CON_EL_VEHÍCULO: row.ME_QUEDO_CON_EL_VEHÍCULO.toString(),
        VALOR_TOTAL_PAGADO_2: row.VALOR_TOTAL_PAGADO_2.toString()
      };
    });

    return excelData;
  } catch (error) {
    console.error('Error al leer o convertir el archivo Excel:', error);
    throw error;
  }
};

// Función para comparar los datos de la API con los datos del Excel
const compareData = (apiData, excelData) => {
  const comparePlazos = (plazosApi, plazosExcel) => {
    return Object.keys(plazosApi).every(plazoKey => {
      const excelPlazo = plazosExcel[plazoKey];
      const apiPlazo = plazosApi[plazoKey];
      return Object.keys(excelPlazo).every(key => {
        const result = apiPlazo[key] == excelPlazo[key]; // Usar == para comparar diferentes tipos
        if (!result) {
          console.log(`Discrepancia encontrada en Plazo: ${plazoKey} - Campo: ${key} | API: ${apiPlazo[key]}, Excel: ${excelPlazo[key]}`);
        }
        return result;
      });
    });
  };

  return comparePlazos(apiData.plazos, excelData.plazos);
};

// Test de Playwright
test('Comparar datos de API con Excel', async ({ page }) => {
  const apiUrl = 'https://api2.qa.epicentro-digital.com/api/financiamiento_1001carrosV2';
  const token = '213|3e2FDZKkpRWmQwinJkM35dpTJGgnPDBldGpb00tt'; 

  const requestData = {
    financiamiento: {
      modelo: "test2",
      pvp_vehiculo: "20500",
      titania_seguro: 356,
      accesorios: 0,
      cuota_de_entrada: "7175",
      plazos: [24, 36, 48],
      tipo: "ciclo_1001"
    }
  };

  try {
    // Registrar el inicio del tiempo
    const startTime = Date.now();

    // Realizar la solicitud POST con el Bearer Token en los headers
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const apiData = response.data.data;
    const statusCode = response.status; // Obtener el código de estado de la respuesta

    // Registrar el fin del tiempo y calcular la duración
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Ruta del archivo Excel usando __dirname para la ruta relativa
    const filePath = path.join(__dirname, 'output_calculo.xlsx');

    // Verifica si el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo ${filePath} no existe.`);
    }

    // Lee los datos desde el archivo Excel y los convierte a una estructura similar a la API
    const excelData = readAndConvertExcelDataToAPIFormat(filePath);

    // Imprime los datos para depuración
    console.log('Datos de la API:', apiData);
    console.log('Datos del Excel:', excelData);

    // Imprime el código de estado y el tiempo de respuesta
    console.log(`Código de respuesta de la API: ${statusCode}`);
    console.log(`Tiempo de respuesta de la API: ${responseTime} ms`);

    // Comparar los datos
    const comparisonResult = compareData(apiData, excelData);

    // Imprimir el resultado de la comparación
    if (comparisonResult) {
      console.log('La comparación entre el Excel y la API es correcta. Los datos coinciden.');
    } else {
      console.log('La comparación entre el Excel y la API no es correcta. Existen discrepancias en los datos.');
    }

    // Afirmar que los datos coinciden con el modelo
    expect(comparisonResult).toBe(true);

  } catch (error) {
    console.error('Error al obtener datos o realizar comparación:', error);
    expect(false).toBe(true);
  }
});

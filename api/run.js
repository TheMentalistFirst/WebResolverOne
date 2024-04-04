//const chromium = require("@sparticuz/chromium")
//const puppeteer = require("puppeteer-core")

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import os from "os";

export default async function handler(request, response) {
  let _executablePath = ""
  if (os.platform() === 'win32') {
    _executablePath = process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath);
  } else {
    _executablePath = await chromium.executablePath;

  }

  // Normal is
  // url=https://www.example.com&headers=[]

  const dataIn64 = request.query.data;
  const data = Buffer.from(dataIn64, 'base64').toString('utf-8');
  // {"url":"https://bestx.stream/v/dHyG5UeEexI0/","headers":{},"regex":"http.+hls.+stream.+m3u8","wait":1,"js":[]}
  const jsonData = JSON.parse(data);

  const headers =  jsonData.headers;
  const embedUrl = jsonData.url;
  const regex = jsonData.regex;
  const waitInSeconds = jsonData.wait;
  const jsCodeList = jsonData.js;


  /*
  console.log(headers);
  console.log(embedUrl);
  console.log(regex);
  console.log(waitInSeconds);
  console.log(jsCode);
*/

  const browser = await puppeteer.launch({
    //args: chromium.args,
    executablePath: _executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--single-process"
    ],
    ignoreDefaultArgs: ["--disable-extensions"],
    ignoreHTTPSErrors: true,
  })
  console.log(os.platform());
  try {
    const page = await browser.newPage();
    page.on('popup', async popup => {
      await popup.close();
    });
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
      // "/assets/js/devtools-detector_2.0.16.js

      const pattern = new RegExp('devtools-detector.*\\.js$');
      if (pattern.test(interceptedRequest.url())) {
        console.log('Bloqueando solicitud:', interceptedRequest.url());
        interceptedRequest.abort();
      } else {
        interceptedRequest.continue();
      }

      let patternUrl = new RegExp(regex);

      if (patternUrl.test(interceptedRequest.url())) {
        console.log('Deteniendo navegador para la URL:', interceptedRequest.url());
        browser.close(); // Detener el navegador
        response.status(200).json({
          "url": interceptedRequest.url()
        });
      }

    });

    const timeoutMilliseconds = 5000;
    await page.waitForTimeout(timeoutMilliseconds);

    if (Object.keys(headers).length !== 0) {
      const extraHeaders = {};
      for (const [key, value] of Object.entries(headers)) {
        extraHeaders[key] = value;
      }

      await page.setExtraHTTPHeaders(extraHeaders);
    } else {
      console.log("El objeto de encabezados está vacío. No se establecerán encabezados adicionales.");
    }


    //await Promise.race([
      await page.goto(embedUrl /*, { waitUntil: 'networkidle2' }*/);
    //  new Promise(resolve => setTimeout(resolve, timeoutMilliseconds))
    //]);

    const delayBetweenExecutions = waitInSeconds * 1000;

    for (const jsCode of jsCodeList) {
      await new Promise((resolve) => {
        setTimeout(async () => {
          await page.evaluate(jsCode);
          resolve();
        }, delayBetweenExecutions);
      });
    }

    /*
    await page.evaluate(() => {
      const videoPlayer = document.getElementById('video_player');
      if (videoPlayer) {
        videoPlayer.click();
        console.log('Hiciste clic en el elemento con el ID "video_player"');
      } else {
        console.error('No se encontró ningún elemento con el ID "video_player"');
      }
    });

     */

    await page.close();
    await browser.close();

    response.status(200).json({
      "url": ""
    });
  } catch (error) {
    console.error('Error al cargar la página:', error);
    await browser.close();
    response.status(500).json({
      "url": ""
    });
  }


  /*
  const page = await browser.newPage();
  page.on('popup', async popup => {
    await popup.close();
  });
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    console.log('Solicitud URL:', interceptedRequest.url());

    if (interceptedRequest.url().includes('devtools-detector.min.js')) {
      interceptedRequest.abort();
    } else {
      interceptedRequest.continue();
    }
  });


  //await page.goto("file:///C:/Users/ADMIN/Documents/index.html");
  await page.goto("https://bestx.stream/v/dHyG5UeEexI0/");
  //await page.goto("https://www.example.com/");

  await page.waitForTimeout(5000);
  //const cookies = await page.cookies();
  
  const title = await page.title()


  console.log('a:AASa');

  /*
  const paragraphText = await page.evaluate(() => {
    console.log('Finish Loading pagsasasasae');

    const paragraph = document.querySelector('p');
    return paragraph.textContent;
  });

   */
  /*

  await page.close()
  await browser.close()

  response.status(200).json({
    "cookies": "paragraphText"
  })

   */

}


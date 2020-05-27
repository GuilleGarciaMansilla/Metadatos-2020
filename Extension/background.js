/*
Orden de ejecucion:

1.onBeforeRequest
2.onBeforeSendHeaders
3.onSendHeaders
4.onHeadersReceived

5.onAuthRequired
6.onBeforeRedirect
7.onResponseStarted

8.onCompleted

*/

/*
TO DO LIST:
  1.- Separar datos por boundary y procesar la informacion en funcion de los datos en processB64                OK
  2.- Ver que tipo de peticiones envio con el fetch                                                             OK
  3.- Transformar archivo ???                                                                                   OK
  4.- Salida de ficheros desde js                                                                               OK
  5.- Cancelar peticiones                                                                                       En progreso
  6.- Investigar sobre los siguentes tipos de multipart.                                                        ??
  7.- Interfaz                                                                                                  En progreso
ENLACES:
  - (INFO SOBRE LOS TIPOS MULTIPART) https://es.wikipedia.org/wiki/Multipurpose_Internet_Mail_Extensions#Related
  - https://developers.google.com/drive/api/v3/manage-uploads
  - https://cloud.google.com/storage/docs/performing-resumable-uploads#cancel-upload
  - (GMAIL API) https://developers.google.com/gmail/api/guides/uploads#multipart
*/
var idRequest; //Id de la petición
var stream;  //Necesitamos guardar el body de la petición porque llega antes que las cabeceras (donde vamos a filtrar las peticiones)
var metadata = "";
//Funcion que pregunta al orquestador sobre donde está el microsericio limpiador y envia el archivo para realizar la limpieza de metadatos.
function notification() {
  var notifOptions = {
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Metadatos limpiados',
    message: 'Se va a descargar una copia de su archivo sin metadatos a su carpeta de descargas'
  }
  chrome.notifications.create('limitNotif', notifOptions);
}
function postAndClean(formData, info) {
  //GET FROM DOCKER
  const url = "http://localhost:8085/formatos"; //Esta url puede cambiar segun donde este ubicado el orquestador
  var microservice = "";
  fetch(url)
    .then(res => {
      return res.json();
    })
    .then(data => {
      data.forEach(async element => {
        if (info.type.includes(element.nombre)) {
          microservice = element.url;
          try {
            //POST TO MS
            return fetch(microservice, {
              method: 'POST',
              body: formData
            })
              .then(response => {
                const reader = response.body.getReader();
                return new ReadableStream({
                  start(controller) {
                    return pump();
                    async function pump() {
                      const { done, value } = await reader.read();
                      // When no more data needs to be consumed, close the stream
                      if (done) {
                        controller.close();
                        return;
                      }
                      // Enqueue the next data chunk into our target stream
                      controller.enqueue(value);
                      return pump();
                    }
                  }
                })
              })
              .then(stream => new Response(stream))
              .then(response => response.blob())
              .then(blob => {
                //Creamos un nuevo blob para añadir el type, que desde el microservicio viene vacio
                blob.arrayBuffer().then(buffer => {
                  var blob = new Blob([buffer], { type: info.type });
                  console.log(blob);
                  downloadFile(URL.createObjectURL(blob));
                  notification();
                })

              })
              .catch(err => console.error(err));

          }
          catch (error) {
            return console.log('Error: ', error);
          }
        }
      });
    });
}
async function getMetadataAsync(formData, info) {
  const resp = await fetch('http://localhost:8080/metadatos/mostrar', {
    method: 'POST',
    body: formData
  })
    .then(response => {
      const reader = response.body.getReader();
      return new ReadableStream({
        start(controller) {
          return pump();
          async function pump() {
            const { done, value } = await reader.read();
            // When no more data needs to be consumed, close the stream
            if (done) {
              controller.close();
              return;
            }
            // Enqueue the next data chunk into our target stream
            controller.enqueue(value);
            return pump();
          }
        }
      })
    })
    .then(stream => new Response(stream))
    .then(response => response.text())
    .then(meta => {
      return meta;
    })
    .catch(err => console.error(err))
  return resp;
}
function getMetadata(formData,info){
  var request = new XMLHttpRequest();
  request.open("POST", "http://localhost:8080/metadatos/mostrar",false);
  request.send(formData);
  return request.responseText;
}

//Esta funcion realiza una conversión de un string en base 64 a ArrayBuffer
function _base64ToArrayBuffer(base64) {
  var binary_string = atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

//Esta funcion trocea la información de la petición para recoger la información util. Devuelve el encode , el tipo de archivo y el archivo(en base 64)
function processInfoFile(data) {
  var slices = data.split("\r\n");
  var boundary = slices[0];
  var i = 0;
  var array = [] //Empty array

  var encode = "";
  var contentType = "";
  var file = "";

  var hayFichero = false;
  //Este while busca boundarys, cuando los encuentra se recorren con el siguiente while (pero solamente se recorre una vez).
  while (i < slices.length) {
    if (slices[i].includes(boundary)) {
      i++;
      //Recorro cada trozo rodeado por boundary independientemente
      while (i < slices.length && !slices[i].includes(boundary)) {
        if (slices[i].includes("content-transfer-encoding")) {
          encode = slices[i].split(": ")[1];
          hayFichero = true;
        }
        if (slices[i].includes("content-type") && !slices[i].includes("json")) {
          contentType = slices[i].split(": ")[1];
          hayFichero = true;
        }
        if (hayFichero && slices[i] != "" && !slices[i].includes("content-transfer-encoding") && !slices[i].includes("content-type")) {
          file = slices[i];
        }
        i++;
      }
      //Para separar ficheros independientes dentro de una peticion, los guardo cada uno en una posicion de ese array
      if (hayFichero) {
        array.push({
          'encode': encode,
          'type': contentType,
          'file': file
        })
        hayFichero = false;
      }
    }
    else {
      i++;
    }
  }
  return array;
}
function downloadFile(url) {
  // Descargar el archivo
  chrome.downloads.download({
    url: url,
    filename: "limpio.png"
  });
}
//Funcion callback del action listener de onBeforeRequest 
function requestHandlerBody(details) {
  if (details.method == "POST") {
    stream = details;
  }

}
//Funcion callback del action listener de onBeforeSendHeaders
function requestHandlerHeader(details) {

  for (var i = 0; i < details.requestHeaders.length; ++i) {
    //Filtramos las cabeceras POST
    if (details.method == "POST") {
      //Filtramos los contenidos de la cabecera por content-type
      if (details.requestHeaders[i].name.toLowerCase() === 'content-type') {

        //Dentro de los content-type solamente queremos los multipart

        if (details.requestHeaders[i].value.toLowerCase().includes("multipart/related")) {
          clean = false;
          //Recogemos la id de la peticion para utilizarla en el body
          idRequest = details.requestId;
          console.log("Tenemos header ", "ID: ", idRequest);
          console.log("Header: ", details);
          if (stream.requestId == idRequest) {
            console.log("Tenemos body ", "ID: ", stream.requestId);
            console.log("Body: ", stream);

            //Decodificamos el body
            var enc = new TextDecoder("utf-8");
            var data = "";
            stream.requestBody.raw.forEach(e => {
              data += enc.decode(e.bytes);
            })

            // Procesamos el body una vez decodificado
            var infoFiles = processInfoFile(data);
            //Cada fichero se envia por separado
            infoFiles.forEach(async (e) => {
              var arrayBuffer;
              if (e.encode == "base64") {
                arrayBuffer = _base64ToArrayBuffer(e.file);
              }

              //Creamos un archivo binario a partir del body decodificado y procesado
              var blob = new Blob([arrayBuffer], { type: e.type });

              //Para enviar archivos bajo la cabecera multipart se deben procesar con un formData
              var formData = new FormData();
              formData.append('file', blob);
              // console.log("original", blob, URL.createObjectURL(blob))

              //Mandamos los datos al microservicio limpiador
              //----------------------------Asincrono----------------------
              getMetadataAsync(formData,e).then(res =>{
                console.log("async",res); 
              })
              //----------------------------Fin asincrono--------------------
              //------------------Sincrono-----------------------
              // var meta = getMetadata(formData, e);
              // console.log('r',meta);
              //-------------------Fin sincrono------------------
              clean = confirm('Este archivo contiene los siguientes metadatos: \n' + "" + '\n ¿Se desea eliminar estos metadatos?');
              if (clean) {
                //postAndClean(formData, e);
              }
            });
          }
          if (clean) { chrome.tabs.reload(); }
          return { cancel: clean };
        }
        // else if (details.requestHeaders[i].value.toLowerCase().includes("multipart/form-data")) {
        //   idRequest = details.requestId;
        //   console.log("Tenemos header form", "ID: ", idRequest);
        //   console.log("Header: ", details);
        //   if (stream.requestId == idRequest) {
        //     console.log("Tenemos body form", "ID: ", stream.requestId);
        //     console.log("Body: ", stream);
        //     console.log(JSON.stringify(stream.requestBody))

        //     var enc = new TextDecoder("utf-8");
        //     console.log(enc.decode(stream.requestBody[0],stream.requestBody[2]));
        //     console.log(details.url);

        //   }
        //   // return{cancel:true}
        // }

      }
      // else if (details.url.includes("upload_protocol=resumable")) {
      //     console.log(stream);
      //     console.log(stream.requestBody);

      // }
    }

  }

}

//Funcion callback del action listener de onHeadersReceived
function requestHandlerHeaderRcv(details) {
  console.log("RCV:", details);
}

//,types: ["xmlhttprequest"]
// enctype='multipart/form-data'
function setListeners() {
  chrome.webRequest.onBeforeSendHeaders.addListener(requestHandlerHeader,
    { urls: ["<all_urls>"] },

    ["requestHeaders", "blocking"]);
  //  chrome.webRequest.onHeadersReceived.addListener(requestHandlerHeaderRcv,
  //                                                   {urls: ["<all_urls>"]},

  //                                                   ["responseHeaders","blocking"]);                                              
  chrome.webRequest.onBeforeRequest.addListener(requestHandlerBody,
    { urls: ["<all_urls>"] },
    ['requestBody']);

  // chrome.webRequest.onCompleted.addListener(requestHandler,
  //                                          {urls: ["<all_urls>"]});
}
function removeListeners() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(requestHandlerHeader);
  chrome.webRequest.onBeforeRequest.removeListener(requestHandlerBody);
  // chrome.webRequest.onCompleted.removeListener(requestHandler);
}
setListeners();
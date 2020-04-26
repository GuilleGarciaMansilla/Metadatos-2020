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
  4.- Salida de ficheros desde js                                                                               En progreso
  5.- Cancelar peticiones                                                                                       Mas adelante
  6.- Investigar sobre los siguentes tipos de multipart.                                                        Mas adelante
ENLACES:
  - (INFO SOBRE LOS TIPOS MULTIPART) https://es.wikipedia.org/wiki/Multipurpose_Internet_Mail_Extensions#Related
  - (INFO GUAY) https://stackoverflow.com/questions/11621592/grab-file-with-chrome-extension-before-upload
  - https://stackoverflow.com/questions/36067767/how-do-i-upload-a-file-with-the-js-fetch-api/50472925#50472925
  - https://developer.mozilla.org/en-US/docs/Web/API/File/File
  - https://docs.spring.io/spring/docs/3.0.6.RELEASE_to_3.1.0.BUILD-SNAPSHOT/3.1.0.BUILD-SNAPSHOT/org/springframework/web/multipart/MultipartFile.html
  - https://gist.github.com/AshikNesin/ca4ad1ff1d24c26cb228a3fb5c72e0d5
*/

var idRequest; //Id de la petición
var stream;  //Necesitamos guardar el body de la petición porque llega antes que las cabeceras (donde vamos a filtrar las peticiones)

//Funcion que pregunta al orquestador sobre donde está el microsericio limpiador y envia el archivo para realizar la limpieza de metadatos.
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
            }).then(res => {
              if (res.ok) {
                console.log("Data sent");
              }
            })
          }
          catch (error) {
            return console.log('Error: ', error);
          }
        }
      });
    });
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

//Esta funcion trocea la información de la petición para recoger la información util. Devuelve el titulo, el tipo de archivo y el archivo(en base 64)
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
            infoFiles.forEach(e => {
              var arrayBuffer;
              if (e.encode == "base64") {
                arrayBuffer = _base64ToArrayBuffer(e.file);
              }

              //Creamos un archivo binario a partir del body decodificado y procesado
              var blob = new Blob([arrayBuffer], { type: e.type });

              //Para enviar archivos bajo la cabecera multipart se deben procesar con un formData
              var formData = new FormData();
              formData.append('file', blob);

              //Mandamos los datos al microservicio limpiador
              postAndClean(formData, e);
            });
          }
        }
        else if (details.requestHeaders[i].value.toLowerCase().includes("multipart/form-data")) {
          idRequest = details.requestId;
          console.log("Tenemos header form", "ID: ", idRequest);
          console.log("Header: ", details);
          if (stream.requestId == idRequest) {
            console.log("Tenemos body form", "ID: ", stream.requestId);
            console.log("Body: ", stream);
            var enc = new TextDecoder("utf-8");
            var formData = new FormData();
            formData.append("file", new Blob([stream.requestBody.raw[0]]));
            // console.log(formData);
            // console.log(stream.requestBody.raw[1]);
            // filepath = stream.requestBody.raw[1].file;
            // console.log(filepath);
            // console.log("Bytes",enc.decode(stream.requestBody.raw[1]));

            // console.log("Bytes0",enc.decode(stream.requestBody.raw[0].bytes));
            // console.log("Bytes0",enc.decode(stream.requestBody.raw[2].bytes));
            // stream.requestBody.raw.forEach(element => {
            //   if(element == "file"){
            //     console.log(elemten.file);
            //   }
            // });
          }
        }
      }
    }

  }

}
//Funcion callback del action listener de onHeadersReceived
function requestHandlerHeaderRcv(details) {
  //  console.log("Headers:", details);
  for (var i = 0; i < details.responseHeaders.length; ++i) {
    if (details.responseHeaders[i].name === 'content-type') {
      console.log(details.responseHeaders[i].value);
    }

  }
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
// //Con esta funcion igual se puede llegar a ver el body a trozos//prototipo!!!!!!!!
// function onBeforeRequestHandler(req) {

//   if (req.requestBody && req.requestBody.raw) {
//     var requestBody = req.requestBody.raw.map(function (data) {
//       return decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(data.bytes)));
//     }).join('')
//     console.log(requestBody);
//   }

// }
setListeners();
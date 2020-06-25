var filetypes = [];
var idRequest; //Id of the request
var stream;  //The body has to be loaded because it reaches the extension before the headers (where the request are being filtered)
var metadata = "";

//Function that pops a notification 
function notification() {
  var notifOptions = {
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Metadatos limpiados',
    message: 'Se va a descargar una copia de su archivo sin metadatos a su carpeta de descargas'
  }
  chrome.notifications.create('limitNotif', notifOptions);
}

//Sends a file to the microservice and recieve a free metadata file
function postAndClean(formData, info) {
  //GET FROM DOCKER
  microservice = getUrl(info);
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
      //New blob is created since the type is empty
      blob.arrayBuffer().then(buffer => {
        var blob = new Blob([buffer], { type: info.type });
        console.log(blob);
        downloadFile(URL.createObjectURL(blob),info.type);
        notification();
      })

    })
    .catch(err => console.error(err));
}

//Metadata query asychnronusly (not functional)

// async function getMetadataAsync(formData, info) {
//   const resp = await fetch('http://localhost:8080/metadatos/mostrar', {
//     method: 'POST',
//     body: formData
//   })
//     .then(response => {
//       const reader = response.body.getReader();
//       return new ReadableStream({
//         start(controller) {
//           return pump();
//           async function pump() {
//             const { done, value } = await reader.read();
//             // When no more data needs to be consumed, close the stream
//             if (done) {
//               controller.close();
//               return;
//             }
//             // Enqueue the next data chunk into our target stream
//             controller.enqueue(value);
//             return pump();
//           }
//         }
//       })
//     })
//     .then(stream => new Response(stream))
//     .then(response => response.text())
//     .then(meta => {
//       return meta;
//     })
//     .catch(err => console.error(err))
//   return resp;
// }

//Synchronus function. Metadata query
function getMetadata(formData, info) {
  var request = new XMLHttpRequest();
  var url = getUrlMeta(info);
  if (url != "") {
    request.open("POST", url , false);
    request.send(formData);
    return request.responseText;
  }
  return false;
}

function _base64ToArrayBuffer(base64) {
  var binary_string = atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

//Slice the information from the request to select just useful information. Returns the encode, type of file and the file(base64)
function processInfoFile(data) {
  var slices = data.split("\r\n");
  var boundary = slices[0];
  var i = 0;
  var array = [] //Empty array

  var encode = "";
  var contentType = "";
  var file = "";

  var hayFichero = false;
  //Finds boundary
  while (i < slices.length) {
    if (slices[i].includes(boundary)) {
      i++;
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
      //Each file on an array position (multi uploads)
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

//This function downloads a copy of the file
function downloadFile(url,type) {
  var format = type.split("/")[1];
  chrome.downloads.download({
    url: url,
    filename: "limpio."+format
  });
}
//Callback function from onBeforeRequest 
function requestHandlerBody(details) {
  if (details.method == "POST") {
    stream = details;
  }

}
//Callback function from onBeforeSendHeaders
function requestHandlerHeader(details) {

  for (var i = 0; i < details.requestHeaders.length; ++i) {
    //Filter POST headers
    if (details.method == "POST") {
      //Filter the content-type
      if (details.requestHeaders[i].name.toLowerCase() === 'content-type') {

        //Filter "multipart/related" content-type

        if (details.requestHeaders[i].value.toLowerCase().includes("multipart/related")) {
          
          clean = false;
          //Catch id to match the body ID
          idRequest = details.requestId;
          console.log("Tenemos header ", "ID: ", idRequest);
          console.log("Header: ", details);
          if (stream.requestId == idRequest) {
            console.log("Tenemos body ", "ID: ", stream.requestId);
            console.log("Body: ", stream);

            //Decode the body
            var enc = new TextDecoder("utf-8");
            var data = "";
            stream.requestBody.raw.forEach(e => {
              data += enc.decode(e.bytes);
            })

            // Process the body
            var infoFiles = processInfoFile(data);
            infoFiles.forEach(async (e) => {
              var found = false;
              var i = 0;
              //If the type of file is avaliable on our system the cleaning of the file can be done
              while (!found && i < filetypes.length) {
                if (e.type == filetypes[i].nombre) {
                  found = true;
                }
                i++;
              }
              if (!found) {
                //Notify the user that this file type is not compatible
                alert("La extensión " + e.type + " no es compatible con nuestra extensión.")
                clean = false;
              }
              else {
                var arrayBuffer;
                if (e.encode == "base64") { 
                  arrayBuffer = _base64ToArrayBuffer(e.file);
                }

                //Binary object is created from an ArrayBuffer and the content type
                var blob = new Blob([arrayBuffer], { type: e.type });

                //formData can be send as multipart/form-data header
                var formData = new FormData();
                formData.append('file', blob);
                // console.log("original", blob, URL.createObjectURL(blob))

                //Send the file to the cleaning microservices

                //----------------------------Asynchronus----------------------
                // getMetadataAsync(formData,e).then(res =>{
                //   console.log("async",res); 
                // })
                //---------------------------- Asynchronus--------------------
                
                //------------------Synchronus-----------------------
                var meta = getMetadata(formData, e);
                console.log('Sincrono', meta);
                clean = confirm('Este archivo contiene los siguientes metadatos: \n' + meta + '\n ¿Se desea eliminar estos metadatos?');
                if (clean) {
                  postAndClean(formData, e);
                }
              }
            });
          }
          if (clean) { chrome.tabs.reload(); }
          return { cancel: clean };
        }
        

      }
     
    }

  }

}
function getUrlMeta(info) {
  var found = false;
  var i = 0;
  var url = "";

  while (!found && i < filetypes.length) {
    if (filetypes[i].nombre == info.type) {
      url = filetypes[i].metadata;
      found = true;
    }
    i++;
  }
  console.log(url);
  return url;
}
function getUrl(info) {
  var found = false;
  var i = 0;
  var url = "";

  while (!found && i < filetypes.length) {
    if (filetypes[i].nombre == info.type) {
      url = filetypes[i].url;
      found = true;
    }
    i++;
  }
  return url;
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
async function viewTypes() {
  const url = "http://localhost:8085/formatos"; //This URL can be changed depending on where the Orchestrator is
  await fetch(url).then(res => {
    return res.json();
  }).then(data => {
    data.forEach(element => {
      var aux ={"nombre": String(element.nombre),"url":String(element.url),"metadata":String(element.metadata)}
      filetypes.push(aux);
    })
  })
}
async function start() {
  await viewTypes();
  console.log(filetypes)
  setListeners();
}
start();
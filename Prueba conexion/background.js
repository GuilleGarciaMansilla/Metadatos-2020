//GET
const url = "http://localhost/TFG/enviar.php";
// const url = "https://reqres.in/api/users";
 
fetch(url)
    .then(res => {
        return res.json();
    })
    .then(data => console.log(data));

// //POST    
// const url = "https://reqres.in/api/users";

// fetch(url, {
//     method: 'POST',
//     body: JSON.stringify({
//         name: 'User 1'
//     }),
//     headers:{'Content-Type': 'application/json'}
// })
//     .then(res => {
//         return res.json();
//     })
//     .then(data => console.log(data));
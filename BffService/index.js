const http = require('http');
const axios = require('axios');

require('dotenv').config();

const services = {
    "cart": process.env.CART_API,
    "product": process.env.PRODUCT_API
}

const cache = {
    "products":[],
    "time": Date.now()
};

const cacheExpirationTime = 120 * 1000;

const server = http.createServer(async (req, res) => {

    let method = req.method;

    let body;
    let parsedBody;
    if(method === 'POST' || method === 'PUT'){
        body = await getRequestBody(req);
        parsedBody = JSON.parse(body);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if(method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let path = req.url.split('/');
    let recipientService = path[1];
    let subPath = path.slice(2).join('/');
    let service = services[recipientService];

    if (!service) {
        sendResponse(res, 502, { error: 'Cannot process request' });
        return;
    }

    let endpoint = `${service}${subPath}`;

    //caching
    if (service === 'product' && method === 'GET') {

        if (cache.products.length > 0 && ((Date.now() - cache.time) <= cacheExpirationTime)) {
            sendResponse(res, 200, cache.products);
        }else{
            let response = await sendGetRequest(endpoint);
            cache.products = response.data;
            cache.time = Date.now();
            sendResponse(res, 200, response.data);
        }
        return;
    }

    try{
        let response;
        switch (method) {
            case "DELETE":
              response = await sendDeleteRequest(endpoint);
              break;
            case "POST":
            case "PUT":
              response = await sendPostOrPutRequest(endpoint, parsedBody, method);
              break;
            default:
              response = await sendGetRequest(endpoint);
        }
        sendResponse(res, 200, response.data);
    }catch(error){
        sendResponse(res, 500, { error: 'Failed to fetch data' });
    }
});

function getRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
}

function sendGetRequest(endpoint){
    return axios.get(endpoint);
}

function sendPostOrPutRequest(endpoint, body, method){
    if(method === 'POST'){
        return axios.post(endpoint, body);
    }else{
        return axios.put(endpoint, body);
    }
}

function sendDeleteRequest(endpoint){
    return axios.delete(endpoint);
}

function sendResponse(res, status, data){
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

const port = 4000;

server.listen(port, () => {
    console.log(`Server running at port: ${port}/`);
});

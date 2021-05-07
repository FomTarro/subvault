const { AppConfig } = require("./app.config");

const http = require('http');
const WebSocket = require('ws');

const port = AppConfig.PORT;

async function launch(){
    const httpServer = http.createServer(await AppConfig.WEB_SERVER());
    // const server = new WebSocket.Server({server: httpServer, path:'/'});

    httpServer.listen(port, () => {
        console.log(`sub-vault listening on port: ${port}`);
    });
}

launch();
